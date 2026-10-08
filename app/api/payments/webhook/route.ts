/* Payment webhook — provider independent.
   1. Verify signature  2. Verify transaction  3. Idempotency
   4. Update payment    5. Confirm order        6. Update inventory
   In mock mode this verifies and acknowledges; persistence happens in Phase 2 (Prisma). */
import { NextResponse } from "next/server";
import { getProvider } from "@/lib/payments/provider";

const processed = new Set<string>(); // Phase 2: unique index on PaymentTransaction.idempotencyKey

export async function POST(req: Request) {
  const secret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "webhook_not_configured" }, { status: 503 });

  const raw = await req.text();
  if (raw.length > 64_000) return NextResponse.json({ error: "payload_too_large" }, { status: 413 });
  const provider = getProvider(process.env.PAYMENT_PROVIDER || "mock");

  let event;
  try {
    event = await provider.parseWebhook(raw, req.headers.get("x-signature"), secret);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 401 });
  }

  if (processed.has(event.idempotencyKey)) return NextResponse.json({ ok: true, duplicate: true });
  processed.add(event.idempotencyKey);

  // Phase 2 (inside one DB transaction):
  //  - load Order by event.orderId, compare amount with stored total (verify transaction)
  //  - PaymentTransaction.create({ idempotencyKey, reference, status })
  //  - on success: Order.status = CONFIRMED, StockReservation → InventoryTransaction(SALE)
  //  - on failure: release StockReservation rows
  //  - enqueue Notification(payment_success | payment_failed)
  return NextResponse.json({ ok: true, orderId: event.orderId, status: event.status });
}
