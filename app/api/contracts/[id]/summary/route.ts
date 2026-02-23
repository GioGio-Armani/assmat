import { apiOk, handleApiError } from "@/lib/api";
import { parseMonthParam } from "@/lib/month";
import { buildMonthlySummary, getContractWithEntriesForMonth } from "@/lib/serverSummary";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const { year, month } = parseMonthParam(searchParams.get("month"));
    const { contract, entries } = await getContractWithEntriesForMonth(id, year, month);
    return apiOk(buildMonthlySummary(contract, entries, year, month));
  } catch (error) {
    return handleApiError(error);
  }
}
