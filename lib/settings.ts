import { prisma } from "./db";
import { defaultReferenceGrid } from "./defaultReferenceGrid";
import { serializeSettings } from "./serialization";

export async function getOrCreateSettings() {
  const settings = await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      netCoefficient: 0.7812,
      referenceGrid: defaultReferenceGrid,
    },
  });
  return serializeSettings(settings);
}

export async function resolveBaseHourlyRate(daysPerWeek: number, hoursPerDay: number) {
  const settings = await getOrCreateSettings();
  const exact = settings.referenceGrid.find(
    (r) => r.daysPerWeek === daysPerWeek && Number(r.hoursPerDay) === Number(hoursPerDay),
  );
  if (exact) return exact.baseHourlyRate;
  const fallback = settings.referenceGrid
    .filter((r) => r.daysPerWeek === daysPerWeek)
    .sort(
      (a, b) =>
        Math.abs(a.hoursPerDay - hoursPerDay) - Math.abs(b.hoursPerDay - hoursPerDay),
    )[0];
  return fallback?.baseHourlyRate ?? 0;
}
