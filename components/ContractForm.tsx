"use client";

import { useState } from "react";
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
  const parseLocaleNumber = (value: string) => Number(value.replace(",", "."));
  const toInputValue = (value: number | string | null | undefined) =>
    value === null || value === undefined ? "" : String(value);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    childName: initial?.childName ?? "",
    startDate: initial?.startDate ? new Date(initial.startDate).toISOString().slice(0, 10) : "",
    endDate: initial?.endDate ? new Date(initial.endDate).toISOString().slice(0, 10) : "",
    contractType: (initial?.contractType as "CDI" | "CDD") ?? "CDI",
    hoursPerDay: toInputValue(initial?.hoursPerDay ?? 8.5),
    daysPerWeek: (initial?.daysPerWeek as 2 | 3 | 4 | 5) ?? 4,
    weeksPerYear: toInputValue(initial?.weeksPerYear ?? 46),
    plannedAbsencesText: JSON.stringify(initial?.plannedAbsences ?? [], null, 2),
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

  async function submit() {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const plannedAbsences = JSON.parse(form.plannedAbsencesText) as PlannedAbsencePeriod[];
      const payload = contractInputSchema.parse({
        childName: form.childName,
        startDate: form.startDate,
        endDate: form.endDate || null,
        contractType: form.contractType,
        hoursPerDay: parseLocaleNumber(form.hoursPerDay),
        daysPerWeek: Number(form.daysPerWeek),
        weeksPerYear: parseLocaleNumber(form.weeksPerYear),
        plannedAbsences,
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

  return (
    <div className="card stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <strong>{mode === "create" ? "Nouveau contrat" : "Modifier le contrat"}</strong>
        {success ? <span className="success small">{success}</span> : null}
      </div>
      {error ? <div className="error small">{error}</div> : null}
      <div className="grid cols-2">
        <div className="stack">
          <div className="field">
            <label>Enfant</label>
            <input value={form.childName} onChange={(e) => setForm({ ...form, childName: e.target.value })} />
          </div>
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Début</label>
              <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Fin (optionnel)</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </div>
          </div>
          <div className="row">
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
          <div className="row">
            <div className="field" style={{ flex: 1 }}>
              <label>Heures/jour</label>
              <input type="text" inputMode="decimal" value={form.hoursPerDay} onChange={(e) => setForm({ ...form, hoursPerDay: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Semaines/an</label>
              <input type="text" inputMode="numeric" value={form.weeksPerYear} onChange={(e) => setForm({ ...form, weeksPerYear: e.target.value })} />
            </div>
          </div>
          <div className="row">
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
        </div>

        <div className="stack">
          <label className="row"><input type="checkbox" checked={form.mealFeeEnabled} onChange={(e) => setForm({ ...form, mealFeeEnabled: e.target.checked })} /> Indemnité repas activée</label>
          <div className="row">
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
          <div className="field">
            <label>Absences prévues (JSON)</label>
            <textarea rows={8} value={form.plannedAbsencesText} onChange={(e) => setForm({ ...form, plannedAbsencesText: e.target.value })} />
          </div>
        </div>
      </div>
      <div className="row">
        <button type="button" className="btn primary" onClick={submit} disabled={loading}>
          {loading ? "Enregistrement..." : mode === "create" ? "Créer le contrat" : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
