"use client";

import { useMemo, useState } from "react";
import { contractInputSchema } from "@/lib/schemas";
import type { AppContract, MaintenanceFeeTier, PlannedAbsencePeriod } from "@/lib/types";

type Props = {
  mode: "create" | "edit";
  initial?: Partial<Omit<AppContract, "startDate" | "endDate">> & {
    startDate?: string | Date;
    endDate?: string | Date | null;
  };
  onSaved?: (contract: AppContract) => void;
  contractId?: string;
};

function defaultTiers(): MaintenanceFeeTier[] {
  return [
    { minHours: 0, maxHours: 8, fee: 0 },
    { minHours: 8, maxHours: 9, fee: 0 },
    { minHours: 9, maxHours: 24, fee: 0 },
  ];
}

export function ContractForm({ mode, initial, onSaved, contractId }: Props) {
  const steps = ["Base", "Tarifs", "Indemnités"] as const;
  const parseLocaleNumber = (value: string) => Number(value.replace(",", "."));
  const parseLocaleNumberOrNull = (value: string) => {
    if (!value.trim()) return null;
    const parsed = Number(value.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  };
  const toInputValue = (value: number | string | null | undefined) =>
    value === null || value === undefined ? "" : String(value);
  const formatHours = (value: number) => `${value.toFixed(2).replace(".", ",")} h`;
  const formatCurrency = (value: number) =>
    value.toLocaleString("fr-FR", { style: "currency", currency: "EUR" });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [plannedAbsenceDraft, setPlannedAbsenceDraft] = useState<PlannedAbsencePeriod>({ startDate: "", endDate: "" });
  const [form, setForm] = useState({
    childName: initial?.childName ?? "",
    startDate: initial?.startDate ? new Date(initial.startDate).toISOString().slice(0, 10) : "",
    endDate: initial?.endDate ? new Date(initial.endDate).toISOString().slice(0, 10) : "",
    contractType: (initial?.contractType as "CDI" | "CDD") ?? "CDI",
    hoursPerDay: toInputValue(initial?.hoursPerDay ?? 8.5),
    daysPerWeek: (initial?.daysPerWeek as 2 | 3 | 4 | 5) ?? 4,
    weeksPerYear: toInputValue(initial?.weeksPerYear ?? 46),
    plannedAbsences: initial?.plannedAbsences ?? [],
    baseHourlyRate: toInputValue(initial?.baseHourlyRate ?? 0),
    allowOverride: initial?.allowOverride ?? false,
    overrideHourlyRate: toInputValue(initial?.overrideHourlyRate),
    billComplementaryHours: initial?.billComplementaryHours ?? true,
    overtimeRatePercent: (initial?.overtimeRatePercent as 10 | 15 | 25) ?? 10,
    mealFeeEnabled: initial?.mealFeeEnabled ?? false,
    mealFeePerMeal: toInputValue(initial?.mealFeePerMeal ?? 0),
    defaultMealsPerDay: toInputValue(initial?.defaultMealsPerDay ?? 1),
    maintenanceFeeEnabled: initial?.maintenanceFeeEnabled ?? false,
    maintenanceFeeTiers: ((initial?.maintenanceFeeTiers ?? defaultTiers()) as MaintenanceFeeTier[]).map((tier) => ({
      minHours: toInputValue(tier.minHours),
      maxHours: toInputValue(tier.maxHours),
      fee: toInputValue(tier.fee),
    })),
    applyPrecariousnessPrime:
      initial?.applyPrecariousnessPrime ?? ((initial?.contractType as string) === "CDD"),
  });

  const monthlyPreview = useMemo(() => {
    const hoursPerDay = parseLocaleNumberOrNull(form.hoursPerDay);
    const weeksPerYear = parseLocaleNumberOrNull(form.weeksPerYear);
    const baseHourlyRate = parseLocaleNumberOrNull(form.baseHourlyRate);
    const overrideHourlyRate = parseLocaleNumberOrNull(form.overrideHourlyRate);

    if (
      hoursPerDay === null ||
      weeksPerYear === null ||
      baseHourlyRate === null ||
      hoursPerDay <= 0 ||
      weeksPerYear <= 0
    ) {
      return null;
    }

    const effectiveHourlyRate = form.allowOverride && overrideHourlyRate !== null
      ? overrideHourlyRate
      : baseHourlyRate;
    const monthlyHours = (hoursPerDay * form.daysPerWeek * weeksPerYear) / 12;
    const monthlyBaseSalary = monthlyHours * effectiveHourlyRate;
    const monthlyContractDays = (form.daysPerWeek * weeksPerYear) / 12;

    let maintenanceDailyFee = 0;
    let monthlyMaintenanceFee = 0;
    if (form.maintenanceFeeEnabled) {
      const parsedTiers = form.maintenanceFeeTiers
        .map((tier) => ({
          minHours: parseLocaleNumberOrNull(tier.minHours),
          maxHours: parseLocaleNumberOrNull(tier.maxHours),
          fee: parseLocaleNumberOrNull(tier.fee),
        }))
        .filter(
          (tier): tier is { minHours: number; maxHours: number; fee: number } =>
            tier.minHours !== null && tier.maxHours !== null && tier.fee !== null,
        );
      const tier = parsedTiers.find((t) => hoursPerDay >= t.minHours && hoursPerDay < t.maxHours)
        ?? parsedTiers.find((t) => hoursPerDay >= t.minHours && hoursPerDay <= t.maxHours);
      maintenanceDailyFee = tier?.fee ?? 0;
      monthlyMaintenanceFee = monthlyContractDays * maintenanceDailyFee;
    }

    return {
      monthlyHours,
      monthlyContractDays,
      effectiveHourlyRate,
      monthlyBaseSalary,
      maintenanceDailyFee,
      monthlyMaintenanceFee,
      monthlyTotalWithMaintenance: monthlyBaseSalary + monthlyMaintenanceFee,
    };
  }, [
    form.allowOverride,
    form.baseHourlyRate,
    form.daysPerWeek,
    form.hoursPerDay,
    form.maintenanceFeeEnabled,
    form.maintenanceFeeTiers,
    form.overrideHourlyRate,
    form.weeksPerYear,
  ]);

  async function submit() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const payload = contractInputSchema.parse({
        childName: form.childName,
        startDate: form.startDate,
        endDate: form.endDate || null,
        contractType: form.contractType,
        hoursPerDay: parseLocaleNumber(form.hoursPerDay),
        daysPerWeek: Number(form.daysPerWeek),
        weeksPerYear: parseLocaleNumber(form.weeksPerYear),
        plannedAbsences: form.plannedAbsences,
        baseHourlyRate: parseLocaleNumber(form.baseHourlyRate),
        allowOverride: form.allowOverride,
        overrideHourlyRate:
          form.overrideHourlyRate === "" ? null : parseLocaleNumber(form.overrideHourlyRate),
        billComplementaryHours: form.billComplementaryHours,
        overtimeRatePercent: Number(form.overtimeRatePercent),
        mealFeeEnabled: form.mealFeeEnabled,
        mealFeePerMeal: parseLocaleNumber(form.mealFeePerMeal),
        defaultMealsPerDay: parseLocaleNumber(form.defaultMealsPerDay),
        maintenanceFeeEnabled: form.maintenanceFeeEnabled,
        maintenanceFeeTiers: form.maintenanceFeeTiers.map((tier) => ({
          minHours: parseLocaleNumber(tier.minHours),
          maxHours: parseLocaleNumber(tier.maxHours),
          fee: parseLocaleNumber(tier.fee),
        })),
        applyPrecariousnessPrime: form.applyPrecariousnessPrime,
      });

      const url = mode === "create" ? "/api/contracts" : `/api/contracts/${contractId}`;
      const method = mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur API");
      setSuccess(mode === "create" ? "Contrat créé" : "Contrat mis à jour");
      onSaved?.(data.contract);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  function addPlannedAbsence() {
    if (!plannedAbsenceDraft.startDate || !plannedAbsenceDraft.endDate) {
      setError("Renseignez une date de début et de fin pour l'absence prévue.");
      return;
    }
    if (plannedAbsenceDraft.endDate < plannedAbsenceDraft.startDate) {
      setError("La date de fin doit être supérieure ou égale à la date de début.");
      return;
    }
    setError(null);
    setForm({
      ...form,
      plannedAbsences: [...form.plannedAbsences, plannedAbsenceDraft].sort((a, b) =>
        a.startDate.localeCompare(b.startDate),
      ),
    });
    setPlannedAbsenceDraft({ startDate: "", endDate: "" });
  }

  function removePlannedAbsence(index: number) {
    setForm({
      ...form,
      plannedAbsences: form.plannedAbsences.filter((_, i) => i !== index),
    });
  }

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>{mode === "create" ? "Nouveau contrat" : "Modifier le contrat"}</strong>
        {success ? <span className="success small">{success}</span> : null}
      </div>
      {error ? <div className="error small">{error}</div> : null}
      <div className="mobile-steps">
        {steps.map((label, index) => (
          <button
            key={label}
            type="button"
            className="btn"
            aria-pressed={step === index}
            onClick={() => setStep(index)}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <div className="grid cols-2">
        <div className="stack" style={{ display: step === 0 ? "grid" : "none" }}>
          <div className="field">
            <label>Enfant</label>
            <input value={form.childName} onChange={(e) => setForm({ ...form, childName: e.target.value })} />
          </div>
          <div className="mobile-fields-2">
            <div className="field" style={{ flex: 1 }}>
              <label>Début</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Fin (optionnel)</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="mobile-fields-2">
            <div className="field" style={{ flex: 1 }}>
              <label>Type</label>
              <select value={form.contractType} onChange={(e) => setForm({ ...form, contractType: e.target.value as "CDI" | "CDD" })}>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
              </select>
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Jours/semaine</label>
              <select value={form.daysPerWeek} onChange={(e) => setForm({ ...form, daysPerWeek: Number(e.target.value) as 2 | 3 | 4 | 5 })}>
                {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="mobile-fields-2">
            <div className="field" style={{ flex: 1 }}>
              <label>Heures/jour</label>
              <input type="text" inputMode="decimal" value={form.hoursPerDay} onChange={(e) => setForm({ ...form, hoursPerDay: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Semaines/an</label>
              <input type="text" inputMode="numeric" value={form.weeksPerYear} onChange={(e) => setForm({ ...form, weeksPerYear: e.target.value })} />
            </div>
          </div>
        </div>

        <div className="stack" style={{ display: step === 1 ? "grid" : "none" }}>
          <div className="mobile-fields-2">
            <div className="field" style={{ flex: 1 }}>
              <label>Taux base (0 = auto via grille)</label>
              <input type="text" inputMode="decimal" value={form.baseHourlyRate} onChange={(e) => setForm({ ...form, baseHourlyRate: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Majoration %</label>
              <select value={form.overtimeRatePercent} onChange={(e) => setForm({ ...form, overtimeRatePercent: Number(e.target.value) as 10 | 15 | 25 })}>
                {[10, 15, 25].map((n) => <option key={n} value={n}>{n}%</option>)}
              </select>
            </div>
          </div>
          <label className="row"><input type="checkbox" checked={form.allowOverride} onChange={(e) => setForm({ ...form, allowOverride: e.target.checked })} /> Override taux horaire</label>
          <div className="field">
            <label>Taux horaire override</label>
            <input type="text" inputMode="decimal" value={form.overrideHourlyRate} onChange={(e) => setForm({ ...form, overrideHourlyRate: e.target.value })} />
          </div>
          <label className="row"><input type="checkbox" checked={form.billComplementaryHours} onChange={(e) => setForm({ ...form, billComplementaryHours: e.target.checked })} /> Facturer heures complémentaires</label>
          <label className="row"><input type="checkbox" checked={form.applyPrecariousnessPrime} onChange={(e) => setForm({ ...form, applyPrecariousnessPrime: e.target.checked })} /> Prime de précarité (CDD)</label>
          <div className="card stack">
            <strong>Simulation mensuelle en direct</strong>
            {monthlyPreview ? (
              <>
                <div className="small muted">Hypothèse : présence chaque jour prévu au contrat.</div>
                <div className="small">Heures mensuelles estimées : <strong>{formatHours(monthlyPreview.monthlyHours)}</strong></div>
                <div className="small">Jours mensuels estimés : <strong>{monthlyPreview.monthlyContractDays.toFixed(2).replace(".", ",")} j</strong></div>
                <div className="small">Taux horaire appliqué : <strong>{formatCurrency(monthlyPreview.effectiveHourlyRate)}</strong></div>
                <div className="small">Salaire mensuel (hors indemnités) : <strong>{formatCurrency(monthlyPreview.monthlyBaseSalary)}</strong></div>
                <div className="small">Entretien/jour : <strong>{formatCurrency(monthlyPreview.maintenanceDailyFee)}</strong></div>
                <div className="small">Entretien mensuel estimé : <strong>{formatCurrency(monthlyPreview.monthlyMaintenanceFee)}</strong></div>
                <div className="small">Total mensuel estimé (salaire + entretien) : <strong>{formatCurrency(monthlyPreview.monthlyTotalWithMaintenance)}</strong></div>
              </>
            ) : (
              <div className="small muted">Renseignez les heures/jour, semaines/an et taux horaire pour afficher la simulation.</div>
            )}
          </div>
        </div>

        <div className="stack" style={{ display: step === 2 ? "grid" : "none" }}>
          <label className="row"><input type="checkbox" checked={form.mealFeeEnabled} onChange={(e) => setForm({ ...form, mealFeeEnabled: e.target.checked })} /> Indemnité repas activée</label>
          <div className="mobile-fields-2">
            <div className="field" style={{ flex: 1 }}>
              <label>Repas / unité</label>
              <input type="text" inputMode="decimal" value={form.mealFeePerMeal} onChange={(e) => setForm({ ...form, mealFeePerMeal: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Repas/jour défaut</label>
              <input type="text" inputMode="numeric" value={form.defaultMealsPerDay} onChange={(e) => setForm({ ...form, defaultMealsPerDay: e.target.value })} />
            </div>
          </div>
          <label className="row"><input type="checkbox" checked={form.maintenanceFeeEnabled} onChange={(e) => setForm({ ...form, maintenanceFeeEnabled: e.target.checked })} /> Indemnité entretien activée</label>
          <div className="stack">
            <label className="small muted">Tranches entretien (table)</label>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Min h</th>
                    <th>Max h</th>
                    <th>Montant/jour</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {form.maintenanceFeeTiers.map((tier, index) => (
                    <tr key={`${index}-${tier.minHours}-${tier.maxHours}`}>
                      <td>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={tier.minHours}
                          onChange={(e) => {
                            const next = [...form.maintenanceFeeTiers];
                            next[index] = { ...tier, minHours: e.target.value };
                            setForm({ ...form, maintenanceFeeTiers: next });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={tier.maxHours}
                          onChange={(e) => {
                            const next = [...form.maintenanceFeeTiers];
                            next[index] = { ...tier, maxHours: e.target.value };
                            setForm({ ...form, maintenanceFeeTiers: next });
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={tier.fee}
                          onChange={(e) => {
                            const next = [...form.maintenanceFeeTiers];
                            next[index] = { ...tier, fee: e.target.value };
                            setForm({ ...form, maintenanceFeeTiers: next });
                          }}
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn danger"
                          onClick={() =>
                            setForm({
                              ...form,
                              maintenanceFeeTiers: form.maintenanceFeeTiers.filter((_, i) => i !== index),
                            })
                          }
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              type="button"
              className="btn"
              onClick={() =>
                setForm({
                  ...form,
                  maintenanceFeeTiers: [
                    ...form.maintenanceFeeTiers,
                    { minHours: "0", maxHours: "24", fee: "0" },
                  ],
                })
              }
            >
              Ajouter tranche
            </button>
          </div>
          <div className="stack">
            <label className="small muted">Absences prévues (facile à saisir)</label>
            <div className="mobile-fields-2">
              <div className="field" style={{ flex: 1 }}>
                <label>Début indisponibilité</label>
                <input
                  type="date"
                  value={plannedAbsenceDraft.startDate}
                  onChange={(e) => setPlannedAbsenceDraft({ ...plannedAbsenceDraft, startDate: e.target.value })}
                />
              </div>
              <div className="field" style={{ flex: 1 }}>
                <label>Fin indisponibilité</label>
                <input
                  type="date"
                  value={plannedAbsenceDraft.endDate}
                  onChange={(e) => setPlannedAbsenceDraft({ ...plannedAbsenceDraft, endDate: e.target.value })}
                />
              </div>
              <button type="button" className="btn" onClick={addPlannedAbsence}>Ajouter</button>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Début</th>
                    <th>Fin</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {form.plannedAbsences.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="small muted">Aucune absence prévue.</td>
                    </tr>
                  ) : (
                    form.plannedAbsences.map((absence, index) => (
                      <tr key={`${absence.startDate}-${absence.endDate}-${index}`}>
                        <td>{absence.startDate}</td>
                        <td>{absence.endDate}</td>
                        <td>
                          <button type="button" className="btn danger" onClick={() => removePlannedAbsence(index)}>
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div className="row" style={{ justifyContent: "space-between" }}>
        <button type="button" className="btn ghost" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Précédent
        </button>
        {step < steps.length - 1 ? (
          <button type="button" className="btn" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
            Suivant
          </button>
        ) : null}
        <button type="button" className="btn primary" onClick={submit} disabled={loading}>
          {loading ? "Enregistrement..." : mode === "create" ? "Créer le contrat" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
