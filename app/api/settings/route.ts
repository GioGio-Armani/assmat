import { prisma } from "@/lib/db";
import { apiOk, handleApiError } from "@/lib/api";
import { settingsInputSchema } from "@/lib/schemas";
import { getOrCreateSettings } from "@/lib/settings";

export async function GET() {
  try {
    const settings = await getOrCreateSettings();
    return apiOk({ settings, adminTokenConfigured: Boolean(process.env.ADMIN_TOKEN) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const payload = settingsInputSchema.parse(await request.json());
    const settings = await prisma.settings.upsert({
      where: { id: "singleton" },
      update: { referenceGrid: payload.referenceGrid },
      create: { id: "singleton", netCoefficient: 0.7812, referenceGrid: payload.referenceGrid },
    });
    return apiOk({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}
