"use client";

import { useEffect, useState } from "react";
import { timeEntryInputSchema } from "@/lib/schemas";
import { ContractForm } from "./ContractForm";
import { formatCurrency, formatHours } from "@/lib/format";
import type { ContractSummaryApiResponse, DayRow, WeeklyDetailRow } from "@/lib/api-types";

type Props = {
  contractId: string;
  initialData: ContractSummaryApiResponse;
  initialMonth: string;
};

export function ContractDetailClient({ contractId, initialData, initialMonth }: Props) {
  const [data, setData] = useState(initialData);
  const [month, setMonth] = useState(initialMonth);
  const [tab, setTab] = useState<"jour" | "semaine" | "mois">("jour");
  const [screenTab, setScreenTab] = useState<"pointage" | "infos">("pointage");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [entryForm, setEntryForm] = useState({
    date: `${initialMonth}-01`,
    startTime: "",
    endTime: "",
    mealsCount: String(data.contract.defaultMealsPerDay ?? 0),
    isPlannedAbsence: false,
    isUnplannedAbsence: false,
    isHoliday: false,
    isUnavailable: false,
    notes: "",
  });
  const [entryMsg, setEntryMsg] = useState<string | null>(null);

  useEffect(() => {
    setEntryForm((prev) => ({ ...prev, date: `${month}-01` }));
  }, [month]);

  async function refresh(nextMonth = month) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/contracts/${contractId}/summary?month=${nextMonth}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur chargement");
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  async function saveEntry() {
    setEntryMsg(null);
    try {
      const payload = timeEntryInputSchema.parse({
        contractId,
        date: entryForm.date,
        startTime: entryForm.startTime || null,
        endTime: entryForm.endTime || null,
        mealsCount: Number(entryForm.mealsCount || 0),
        isPlannedAbsence: entryForm.isPlannedAbsence,
        isUnplannedAbsence: entryForm.isUnplannedAbsence,
        isHoliday: entryForm.isHoliday,
        isUnavailable: entryForm.isUnavailable,
        notes: entryForm.notes || null,
      });
      const res = await fetch(`/api/contracts/${contractId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setEntryMsg("Pointage enregistré");
      await refresh();
    } catch (e) {
      setEntryMsg(e instanceof Error ? e.message : "Erreur");
    }
  }

  async function deleteContract() {
    if (!confirm("Supprimer ce contrat ?")) return;
    const res = await fetch(`/api/contracts/${contractId}`, { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/";
    }
  }

  const rounded = data.summary.rounded;
  const effectiveRate = data.contract.effectiveHourlyRate as number;
  const complementaryDays = data.summary.dayRows.filter((r) => r.complementaryHours > 0);

  return (
    <div className="stack mobile-screen">
      <div className="card stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0 }}>{data.contract.childName}</h1>
            <div className="muted small">
              {data.contract.contractType} • {data.contract.daysPerWeek} j/sem • {data.contract.hoursPerDay} h/j • {" "}
              {data.contract.weeksPerYear} sem/an
            </div>
          </div>
          <button className="btn notch-btn" onClick={() => setShowEdit((s) => !s)}>{showEdit ? "Fermer" : "⚙ Contrat"}</button>
        </div>

        <div className="mobile-steps">
          <button type="button" className="btn" aria-pressed={screenTab === "pointage"} onClick={() => setScreenTab("pointage")}>Pointage</button>
          <button type="button" className="btn" aria-pressed={screenTab === "infos"} onClick={() => setScreenTab("infos")}>Plus d&apos;infos</button>
        </div>

        {showEdit ? (
          <ContractForm
            mode="edit"
            contractId={contractId}
            initial={data.contract}
            onSaved={() => refresh()}
          />
        ) : null}
      </div>

      {screenTab === "pointage" ? (
        <>
          <div className="card stack">
            <strong>Saisie pointage</strong>
            <div className="grid cols-2">
              <div className="stack">
                <div className="row">
                  <div className="field" style={{ flex: 1 }}>
                    <label>Date</label>
                    <input type="date" value={entryForm.date} onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })} />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Arrivée</label>
                    <input type="time" value={entryForm.startTime} onChange={(e) => setEntryForm({ ...entryForm, startTime: e.target.value })} />
                  </div>
                  <div className="field" style={{ flex: 1 }}>
                    <label>Départ</label>
                    <input type="time" value={entryForm.endTime} onChange={(e) => setEntryForm({ ...entryForm, endTime: e.target.value })} />
                  </div>
                </div>
                <div className="row">
                  <div className="field" style={{ width: 120 }}>
                    <label>Repas</label>
                    <input type="number" value={entryForm.mealsCount} onChange={(e) => setEntryForm({ ...entryForm, mealsCount: e.target.value })} />
                  </div>
                </div>
                <label className="row"><input type="checkbox" checked={entryForm.isPlannedAbsence} onChange={(e) => setEntryForm({ ...entryForm, isPlannedAbsence: e.target.checked })} /> Absence prévue</label>
                <label className="row"><input type="checkbox" checked={entryForm.isUnplannedAbsence} onChange={(e) => setEntryForm({ ...entryForm, isUnplannedAbsence: e.target.checked })} /> Absence non prévue</label>
                <label className="row"><input type="checkbox" checked={entryForm.isHoliday} onChange={(e) => setEntryForm({ ...entryForm, isHoliday: e.target.checked })} /> Férié</label>
                <label className="row"><input type="checkbox" checked={entryForm.isUnavailable} onChange={(e) => setEntryForm({ ...entryForm, isUnavailable: e.target.checked })} /> Indisponible</label>
                <div className="field">
                  <label>Notes</label>
                  <textarea rows={3} value={entryForm.notes} onChange={(e) => setEntryForm({ ...entryForm, notes: e.target.value })} />
                </div>
                <div className="row">
                  <button className="btn primary" onClick={saveEntry}>Enregistrer pointage</button>
                  {entryMsg ? <span className="small muted">{entryMsg}</span> : null}
                </div>
              </div>
            </div>
          </div>

          <div className="card stack">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>Suivi mensuel</strong>
              <div className="field">
                <label>Mois</label>
                <input
                  type="month"
                  value={month}
                  onChange={async (e) => {
                    const value = e.target.value;
                    setMonth(value);
                    await refresh(value);
                  }}
                />
              </div>
            </div>
            {loading ? <span className="muted small">Chargement...</span> : null}
            {error ? <span className="error small">{error}</span> : null}

            <div className="tabs">
              <button className="btn" aria-pressed={tab === "jour"} onClick={() => setTab("jour")}>Jour</button>
              <button className="btn" aria-pressed={tab === "semaine"} onClick={() => setTab("semaine")}>Semaine</button>
              <button className="btn" aria-pressed={tab === "mois"} onClick={() => setTab("mois")}>Mois</button>
            </div>

            {tab === "jour" ? (
              <div className="table-wrap"><table><thead><tr><th>Date</th><th>Arrivée</th><th>Départ</th><th>Heures</th><th>Compl.</th><th>Repas</th><th>Tags</th></tr></thead><tbody>
                {data.summary.dayRows.map((row: DayRow) => (
                  <tr key={row.date}><td>{row.date}</td><td>{row.entry?.startTime ?? "-"}</td><td>{row.entry?.endTime ?? "-"}</td><td>{row.hoursDone ? row.hoursDone.toFixed(2) : "-"}</td><td>{row.complementaryHours ? row.complementaryHours.toFixed(2) : "-"}</td><td>{row.entry?.mealsCount ?? "-"}</td><td className="small">{[row.entry?.isPlannedAbsence && "Abs. prévue", row.entry?.isUnplannedAbsence && "Abs. non prévue", row.entry?.isHoliday && "Férié", row.entry?.isUnavailable && "Indispo"].filter(Boolean).join(", ") || "-"}</td></tr>
                ))}
              </tbody></table></div>
            ) : null}

            {tab === "semaine" ? (
              <div className="table-wrap"><table><thead><tr><th>Semaine</th><th>Heures</th><th>&gt; 45h</th><th>Majoration</th></tr></thead><tbody>
                {data.summary.weekly.details.map((w: WeeklyDetailRow) => (
                  <tr key={w.weekStart}><td>{w.weekStart}</td><td>{w.hoursDone.toFixed(2)} h</td><td>{w.overtimeHours.toFixed(2)} h</td><td>{formatCurrency(w.overtimeHours * effectiveRate * (data.contract.overtimeRatePercent / 100))}</td></tr>
                ))}
              </tbody></table></div>
            ) : null}

            {tab === "mois" ? (
              <div className="summary-grid">
                <div className="card">
                  <div className="summary-row"><span>Heures prévues</span><strong>{formatHours(rounded.expectedMonthlyHours)}</strong></div>
                  <div className="summary-row"><span>Heures faites</span><strong>{formatHours(rounded.hoursDone)}</strong></div>
                  <div className="summary-row"><span>Heures complémentaires</span><strong>{formatHours(rounded.complementaryHoursMonth)}</strong></div>
                  <div className="summary-row"><span>Heures majorées</span><strong>{formatHours(rounded.overtimeHoursMonth)}</strong></div>
                  <div className="summary-row"><span>Taux</span><strong>{effectiveRate.toFixed(2)} €/h</strong></div>
                </div>
                <div className="card">
                  <div className="summary-row"><span>Total brut</span><strong>{formatCurrency(rounded.totalBrut)}</strong></div>
                  <div className="summary-row"><span>Net</span><strong>{formatCurrency(rounded.net)}</strong></div>
                  <div className="summary-row"><span>Repas</span><strong>{formatCurrency(rounded.mealIndemnity)}</strong></div>
                  <div className="summary-row"><span>Entretien</span><strong>{formatCurrency(rounded.maintenanceIndemnity)}</strong></div>
                  <div className="summary-row total"><span>Total à payer</span><strong>{formatCurrency(rounded.totalAPayer)}</strong></div>
                </div>
              </div>
            ) : null}
          </div>
        </>
      ) : (
        <div className="card stack">
          <strong>Informations contrat</strong>
          <div className="summary-row"><span>Type</span><strong>{data.contract.contractType}</strong></div>
          <div className="summary-row"><span>Rythme hebdo</span><strong>{data.contract.daysPerWeek} j / {data.contract.hoursPerDay} h</strong></div>
          <div className="summary-row"><span>Semaines / an</span><strong>{data.contract.weeksPerYear}</strong></div>
          <div className="summary-row"><span>Taux appliqué</span><strong>{effectiveRate.toFixed(2)} €/h</strong></div>
          <div className="summary-row"><span>Complémentaires détectées</span><strong>{complementaryDays.length}</strong></div>
          <div className="row">
            <a className="btn primary" href={`/api/contracts/${contractId}/pdf?month=${month}`}>Télécharger PDF</a>
            <button className="btn danger" onClick={deleteContract}>Supprimer</button>
          </div>
        </div>
      )}
    </div>
  );
}
