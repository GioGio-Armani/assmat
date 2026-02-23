"use client";

import { useState } from "react";
import { settingsInputSchema } from "@/lib/schemas";
import type { ReferenceGridRow } from "@/lib/defaultReferenceGrid";

type Props = {
  initialGrid: ReferenceGridRow[];
  adminTokenConfigured: boolean;
};

export function SettingsForm({ initialGrid, adminTokenConfigured }: Props) {
  const [rows, setRows] = useState<ReferenceGridRow[]>(initialGrid);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setMsg(null);
    try {
      const payload = settingsInputSchema.parse({ referenceGrid: rows });
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Erreur");
      setMsg("Grille enregistrée");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Erreur");
    }
  }

  return (
    <div className="stack">
      <div className="card stack">
        <h1 style={{ margin: 0 }}>Réglages</h1>
        <div className="summary-row"><span>ADMIN_TOKEN configuré</span><strong>{adminTokenConfigured ? "Oui" : "Non"}</strong></div>
        <div className="summary-row"><span>Coefficient net (fixe)</span><strong>0.7812</strong></div>
        <div className="muted small">
          Si `ADMIN_TOKEN` est défini, toutes les routes exigent l’en-tête `x-admin-token`.
        </div>
      </div>

      <div className="card stack">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <strong>Grille de référence (taux horaire)</strong>
          <div className="row">
            <button className="btn" onClick={() => setRows((prev) => [...prev, { daysPerWeek: 4, hoursPerDay: 8.5, baseHourlyRate: 0 }])}>
              Ajouter ligne
            </button>
            <button className="btn primary" onClick={save}>Enregistrer</button>
          </div>
        </div>
        {msg ? <div className="small">{msg}</div> : null}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Jours/sem</th>
                <th>Heures/jour</th>
                <th>Taux de base</th>
                <th>Note</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${i}-${r.daysPerWeek}-${r.hoursPerDay}`}>
                  <td>
                    <select
                      value={r.daysPerWeek}
                      onChange={(e) => {
                        const next = [...rows];
                        next[i] = { ...r, daysPerWeek: Number(e.target.value) as 2 | 3 | 4 | 5 };
                        setRows(next);
                      }}
                    >
                      {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.25"
                      value={r.hoursPerDay}
                      onChange={(e) => {
                        const next = [...rows];
                        next[i] = { ...r, hoursPerDay: Number(e.target.value) };
                        setRows(next);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      value={r.baseHourlyRate}
                      onChange={(e) => {
                        const next = [...rows];
                        next[i] = { ...r, baseHourlyRate: Number(e.target.value) };
                        setRows(next);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      value={r.note ?? ""}
                      onChange={(e) => {
                        const next = [...rows];
                        next[i] = { ...r, note: e.target.value };
                        setRows(next);
                      }}
                    />
                  </td>
                  <td>
                    <button className="btn danger" onClick={() => setRows((prev) => prev.filter((_, idx) => idx !== i))}>
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="muted small">
          La grille pré-remplit le taux horaire de base à la création de contrat (override possible par contrat).
        </div>
      </div>
    </div>
  );
}
