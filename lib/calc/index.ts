import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import type { MaintenanceFeeTier, PlannedAbsencePeriod } from "../types";

export const NET_COEFFICIENT = 0.7812;
export const WEEKLY_OVERTIME_THRESHOLD = 45;

export type CalcContractInput = {
  hoursPerDay: number;
  daysPerWeek: 2 | 3 | 4 | 5;
  weeksPerYear: number;
  plannedAbsences: PlannedAbsencePeriod[];
  effectiveHourlyRate: number;
  billComplementaryHours: boolean;
  overtimeRatePercent: 10 | 15 | 25;
  contractType: "CDI" | "CDD";
  applyPrecariousnessPrime: boolean;
  mealFeeEnabled: boolean;
  mealFeePerMeal: number;
  maintenanceFeeEnabled: boolean;
  maintenanceFeeTiers: MaintenanceFeeTier[];
};

export type CalcTimeEntry = {
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  durationMinutes: number;
  mealsCount: number;
  isPlannedAbsence: boolean;
  isUnplannedAbsence: boolean;
  isHoliday: boolean;
  isUnavailable: boolean;
  notes?: string | null;
};

export function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function parseTimeToMinutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function computeDailyHours(startTime: string, endTime: string) {
  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  if (end <= start) throw new Error("endTime doit être > startTime");
  return (end - start) / 60;
}

export function computeComplementaryHoursMonth(
  entries: CalcTimeEntry[],
  hoursPerDay: number,
) {
  return entries.reduce((sum, e) => {
    if (isAbsenceEntry(e)) return sum;
    const hours = e.durationMinutes / 60;
    return sum + Math.max(0, hours - hoursPerDay);
  }, 0);
}

export function computeWeeklyOvertimeHours(entries: CalcTimeEntry[]) {
  const byWeek = new Map<string, number>();
  for (const entry of entries) {
    if (isAbsenceEntry(entry)) continue;
    const d = parseISO(entry.date);
    const weekKey = format(startOfWeek(d, { weekStartsOn: 1 }), "yyyy-MM-dd");
    byWeek.set(weekKey, (byWeek.get(weekKey) ?? 0) + entry.durationMinutes / 60);
  }
  const details = Array.from(byWeek.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, hoursDone]) => {
      const overtimeHours = Math.max(0, hoursDone - WEEKLY_OVERTIME_THRESHOLD);
      return { weekStart, hoursDone, overtimeHours };
    });
  return {
    overtimeHoursTotal: details.reduce((sum, d) => sum + d.overtimeHours, 0),
    details,
  };
}

function isContractualWeekday(date: Date, daysPerWeek: number) {
  const day = date.getDay(); // 0=Sun ... 6=Sat
  const isoDay = day === 0 ? 7 : day;
  return isoDay <= daysPerWeek;
}

export function computeMonthlyExpectedHours(input: {
  year: number;
  month: number;
  hoursPerDay: number;
  daysPerWeek: 2 | 3 | 4 | 5;
  weeksPerYear: number;
  plannedAbsences: PlannedAbsencePeriod[];
}) {
  const weeklyHours = input.hoursPerDay * input.daysPerWeek;
  const annualContractHours = weeklyHours * input.weeksPerYear;

  let cancelledDays = 0;
  const absenceIntervals = input.plannedAbsences.map((p) => ({
    start: parseISO(p.startDate),
    end: parseISO(p.endDate),
  }));

  for (const interval of absenceIntervals) {
    for (const day of eachDayOfInterval(interval)) {
      if (isContractualWeekday(day, input.daysPerWeek)) {
        cancelledDays += 1;
      }
    }
  }

  const annualAfterPlannedAbsences = annualContractHours - cancelledDays * input.hoursPerDay;
  const monthlyExpectedHoursSmoothed = annualAfterPlannedAbsences / 12;

  const monthStart = new Date(input.year, input.month - 1, 1);
  const monthEnd = endOfMonth(monthStart);
  let cancelledDaysInMonth = 0;
  for (const d of eachDayOfInterval({ start: monthStart, end: monthEnd })) {
    if (!isContractualWeekday(d, input.daysPerWeek)) continue;
    const inAbsence = absenceIntervals.some((iv) => isWithinInterval(d, iv));
    if (inAbsence) cancelledDaysInMonth += 1;
  }

  return {
    weeklyHours,
    annualContractHours,
    annualAfterPlannedAbsences,
    monthlyExpectedHoursSmoothed,
    cancelledDaysTotal: cancelledDays,
    cancelledDaysInMonth,
  };
}

export function computeGrossNetTotals(input: {
  monthlyExpectedHours: number;
  effectiveHourlyRate: number;
  complementaryHoursMonth: number;
  billComplementaryHours: boolean;
  overtimeHoursMonth: number;
  overtimeRatePercent: 10 | 15 | 25;
  annualAfterPlannedAbsences: number;
  contractType: "CDI" | "CDD";
  applyPrecariousnessPrime: boolean;
}) {
  const brutBase = input.monthlyExpectedHours * input.effectiveHourlyRate;
  const brutComplementary = input.billComplementaryHours
    ? input.complementaryHoursMonth * input.effectiveHourlyRate
    : 0;
  const brutOvertime =
    input.overtimeHoursMonth *
    input.effectiveHourlyRate *
    (input.overtimeRatePercent / 100);
  const primeAnnuelle =
    input.contractType === "CDD" && input.applyPrecariousnessPrime
      ? 0.1 * (input.annualAfterPlannedAbsences * input.effectiveHourlyRate)
      : 0;
  const primeMensuelle = primeAnnuelle / 12;
  const totalBrut = brutBase + brutComplementary + brutOvertime + primeMensuelle;
  const net = totalBrut * NET_COEFFICIENT;

  return {
    brutBase,
    brutComplementary,
    brutOvertime,
    primeAnnuelle,
    primeMensuelle,
    totalBrut,
    net,
  };
}

