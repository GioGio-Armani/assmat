import { ContractType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { apiOk, handleApiError } from "@/lib/api";
import { contractInputSchema } from "@/lib/schemas";
import { serializeContract } from "@/lib/serialization";

type Params = { params: Promise<{ id: string }> };

export async function GET(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    const contract = await prisma.contract.findUnique({ where: { id } });
    if (!contract) return Response.json({ error: "Not found" }, { status: 404 });
    return apiOk({ contract: serializeContract(contract) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const payload = contractInputSchema.parse(await request.json());
    const contract = await prisma.contract.update({
      where: { id },
      data: {
        ...payload,
        contractType: payload.contractType as ContractType,
        startDate: new Date(payload.startDate),
        endDate: payload.endDate ? new Date(payload.endDate) : null,
      },
    });
    return apiOk({ contract: serializeContract(contract) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { id } = await params;
    await prisma.contract.delete({ where: { id } });
    return apiOk({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
