import type { Contract, Settings, TimeEntry } from "@prisma/client";
import type { AppContract, AppSettings } from "./types";

export function serializeContract(contract: Contract): AppContract {
  return {
    ...contract,
    startDate: contract.startDate,
    endDate: contract.endDate,
    plannedAbsences: (contract.plannedAbsences as AppContract["plannedAbsences"]) ?? [],
    maintenanceFeeTiers:
      (contract.maintenanceFeeTiers as AppContract["maintenanceFeeTiers"]) ?? [],
  };
}

export function serializeSettings(settings: Settings): AppSettings {
  return {
    ...settings,
    referenceGrid: (settings.referenceGrid as AppSettings["referenceGrid"]) ?? [],
  };
}

export function serializeTimeEntry(entry: TimeEntry) {
  return {
    ...entry,
    date: entry.date.toISOString().slice(0, 10),
  };
}