export function computeIndemnities(input: {
  entries: CalcTimeEntry[];
  mealFeeEnabled: boolean;
  mealFeePerMeal: number;
  maintenanceFeeEnabled: boolean;
  maintenanceFeeTiers: MaintenanceFeeTier[];
}) {
  let mealsTotalMonth = 0;
  let mealIndemnity = 0;
  let maintenanceIndemnity = 0;

  for (const entry of input.entries) {
    if (isAbsenceEntry(entry)) continue;
    mealsTotalMonth += entry.mealsCount;
    if (input.mealFeeEnabled) {
      mealIndemnity += entry.mealsCount * input.mealFeePerMeal;
    }
    if (input.maintenanceFeeEnabled) {
      const hours = entry.durationMinutes / 60;
      const tier = input.maintenanceFeeTiers.find(
        (t) => hours >= t.minHours && hours < t.maxHours,
      ) ??
        input.maintenanceFeeTiers.find((t) => hours >= t.minHours && hours <= t.maxHours);
      if (tier) maintenanceIndemnity += tier.fee;
    }
  }

  return { mealsTotalMonth, mealIndemnity, maintenanceIndemnity };
}

export function buildMonthEntries(entries: CalcTimeEntry[], year: number, month: number) {
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  return entries.filter((e) => {
    const d = parseISO(e.date);
    return d >= monthStart && d <= monthEnd;
  });
}

export function buildMonthDayRows(
  entries: CalcTimeEntry[],
  year: number,
  month: number,
  hoursPerDay: number,
) {
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const map = new Map(entries.map((e) => [e.date, e]));

  return eachDayOfInterval({ start: monthStart, end: monthEnd }).map((d) => {
    const key = format(d, "yyyy-MM-dd");
    const e = map.get(key);
    const hoursDone = e ? e.durationMinutes / 60 : 0;
    const complementaryHours = e && !isAbsenceEntry(e) ? Math.max(0, hoursDone - hoursPerDay) : 0;
    return {
      date: key,
      entry: e ?? null,
      hoursDone,
      complementaryHours,
    };
  });
}

export function computeMonthlySummary(input: {
  year: number;
  month: number;
  contract: CalcContractInput;
  entries: CalcTimeEntry[];
}) {
  const monthEntries = buildMonthEntries(input.entries, input.year, input.month);
  const expected = computeMonthlyExpectedHours({
    year: input.year,
    month: input.month,
    hoursPerDay: input.contract.hoursPerDay,
    daysPerWeek: input.contract.daysPerWeek,
    weeksPerYear: input.contract.weeksPerYear,
    plannedAbsences: input.contract.plannedAbsences,
  });
  const hoursDone = monthEntries.reduce(
    (sum, e) => sum + (isAbsenceEntry(e) ? 0 : e.durationMinutes / 60),
    0,
  );
  const complementaryHoursMonth = computeComplementaryHoursMonth(
    monthEntries,
    input.contract.hoursPerDay,
  );
  // Weekly overtime must be computed on full calendar weeks (Mon->Sun), not month-truncated rows.
  const weekly = computeWeeklyOvertimeHours(input.entries);
  const gross = computeGrossNetTotals({
    monthlyExpectedHours: expected.monthlyExpectedHoursSmoothed,
    effectiveHourlyRate: input.contract.effectiveHourlyRate,
    complementaryHoursMonth,
    billComplementaryHours: input.contract.billComplementaryHours,
    overtimeHoursMonth: weekly.overtimeHoursTotal,
    overtimeRatePercent: input.contract.overtimeRatePercent,
    annualAfterPlannedAbsences: expected.annualAfterPlannedAbsences,
    contractType: input.contract.contractType,
    applyPrecariousnessPrime: input.contract.applyPrecariousnessPrime,
  });
  const indemnities = computeIndemnities({
    entries: monthEntries,
    mealFeeEnabled: input.contract.mealFeeEnabled,
    mealFeePerMeal: input.contract.mealFeePerMeal,
    maintenanceFeeEnabled: input.contract.maintenanceFeeEnabled,
    maintenanceFeeTiers: input.contract.maintenanceFeeTiers,
  });

  const totalAPayer =
    gross.totalBrut + indemnities.mealIndemnity + indemnities.maintenanceIndemnity;

  return {
    monthEntries,
    expected,
    hoursDone,
    complementaryHoursMonth,
    weekly,
    gross,
    indemnities,
    totalAPayer,
    dayRows: buildMonthDayRows(monthEntries, input.year, input.month, input.contract.hoursPerDay),
  };
}

export function getMonthWeeks(year: number, month: number) {
  const monthStart = startOfMonth(new Date(year, month - 1, 1));
  const monthEnd = endOfMonth(monthStart);
  const firstWeekStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const weeks: { start: string; end: string }[] = [];
  for (let cursor = firstWeekStart; cursor <= monthEnd; cursor = addDays(cursor, 7)) {
    const end = endOfWeek(cursor, { weekStartsOn: 1 });
    weeks.push({ start: format(cursor, "yyyy-MM-dd"), end: format(end, "yyyy-MM-dd") });
  }
  return weeks;
}

function isAbsenceEntry(entry: CalcTimeEntry) {
  return entry.isPlannedAbsence || entry.isUnplannedAbsence;
}
