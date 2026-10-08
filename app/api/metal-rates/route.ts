import { NextResponse } from "next/server";
import { SEED } from "@/lib/store/seed";

/** Current metal rates (QAR / gram). Mock mode returns the demo seed — never presented as live. */
export function GET() {
  return NextResponse.json(
    { currency: "QAR", unit: "gram", rates: SEED.rates.map(({ id, purity, metal, ratePerGram, updatedAt, source, status }) => ({ id, metal, purity, ratePerGram, updatedAt, source, status })) },
    { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" } },
  );
}
