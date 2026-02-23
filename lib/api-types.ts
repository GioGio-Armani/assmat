export type DayRow = {
  date: string;
  entry: {
    startTime?: string | null;
    endTime?: string | null;
    mealsCount: number;
    isPlannedAbsence: boolean;
    isUnplannedAbsence: boolean;
    isHoliday: boolean;
    isUnavailable: boolean;
  } | null;
  hoursDone: number;
  complementaryHours: number;
};

export type WeeklyDetailRow = {
  weekStart: string;
  hoursDone: number;
  overtimeHours: number;
};

export type ContractSummaryApiResponse = {
  contract: {
    id: string;
    childName: string;
    startDate: string | Date;
    endDate: string | Date | null;
    contractType: "CDI" | "CDD";
    daysPerWeek: number;
    hoursPerDay: number;
    weeksPerYear: number;
    overtimeRatePercent: number;
    defaultMealsPerDay: number;
    effectiveHourlyRate: number;
  } & Record<string, unknown>;
  entries: unknown[];
  summary: {
    dayRows: DayRow[];
    weekly: {
      details: WeeklyDetailRow[];
      overtimeHoursTotal: number;
    };
    rounded: {
      expectedMonthlyHours: number;
      hoursDone: number;
      complementaryHoursMonth: number;
      overtimeHoursMonth: number;
      brutBase: number;
      brutComplementary: number;
      brutOvertime: number;
      primeMensuelle: number;
      totalBrut: number;
      net: number;
      mealIndemnity: number;
      maintenanceIndemnity: number;
      totalAPayer: number;
    };
  } & Record<string, unknown>;
};
