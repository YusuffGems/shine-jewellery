/* Order lifecycle steps shared by the user checkout (payment result) and admin (status, refunds). */
import { db } from "@/lib/store/db";
import { nowIso } from "@/lib/utils";
import { queueNotification } from "@/shared/services/core";
import type { Database, Order, OrderStatus } from "@/types";

export function pushStatus(o: Order, status: OrderStatus, note: string) {
  o.status = status;
  o.history.push({ status, at: nowIso(), note });
}

export function releaseReservations(d: Database, o: Order) {
  for (const it of o.items) {
    const rec = d.inventory.find((r) => r.productId === it.productId && r.branchId === it.branchId);
    if (rec) rec.reserved = Math.max(0, rec.reserved - it.qty);
  }
}

/**
 * Webhook handler logic (idempotent). The mock payment page calls this directly;
 * in API mode /api/payments/webhook calls the same function after verifying the signature.
 */
export function handlePaymentResult(orderId: string, status: "succeeded" | "failed", idempotencyKey: string) {
  db.update((d) => {
    const o = d.orders.find((x) => x.id === orderId);
    if (!o || o.payment.idempotencyKey !== idempotencyKey) return;
    if (o.payment.status !== "pending") return; // already processed → idempotent no-op
    if (status === "succeeded") {
      o.payment.status = "succeeded";
      for (const it of o.items) {
        const rec = d.inventory.find((r) => r.productId === it.productId && r.branchId === it.branchId);
        if (rec) {
          rec.reserved = Math.max(0, rec.reserved - it.qty);
          rec.sold += it.qty;
        }
        d.inventoryTx.unshift({ id: `itx_${o.id}_${it.productId}_${it.branchId}`, productId: it.productId, branchId: it.branchId, kind: "sale", qty: it.qty, note: o.number, at: nowIso(), by: "payment" });
      }
      pushStatus(o, "paid", `Payment ${o.payment.reference} succeeded`);
      pushStatus(o, "confirmed", "Order confirmed");
      if (o.couponCode) {
        const c = d.coupons.find((x) => x.code === o.couponCode);
        if (c) c.used += 1;
      }
      if (o.customerId === d.session.customerId || o.customerId === "guest") {
        d.session.cart = [];
        d.session.couponCode = undefined;
      }
      queueNotification(d, "email", "payment_success", o.email, `Payment received for ${o.number}`);
      queueNotification(d, "whatsapp", "order_confirmed", o.phone, `Your SHINE order ${o.number} is confirmed`);
      d.analytics.unshift({ id: `evt_${o.id}`, event: "purchase", data: { orderId: o.id, total: o.total }, at: nowIso() });
    } else {
      o.payment.status = "failed";
      releaseReservations(d, o);
      pushStatus(o, "payment_failed", "Payment failed — stock released");
      queueNotification(d, "email", "payment_failed", o.email, `Payment failed for ${o.number}`);
    }
  });
}
