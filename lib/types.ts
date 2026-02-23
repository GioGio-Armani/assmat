import type { Contract, Settings, TimeEntry } from "@prisma/client";

export type PlannedAbsencePeriod = {
  startDate: string;
  endDate: string;
};

export type MaintenanceFeeTier = {
  minHours: number;
  maxHours: number;
  fee: number;
};

export type AppContract = Omit<Contract, "plannedAbsences" | "maintenanceFeeTiers"> & {
  plannedAbsences: PlannedAbsencePeriod[];
  maintenanceFeeTiers: MaintenanceFeeTier[];
};

export type AppSettings = Omit<Settings, "referenceGrid"> & {
  referenceGrid: import("./defaultReferenceGrid").ReferenceGridRow[];
};

export type TimeEntryWithComputed = TimeEntry & {
  hoursDone: number;
  complementaryHours: number;
};
