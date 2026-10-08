/* ADMIN APP — order status changes and refunds. */
import { db } from "@/lib/store/db";
import { getProvider } from "@/lib/payments/provider";
import { queueNotification, writeAudit } from "@/shared/services/core";
import type { Order, OrderStatus } from "@/types";
import { pushStatus, releaseReservations } from "@/shared/services/orderLifecycle";

export const ORDER_FLOW: OrderStatus[] = ["confirmed", "processing", "shipped", "ready_for_pickup", "delivered", "cancelled"];

export function updateOrderStatus(orderId: string, status: OrderStatus, note = "") {
  db.update((d) => {
    const o = d.orders.find((x) => x.id === orderId);
    if (!o) return;
    const old = o.status;
    if (status === "cancelled" && o.payment.status === "pending") releaseReservations(d, o);
    pushStatus(o, status, note || `Status changed by admin`);
    writeAudit(d, "status", "orders", o.id, old, status);
    const event = status === "shipped" ? "order_shipped" : status === "delivered" ? "order_delivered" : `order_${status}`;
    queueNotification(d, "email", event, o.email, `Order ${o.number}: ${status.replace(/_/g, " ")}`);
  });
}

export async function refundOrder(orderId: string, restock: boolean) {
  const o = db.get().orders.find((x) => x.id === orderId);
  if (!o || o.payment.status !== "succeeded") throw new Error("not_refundable");
  const res = await getProvider(o.payment.provider).refund(o.payment.reference, o.total);
  if (!res.ok) throw new Error("refund_failed");
  db.update((d) => {
    const ord = d.orders.find((x) => x.id === orderId)!;
    ord.payment.status = "refunded";
    if (restock) {
      for (const it of ord.items) {
        const rec = d.inventory.find((r) => r.productId === it.productId && r.branchId === it.branchId);
        if (rec) rec.returned += it.qty;
      }
    }
    pushStatus(ord, "refunded", `Refund ${res.reference}${restock ? " · restocked" : ""}`);
    writeAudit(d, "refund", "orders", ord.id, undefined, { amount: ord.total, restock });
    queueNotification(d, "email", "refund", ord.email, `Refund issued for ${ord.number}`);
  });
}
