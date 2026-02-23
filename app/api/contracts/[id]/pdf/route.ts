import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { handleApiError } from "@/lib/api";
import { parseMonthParam, monthKey } from "@/lib/month";
import { getContractWithEntriesForMonth, buildMonthlySummary } from "@/lib/serverSummary";
import { MonthlySummaryPdf } from "@/lib/pdf/MonthlySummaryPdf";

type Params = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function GET(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const { year, month } = parseMonthParam(searchParams.get("month"));
    const { contract, entries } = await getContractWithEntriesForMonth(id, year, month);
    const data = buildMonthlySummary(contract, entries, year, month);
    const monthStr = monthKey(year, month);

    const doc = React.createElement(MonthlySummaryPdf, {
      data,
      month: monthStr,
    }) as unknown as Parameters<typeof renderToBuffer>[0];
    const buffer = await renderToBuffer(doc);
    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="recap-${data.contract.childName}-${monthStr}.pdf"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
