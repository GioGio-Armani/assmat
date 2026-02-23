import type { Contract, TimeEntry } from "@prisma/client";
import { endOfMonth, endOfWeek, startOfMonth, startOfWeek } from "date-fns";
import { prisma } from "./db";
import { computeMonthlySummary, round2 } from "./calc";
import { serializeContract, serializeTimeEntry } from "./serialization";
import type { AppContract } from "./types";

export async function getContractOrThrow(id: string) {
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) throw new Error("Contrat introuvable");
  return contract;
}

export async function getContractWithEntriesForMonth(contractId: string, year: number, month: number) {
  const contract = await getContractOrThrow(contractId);
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const overtimeRangeStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const overtimeRangeEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const entries = await prisma.timeEntry.findMany({
    where: { contractId, date: { gte: overtimeRangeStart, lte: overtimeRangeEnd } },
    orderBy: { date: "asc" },
  });
  return { contract, entries };
}

function mapContractForCalc(contract: AppContract) {
  return {
    hoursPerDay: contract.hoursPerDay,
    daysPerWeek: contract.daysPerWeek as 2 | 3 | 4 | 5,
    weeksPerYear: contract.weeksPerYear,
    plannedAbsences: contract.plannedAbsences,
    effectiveHourlyRate:
      contract.allowOverride && contract.overrideHourlyRate != null
        ? contract.overrideHourlyRate
        : contract.baseHourlyRate,
    billComplementaryHours: contract.billComplementaryHours,
    overtimeRatePercent: contract.overtimeRatePercent as 10 | 15 | 25,
    contractType: contract.contractType,
    applyPrecariousnessPrime: contract.applyPrecariousnessPrime,
    mealFeeEnabled: contract.mealFeeEnabled,
    mealFeePerMeal: contract.mealFeePerMeal,
    maintenanceFeeEnabled: contract.maintenanceFeeEnabled,
    maintenanceFeeTiers: contract.maintenanceFeeTiers,
  };
}

export function buildMonthlySummary(contractRow: Contract, entryRows: TimeEntry[], year: number, month: number) {
  const contract = serializeContract(contractRow);
  const entries = entryRows.map((e) => ({
    ...serializeTimeEntry(e),
    durationMinutes: e.durationMinutes,
  }));
  const summary = computeMonthlySummary({
    year,
    month,
    contract: mapContractForCalc(contract),
    entries: entries.map((e) => ({
      date: e.date,
      startTime: e.startTime,
      endTime: e.endTime,
      durationMinutes: e.durationMinutes,
      mealsCount: e.mealsCount,
      isPlannedAbsence: e.isPlannedAbsence,
      isUnplannedAbsence: e.isUnplannedAbsence,
      isHoliday: e.isHoliday,
      isUnavailable: e.isUnavailable,
      notes: e.notes,
    })),
  });

  return {
    contract: {
      ...contract,
      effectiveHourlyRate: mapContractForCalc(contract).effectiveHourlyRate,
    },
    entries: entryRows
      .filter((e) => {
        const d = e.date;
        return d.getFullYear() === year && d.getMonth() + 1 === month;
      })
      .map(serializeTimeEntry),
    summary: {
      ...summary,
      rounded: {
        expectedMonthlyHours: round2(summary.expected.monthlyExpectedHoursSmoothed),
        hoursDone: round2(summary.hoursDone),
        complementaryHoursMonth: round2(summary.complementaryHoursMonth),
        overtimeHoursMonth: round2(summary.weekly.overtimeHoursTotal),
        brutBase: round2(summary.gross.brutBase),
        brutComplementary: round2(summary.gross.brutComplementary),
        brutOvertime: round2(summary.gross.brutOvertime),
        primeMensuelle: round2(summary.gross.primeMensuelle),
        totalBrut: round2(summary.gross.totalBrut),
        net: round2(summary.gross.net),
        mealIndemnity: round2(summary.indemnities.mealIndemnity),
        maintenanceIndemnity: round2(summary.indemnities.maintenanceIndemnity),
        totalAPayer: round2(summary.totalAPayer),
      },
    },
  };
}
