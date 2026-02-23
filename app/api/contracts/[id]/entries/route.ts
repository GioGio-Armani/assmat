import { prisma } from "@/lib/db";
import { apiOk, handleApiError } from "@/lib/api";
import { serializeTimeEntry } from "@/lib/serialization";
import { timeEntryInputSchema } from "@/lib/schemas";
import { computeDailyHours } from "@/lib/calc";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month");
    const where: Record<string, unknown> = { contractId: id };
    if (month) {
      const [year, m] = month.split("-").map(Number);
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }
    const entries = await prisma.timeEntry.findMany({ where, orderBy: { date: "asc" } });
    return apiOk({ entries: entries.map(serializeTimeEntry) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const payload = timeEntryInputSchema.parse(await request.json());
    if (payload.contractId !== id) throw new Error("contractId mismatch");
    const durationMinutes =
      payload.startTime && payload.endTime
        ? Math.round(computeDailyHours(payload.startTime, payload.endTime) * 60)
        : 0;
    const entry = await prisma.timeEntry.upsert({
      where: { contractId_date: { contractId: id, date: new Date(payload.date) } },
      update: {
        ...payload,
        date: new Date(payload.date),
        durationMinutes,
      },
      create: {
        ...payload,
        date: new Date(payload.date),
        durationMinutes,
      },
    });
    return apiOk({ entry: serializeTimeEntry(entry) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
