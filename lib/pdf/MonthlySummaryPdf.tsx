import React from "react";
import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/format";
import type { ContractSummaryApiResponse, DayRow } from "@/lib/api-types";

const styles = StyleSheet.create({
  page: { padding: 24, fontSize: 10, fontFamily: "Helvetica", color: "#1d1d1d" },
  title: { fontSize: 15, marginBottom: 10, fontWeight: "bold" },
  section: { marginBottom: 10, borderWidth: 1, borderColor: "#ddd", padding: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4, gap: 8 },
  rowLabel: { color: "#444" },
  rowValue: { fontWeight: "bold" },
  headerGrid: { flexDirection: "row", gap: 8 },
  headerCol: { flex: 1 },
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ddd", paddingBottom: 4, marginBottom: 4 },
  th: { fontWeight: "bold" },
  cell: { flex: 1 },
  total: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderColor: "#ddd" },
});

function KV({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function MonthlySummaryPdf({
  data,
  month,
}: {
  data: ContractSummaryApiResponse;
  month: string;
}) {
  const rounded = data.summary.rounded;
  const c = data.contract;
  const complementaryDays = data.summary.dayRows.filter((r) => r.complementaryHours > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Récapitulatif mensuel (style Pajemploi) - {month}</Text>

        <View style={styles.section}>
          <Text style={{ marginBottom: 6, fontWeight: "bold" }}>Contrat</Text>
          <View style={styles.headerGrid}>
            <View style={styles.headerCol}>
              <KV label="Enfant" value={c.childName} />
              <KV label="Type" value={c.contractType} />
              <KV label="Début" value={new Date(c.startDate).toISOString().slice(0, 10)} />
              <KV label="Fin" value={c.endDate ? new Date(c.endDate).toISOString().slice(0, 10) : "-"} />
            </View>
            <View style={styles.headerCol}>
              <KV label="Jours/semaine" value={String(c.daysPerWeek)} />
              <KV label="Heures/jour" value={`${c.hoursPerDay}`} />
              <KV label="Semaines/an" value={String(c.weeksPerYear)} />
              <KV label="Taux horaire effectif" value={`${Number(c.effectiveHourlyRate).toFixed(2)} EUR/h`} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ marginBottom: 6, fontWeight: "bold" }}>Récapitulatif</Text>
          <KV label="Heures mensuelles prévues (lissées)" value={`${rounded.expectedMonthlyHours.toFixed(2)} h`} />
          <KV label="Heures réalisées" value={`${rounded.hoursDone.toFixed(2)} h`} />
          <KV label="Heures complémentaires" value={`${rounded.complementaryHoursMonth.toFixed(2)} h`} />
          <KV label={`Heures majorées (>45h) (${c.overtimeRatePercent}%)`} value={`${rounded.overtimeHoursMonth.toFixed(2)} h`} />
          <KV label="Brut base" value={formatCurrency(rounded.brutBase)} />
          <KV label="Prime de précarité (CDD)" value={formatCurrency(rounded.primeMensuelle)} />
          <KV label="Total brut" value={formatCurrency(rounded.totalBrut)} />
          <KV label="Net (coef 0.7812)" value={formatCurrency(rounded.net)} />
          <KV label="Indemnités repas" value={formatCurrency(rounded.mealIndemnity)} />
          <KV label="Indemnités entretien" value={formatCurrency(rounded.maintenanceIndemnity)} />
          <View style={styles.total}>
            <KV label="TOTAL A PAYER" value={formatCurrency(rounded.totalAPayer)} />
          </View>
        </View>

        {complementaryDays.length > 0 ? (
          <View style={styles.section}>
            <Text style={{ marginBottom: 6, fontWeight: "bold" }}>Jours avec heures complémentaires</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.cell, styles.th]}>Date</Text>
              <Text style={[styles.cell, styles.th]}>Heures faites</Text>
              <Text style={[styles.cell, styles.th]}>Complémentaires</Text>
            </View>
            {complementaryDays.map((row: DayRow) => (
              <View key={row.date} style={styles.row}>
                <Text style={styles.cell}>{row.date}</Text>
                <Text style={styles.cell}>{row.hoursDone.toFixed(2)} h</Text>
                <Text style={styles.cell}>{row.complementaryHours.toFixed(2)} h</Text>
              </View>
            ))}
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
