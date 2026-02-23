export type ReferenceGridRow = {
  daysPerWeek: 2 | 3 | 4 | 5;
  hoursPerDay: number;
  baseHourlyRate: number;
  note?: string;
};

export const defaultReferenceGrid: ReferenceGridRow[] = [
  { daysPerWeek: 2, hoursPerDay: 8, baseHourlyRate: 4.8 },
  { daysPerWeek: 3, hoursPerDay: 8, baseHourlyRate: 4.5 },
  { daysPerWeek: 4, hoursPerDay: 8.5, baseHourlyRate: 4.2 },
  { daysPerWeek: 5, hoursPerDay: 8.5, baseHourlyRate: 4.0 },
  { daysPerWeek: 5, hoursPerDay: 10, baseHourlyRate: 3.9 }
];
