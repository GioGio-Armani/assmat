"use client";

import Link from "next/link";
import { useState } from "react";
import type { AppContract } from "@/lib/types";
import { ContractForm } from "./ContractForm";

export function HomeContracts({ initialContracts }: { initialContracts: AppContract[] }) {
  const [contracts, setContracts] = useState(initialContracts);
  const [showCreate, setShowCreate] = useState(contracts.length === 0);

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 style={{ margin: 0 }}>Contrats</h1>
        <button className="btn primary" onClick={() => setShowCreate((s) => !s)}>
          Nouveau contrat
        </button>
      </div>

      {showCreate ? (
        <ContractForm
          mode="create"
          onSaved={(contract) => {
            setContracts((prev) => [contract, ...prev]);
            setShowCreate(false);
          }}
        />
      ) : null}

      <div className="contracts-list">
        {contracts.map((c) => (
          <Link key={c.id} href={`/contracts/${c.id}`} className="contract-item">
            <div className="row" style={{ justifyContent: "space-between" }}>
              <strong>{c.childName}</strong>
              <span className="pill">{c.contractType}</span>
            </div>
            <div className="muted small">
              {c.daysPerWeek} j/sem • {c.hoursPerDay} h/j • {c.weeksPerYear} sem/an
            </div>
            <div className="small">
              Taux effectif:{" "}
              {c.allowOverride && c.overrideHourlyRate != null
                ? c.overrideHourlyRate.toFixed(2)
                : c.baseHourlyRate.toFixed(2)}{" "}
              €/h
            </div>
          </Link>
        ))}
        {contracts.length === 0 ? <div className="muted">Aucun contrat.</div> : null}
      </div>
    </div>
  );
}
