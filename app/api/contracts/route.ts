import { ContractType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { apiOk, handleApiError } from "@/lib/api";
import { contractInputSchema } from "@/lib/schemas";
import { serializeContract } from "@/lib/serialization";
import { resolveBaseHourlyRate } from "@/lib/settings";

export async function GET() {
  try {
    const contracts = await prisma.contract.findMany({ orderBy: { createdAt: "desc" } });
    return apiOk({ contracts: contracts.map(serializeContract) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = contractInputSchema.parse(await request.json());
    const baseHourlyRate =
      payload.baseHourlyRate > 0
        ? payload.baseHourlyRate
        : await resolveBaseHourlyRate(payload.daysPerWeek, payload.hoursPerDay);

    const contract = await prisma.contract.create({
      data: {
        ...payload,
        contractType: payload.contractType as ContractType,
        startDate: new Date(payload.startDate),
        endDate: payload.endDate ? new Date(payload.endDate) : null,
        plannedAbsences: payload.plannedAbsences,
        maintenanceFeeTiers: payload.maintenanceFeeTiers,
        baseHourlyRate,
      },
    });
    return apiOk({ contract: serializeContract(contract) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
