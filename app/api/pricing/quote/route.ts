/* Server-side price quote. The same engine the UI uses, executed on the server so
   checkout totals can't be tampered with in the browser. Phase 2: read product,
   rate and settings from Prisma instead of the seed. */
import { NextResponse } from "next/server";
import { calculatePrice } from "@/lib/pricing/engine";
import { SEED } from "@/lib/store/seed";
import { clientKey, rateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  if (!rateLimit(`quote:${clientKey(req)}`, 60).ok) return NextResponse.json({ error: "rate_limited" }, { status: 429 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const { productId, qty } = (body ?? {}) as { productId?: unknown; qty?: unknown };
  if (typeof productId !== "string" || productId.length > 64) return NextResponse.json({ error: "invalid_product" }, { status: 400 });
  const quantity = Number.isInteger(qty) && (qty as number) > 0 && (qty as number) <= 10 ? (qty as number) : 1;
  const product = SEED.products.find((p) => p.id === productId && p.status === "active");
  if (!product) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const rate = SEED.rates.find((r) => r.id === product.rateId);
  const breakdown = calculatePrice(product, rate, SEED.settings.taxRate);
  return NextResponse.json({
    productId,
    qty: quantity,
    currency: "QAR",
    breakdown,
    lineTotal: Math.round(breakdown.total * quantity * 100) / 100,
    rate: rate ? { id: rate.id, ratePerGram: rate.ratePerGram, status: rate.status, updatedAt: rate.updatedAt } : null,
  });
}
