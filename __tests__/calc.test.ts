import {
  computeComplementaryHoursMonth,
  computeDailyHours,
  computeGrossNetTotals,
  computeIndemnities,
  computeMonthlyExpectedHours,
  computeWeeklyOvertimeHours,
} from "@/lib/calc";

describe("calc module", () => {
  it("computeDailyHours", () => {
    expect(computeDailyHours("08:30", "17:00")).toBe(8.5);
    expect(() => computeDailyHours("17:00", "08:30")).toThrow();
  });

  it("computeComplementaryHoursMonth", () => {
    const value = computeComplementaryHoursMonth(
      [
        {
          date: "2026-01-01",
          durationMinutes: 600,
          mealsCount: 1,
          isPlannedAbsence: false,
          isUnplannedAbsence: false,
          isHoliday: false,
          isUnavailable: false,
        },
        {
          date: "2026-01-02",
          durationMinutes: 480,
          mealsCount: 1,
          isPlannedAbsence: false,
          isUnplannedAbsence: false,
          isHoliday: false,
          isUnavailable: false,
        },
      ],
      8,
    );
    expect(value).toBe(2);
  });

  it("computeWeeklyOvertimeHours", () => {
    const entries = Array.from({ length: 6 }, (_, i) => ({
      date: `2026-01-${String(i + 5).padStart(2, "0")}`,
      durationMinutes: 8 * 60,
      mealsCount: 1,
      isPlannedAbsence: false,
      isUnplannedAbsence: false,
      isHoliday: false,
      isUnavailable: false,
    }));
    const weekly = computeWeeklyOvertimeHours(entries);
    expect(weekly.overtimeHoursTotal).toBe(3);
  });

  it("computeMonthlyExpectedHours with planned absences", () => {
    const result = computeMonthlyExpectedHours({
      year: 2026,
      month: 1,
      hoursPerDay: 8,
      daysPerWeek: 5,
      weeksPerYear: 46,
      plannedAbsences: [{ startDate: "2026-01-12", endDate: "2026-01-16" }],
    });
    expect(result.annualContractHours).toBe(1840);
    expect(result.cancelledDaysTotal).toBe(5);
    expect(result.annualAfterPlannedAbsences).toBe(1800);
  });

  it("computeGrossNetTotals inclut prime CDD", () => {
    const result = computeGrossNetTotals({
      monthlyExpectedHours: 100,
      effectiveHourlyRate: 4,
      complementaryHoursMonth: 5,
      billComplementaryHours: true,
      overtimeHoursMonth: 2,
      overtimeRatePercent: 25,
      annualAfterPlannedAbsences: 1200,
      contractType: "CDD",
      applyPrecariousnessPrime: true,
    });
    expect(result.brutBase).toBe(400);
    expect(result.primeAnnuelle).toBe(480);
    expect(result.primeMensuelle).toBe(40);
    expect(result.totalBrut).toBe(462);
  });

  it("computeIndemnities", () => {
    const res = computeIndemnities({
      entries: [
        {
          date: "2026-01-01",
          durationMinutes: 8 * 60,
          mealsCount: 2,
          isPlannedAbsence: false,
          isUnplannedAbsence: false,
          isHoliday: false,
          isUnavailable: false,
        },
        {
          date: "2026-01-02",
          durationMinutes: 9 * 60,
          mealsCount: 1,
          isPlannedAbsence: false,
          isUnplannedAbsence: false,
          isHoliday: false,
          isUnavailable: false,
        },
      ],
      mealFeeEnabled: true,
      mealFeePerMeal: 3,
      maintenanceFeeEnabled: true,
      maintenanceFeeTiers: [
        { minHours: 0, maxHours: 8.01, fee: 4 },
        { minHours: 8.01, maxHours: 9.01, fee: 5 },
      ],
    });
    expect(res.mealsTotalMonth).toBe(3);
    expect(res.mealIndemnity).toBe(9);
    expect(res.maintenanceIndemnity).toBe(9);
  });
});
