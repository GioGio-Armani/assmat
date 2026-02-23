import { prisma } from "@/lib/db";
import { apiOk, handleApiError } from "@/lib/api";
import { timeEntryInputSchema } from "@/lib/schemas";
import { computeDailyHours } from "@/lib/calc";
import { serializeTimeEntry } from "@/lib/serialization";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const payload = timeEntryInputSchema.parse(await request.json());
    const durationMinutes =
      payload.startTime && payload.endTime
        ? Math.round(computeDailyHours(payload.startTime, payload.endTime) * 60)
        : 0;
    const entry = await prisma.timeEntry.update({
      where: { id },
      data: {
        ...payload,
        date: new Date(payload.date),
        durationMinutes,
      },
    });
    return apiOk({ entry: serializeTimeEntry(entry) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.timeEntry.delete({ where: { id } });
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
