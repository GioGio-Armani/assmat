import { z } from "zod";

export const plannedAbsenceSchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const maintenanceFeeTierSchema = z
  .object({
    minHours: z.number().min(0),
    maxHours: z.number().positive(),
    fee: z.number().min(0),
  })
  .refine((v) => v.maxHours > v.minHours, "maxHours doit être > minHours");

export const contractInputSchema = z.object({
  childName: z.string().min(1),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  contractType: z.enum(["CDI", "CDD"]),
  hoursPerDay: z.number().positive(),
  daysPerWeek: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  weeksPerYear: z.number().int().min(1).max(53),
  plannedAbsences: z.array(plannedAbsenceSchema),
  baseHourlyRate: z.number().min(0),
  allowOverride: z.boolean(),
  overrideHourlyRate: z.number().min(0).nullable(),
  billComplementaryHours: z.boolean(),
  overtimeRatePercent: z.union([z.literal(10), z.literal(15), z.literal(25)]),
  mealFeeEnabled: z.boolean(),
  mealFeePerMeal: z.number().min(0),
  defaultMealsPerDay: z.number().int().min(0).max(10),
  maintenanceFeeEnabled: z.boolean(),
  maintenanceFeeTiers: z.array(maintenanceFeeTierSchema),
  applyPrecariousnessPrime: z.boolean(),
});

export const timeEntryInputSchema = z
  .object({
    contractId: z.string().min(1),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    startTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    endTime: z.string().regex(/^\d{2}:\d{2}$/).nullable(),
    mealsCount: z.number().int().min(0).max(10),
    isPlannedAbsence: z.boolean(),
    isUnplannedAbsence: z.boolean(),
    isHoliday: z.boolean(),
    isUnavailable: z.boolean(),
    notes: z.string().max(500).optional().nullable(),
  })
  .refine(
    (v) =>
      (v.startTime === null && v.endTime === null) ||
      (v.startTime !== null && v.endTime !== null),
    "startTime et endTime doivent être tous les deux renseignés ou vides",
  );

export const settingsInputSchema = z.object({
  referenceGrid: z.array(
    z.object({
      daysPerWeek: z.union([z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
      hoursPerDay: z.number().positive(),
      baseHourlyRate: z.number().min(0),
      note: z.string().optional(),
    }),
  ),
});
