/* Pure checkout business logic: cart → priced order with snapshots + stock allocation. */
import type { Address, CartItem, Database, Order, OrderItem } from "@/types";
import { applyCoupon, calculatePrice, deliveryFeeFor } from "@/lib/pricing/engine";
import { allocate, availableForProduct } from "@/lib/inventory/stock";
import { nowIso, round2, uid } from "@/lib/utils";

export interface CartLine {
  item: CartItem;
  productId: string;
  unitPrice: number;
  lineTotal: number;
  available: number;
  ok: boolean;
}

export interface CartSummary {
  lines: CartLine[];
  subtotal: number;
  couponDiscount: number;
  couponValid: boolean;
  couponReason?: string;
  deliveryFee: number;
  total: number;
  hasIssues: boolean;
}

export function summarizeCart(d: Database, cart: CartItem[], couponCode: string | undefined, fulfilment: "delivery" | "pickup" = "delivery", pickupBranchId?: string): CartSummary {
  const lines: CartLine[] = [];
  for (const item of cart) {
    const p = d.products.find((x) => x.id === item.productId && x.status === "active");
    if (!p) continue;
    const price = calculatePrice(p, d.rates.find((r) => r.id === p.rateId), d.settings.taxRate);
    const avail = availableForProduct(d.inventory, p.id, fulfilment === "pickup" ? pickupBranchId : undefined);
    lines.push({ item, productId: p.id, unitPrice: price.total, lineTotal: round2(price.total * item.qty), available: avail, ok: avail >= item.qty });
  }
  const subtotal = round2(lines.reduce((s, l) => s + l.lineTotal, 0));
  const coupon = couponCode ? d.coupons.find((c) => c.code.toUpperCase() === couponCode.toUpperCase()) : undefined;
  const c = couponCode ? applyCoupon(coupon, subtotal) : { valid: false, discount: 0, reason: undefined };
  const afterCoupon = round2(subtotal - c.discount);
  const deliveryFee = deliveryFeeFor(afterCoupon, fulfilment, d.settings.deliveryFee, d.settings.freeDeliveryThreshold);
  return {
    lines,
    subtotal,
    couponDiscount: c.discount,
    couponValid: c.valid,
    couponReason: c.reason,
    deliveryFee,
    total: round2(afterCoupon + deliveryFee),
    hasIssues: lines.some((l) => !l.ok),
  };
}

export interface CheckoutInput {
  customerId: string;
  name: string;
  email: string;
  phone: string;
  fulfilment: "delivery" | "pickup";
  address?: Address;
  pickupBranchId?: string;
  couponCode?: string;
}

export type BuildResult =
  | { ok: true; order: Order; allocations: { productId: string; branchId: string; qty: number }[] }
  | { ok: false; error: "empty_cart" | "out_of_stock" | "missing_address" | "missing_branch"; productId?: string };

export function buildOrder(d: Database, cart: CartItem[], input: CheckoutInput): BuildResult {
  if (!cart.length) return { ok: false, error: "empty_cart" };
  if (input.fulfilment === "delivery" && !input.address) return { ok: false, error: "missing_address" };
  if (input.fulfilment === "pickup" && !input.pickupBranchId) return { ok: false, error: "missing_branch" };

  const at = nowIso();
  const items: OrderItem[] = [];
  const allocations: { productId: string; branchId: string; qty: number }[] = [];
  const working = structuredClone(d.inventory);

  for (const ci of cart) {
    const p = d.products.find((x) => x.id === ci.productId && x.status === "active");
    if (!p) return { ok: false, error: "out_of_stock", productId: ci.productId };
    const plan = allocate(working, p.id, ci.qty, input.fulfilment === "pickup" ? input.pickupBranchId : undefined);
    if (!plan) return { ok: false, error: "out_of_stock", productId: p.id };
    const rate = d.rates.find((r) => r.id === p.rateId);
    const snapshot = calculatePrice(p, rate, d.settings.taxRate);
    for (const part of plan) {
      const rec = working.find((r) => r.productId === p.id && r.branchId === part.branchId)!;
      rec.reserved += part.qty;
      allocations.push({ productId: p.id, ...part });
      items.push({
        productId: p.id, sku: p.sku, name: p.name, qty: part.qty, size: ci.size, engraving: ci.engraving,
        unitPrice: snapshot.total, snapshot, rateSnapshot: { rateId: p.rateId, ratePerGram: rate?.ratePerGram ?? 0, at }, branchId: part.branchId,
      });
    }
  }

  const summary = summarizeCart(d, cart, input.couponCode, input.fulfilment, input.pickupBranchId);
  const seq = d.orders.filter((o) => !o.isDemo).length + 1;
  const order: Order = {
    id: uid("ord"),
    number: `SGD-${at.slice(2, 4)}${at.slice(5, 7)}-${String(seq).padStart(5, "0")}`,
    customerId: input.customerId,
    customerName: input.name,
    email: input.email,
    phone: input.phone,
    items,
    subtotal: summary.subtotal,
    couponCode: summary.couponValid ? input.couponCode?.toUpperCase() : undefined,
    couponDiscount: summary.couponDiscount,
    deliveryFee: summary.deliveryFee,
    tax: round2(items.reduce((s, i) => s + i.snapshot.tax * i.qty, 0)),
    total: summary.total,
    fulfilment: input.fulfilment,
    address: input.fulfilment === "delivery" ? input.address : undefined,
    pickupBranchId: input.fulfilment === "pickup" ? input.pickupBranchId : undefined,
    status: "pending_payment",
    payment: { provider: "mock", status: "pending", reference: "", idempotencyKey: uid("idem") },
    history: [{ status: "pending_payment", at, note: "Order created, awaiting payment" }],
    createdAt: at,
  };
  return { ok: true, order, allocations };
}
