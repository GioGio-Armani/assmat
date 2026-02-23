import { PrismaClient, ContractType } from "@prisma/client";
import { defaultReferenceGrid } from "../lib/defaultReferenceGrid";

const prisma = new PrismaClient();

async function main() {
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {
      referenceGrid: defaultReferenceGrid,
      netCoefficient: 0.7812,
    },
    create: {
      id: "singleton",
      referenceGrid: defaultReferenceGrid,
      netCoefficient: 0.7812,
    },
  });

  const existing = await prisma.contract.findFirst();
  if (existing) return;

  const contract = await prisma.contract.create({
    data: {
      childName: "Lina",
      startDate: new Date("2025-09-01"),
      contractType: ContractType.CDI,
      hoursPerDay: 8.5,
      daysPerWeek: 4,
      weeksPerYear: 46,
      plannedAbsences: [{ startDate: "2025-12-22", endDate: "2025-12-26" }],
      baseHourlyRate: 4.2,
      allowOverride: false,
      overrideHourlyRate: null,
      billComplementaryHours: true,
      overtimeRatePercent: 10,
      mealFeeEnabled: true,
      mealFeePerMeal: 3.5,
      defaultMealsPerDay: 1,
      maintenanceFeeEnabled: true,
      maintenanceFeeTiers: [
        { minHours: 0, maxHours: 8, fee: 3.8 },
        { minHours: 8, maxHours: 9, fee: 4.4 },
        { minHours: 9, maxHours: 24, fee: 5.2 },
      ],
      applyPrecariousnessPrime: false,
    },
  });

  await prisma.timeEntry.createMany({
    data: [
      { contractId: contract.id, date: new Date("2026-01-05"), startTime: "08:30", endTime: "17:00", durationMinutes: 510, mealsCount: 1 },
      { contractId: contract.id, date: new Date("2026-01-06"), startTime: "08:30", endTime: "17:30", durationMinutes: 540, mealsCount: 1 },
      { contractId: contract.id, date: new Date("2026-01-07"), startTime: "08:30", endTime: "16:30", durationMinutes: 480, mealsCount: 1 },
      { contractId: contract.id, date: new Date("2026-01-08"), startTime: "08:30", endTime: "17:00", durationMinutes: 510, mealsCount: 1 },
    ],
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
