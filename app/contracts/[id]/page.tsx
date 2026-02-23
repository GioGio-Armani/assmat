import { notFound } from "next/navigation";
import { parseMonthParam, monthKey } from "@/lib/month";
import { getContractWithEntriesForMonth, buildMonthlySummary } from "@/lib/serverSummary";
import { ContractDetailClient } from "@/components/ContractDetailClient";

export const dynamic = "force-dynamic";

export default async function ContractPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ month?: string }>;
}) {
  try {
    const { id } = await params;
    const sp = await searchParams;
    const { year, month } = parseMonthParam(sp.month);
    const { contract, entries } = await getContractWithEntriesForMonth(id, year, month);
    const data = buildMonthlySummary(contract, entries, year, month);
    return <ContractDetailClient contractId={id} initialData={data} initialMonth={monthKey(year, month)} />;
  } catch {
    notFound();
  }
}
