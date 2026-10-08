/* USER APP — cart, wishlist, compare, checkout. */
import { db } from "@/lib/store/db";
import { buildOrder, type CheckoutInput } from "@/lib/orders/checkout";
import { getProvider } from "@/lib/payments/provider";
import { nowIso } from "@/lib/utils";
import { queueNotification, track, writeAudit } from "@/shared/services/core";
import type { Order } from "@/types";

const MAX_QTY = 10;

const keyOf = (productId: string, size?: string, engraving?: string) => `${productId}|${size ?? ""}|${engraving ?? ""}`;

/* ── Cart ──────────────────────────────────────────────────── */
export function addToCart(productId: string, qty = 1, size?: string, engraving?: string) {
  db.update((d) => {
    const key = keyOf(productId, size, engraving);
    const line = d.session.cart.find((c) => c.key === key);
    if (line) line.qty = Math.min(MAX_QTY, line.qty + qty);
    else d.session.cart.push({ key, productId, qty: Math.min(MAX_QTY, qty), size, engraving });
  });
  track("add_to_cart", { productId, qty });
}

export function setCartQty(key: string, qty: number) {
  db.update((d) => {
    if (qty <= 0) d.session.cart = d.session.cart.filter((c) => c.key !== key);
    else {
      const line = d.session.cart.find((c) => c.key === key);
      if (line) line.qty = Math.min(MAX_QTY, qty);
    }
  });
}

export const removeFromCart = (key: string) => setCartQty(key, 0);

export function setCoupon(code: string | undefined) {
  db.update((d) => {
    d.session.couponCode = code?.trim().toUpperCase() || undefined;
  });
}

/* ── Wishlist / compare ────────────────────────────────────── */
export function toggleWishlist(productId: string) {
  db.update((d) => {
    const has = d.session.wishlist.includes(productId);
    d.session.wishlist = has ? d.session.wishlist.filter((x) => x !== productId) : [...d.session.wishlist, productId];
  });
  track("wishlist_toggle", { productId });
}

export function toggleCompare(productId: string) {
  db.update((d) => {
    const has = d.session.compare.includes(productId);
    d.session.compare = has ? d.session.compare.filter((x) => x !== productId) : [...d.session.compare, productId].slice(-4);
  });
}

export function markViewed(productId: string) {
  db.update((d) => {
    d.session.recentlyViewed = [productId, ...d.session.recentlyViewed.filter((x) => x !== productId)].slice(0, 12);
    d.analytics.unshift({ id: `evt_${Date.now()}`, event: "product_view", data: { productId }, at: nowIso() });
  });
}

/* ── Checkout ──────────────────────────────────────────────── */
export async function placeOrder(input: CheckoutInput): Promise<{ ok: true; orderId: string; redirectUrl: string } | { ok: false; error: string; productId?: string }> {
  const snapshot = db.get();
  const result = buildOrder(snapshot, snapshot.session.cart, input);
  if (!result.ok) return result;

  const provider = getProvider("mock");
  const session = await provider.createSession(result.order);
  const order: Order = { ...result.order, payment: { ...result.order.payment, provider: provider.name, reference: session.reference } };

  db.update((d) => {
    for (const a of result.allocations) {
      const rec = d.inventory.find((r) => r.productId === a.productId && r.branchId === a.branchId);
      if (rec) rec.reserved += a.qty;
    }
    d.orders.unshift(order);
    writeAudit(d, "create", "orders", order.id, undefined, { number: order.number, total: order.total });
    queueNotification(d, "email", "order_created", order.email, `Order ${order.number} created`);
  });
  track("checkout_submitted", { orderId: order.id, total: order.total });
  return { ok: true, orderId: order.id, redirectUrl: session.redirectUrl };
}
