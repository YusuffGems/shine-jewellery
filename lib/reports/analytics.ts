/* Report aggregations — pure, computed from real stored data (mock db or API). */
import type { Database } from "@/types";
import { available } from "@/lib/inventory/stock";
import { round2 } from "@/lib/utils";

const PAID = new Set(["paid", "confirmed", "processing", "shipped", "ready_for_pickup", "delivered"]);

function dayKey(iso: string) {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Qatar" });
}

export function buildDashboard(d: Database, days: number, now = new Date()) {
  const paid = d.orders.filter((o) => PAID.has(o.status));
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) keys.push(dayKey(new Date(now.getTime() - i * 86_400_000).toISOString()));
  const sales = new Map(keys.map((k) => [k, 0]));
  const counts = new Map(keys.map((k) => [k, 0]));
  for (const o of d.orders) {
    const k = dayKey(o.createdAt);
    if (counts.has(k)) counts.set(k, counts.get(k)! + 1);
    if (PAID.has(o.status) && sales.has(k)) sales.set(k, sales.get(k)! + o.total);
  }
  const byBranch = new Map<string, number>();
  const byCategory = new Map<string, number>();
  const byProduct = new Map<string, number>();
  for (const o of paid)
    for (const it of o.items) {
      const v = it.unitPrice * it.qty;
      byBranch.set(it.branchId, (byBranch.get(it.branchId) ?? 0) + v);
      byProduct.set(it.productId, (byProduct.get(it.productId) ?? 0) + it.qty);
      const p = d.products.find((x) => x.id === it.productId);
      const cat = p?.categoryIds.find((c) => !["cat-gold-jewellery", "cat-diamond-jewellery"].includes(c)) ?? p?.categoryIds[0];
      if (cat) byCategory.set(cat, (byCategory.get(cat) ?? 0) + v);
    }
  const label = (k: string) => k.slice(8, 10) + "/" + k.slice(5, 7);
  const sorted = (m: Map<string, number>) => Array.from(m, ([id, value]) => ({ id, value: round2(value) })).sort((a, b) => b.value - a.value);
  const perProduct = new Map<string, number>();
  for (const r of d.inventory) perProduct.set(r.productId, (perProduct.get(r.productId) ?? 0) + available(r));

  return {
    revenue: round2(paid.reduce((s, o) => s + o.total, 0)),
    orders: d.orders.length,
    customers: d.customers.length,
    products: d.products.filter((p) => p.status === "active").length,
    unitsAvailable: Array.from(perProduct.values()).reduce((s, n) => s + n, 0),
    lowStock: Array.from(perProduct.values()).filter((n) => n <= d.settings.lowStockThreshold).length,
    pendingPayments: d.orders.filter((o) => o.payment.status === "pending").length,
    refunds: round2(d.orders.filter((o) => o.status === "refunded").reduce((s, o) => s + o.total, 0)),
    openAppointments: d.appointments.filter((a) => a.status === "requested").length,
    salesSeries: keys.map((k) => ({ label: label(k), value: round2(sales.get(k) ?? 0) })),
    orderSeries: keys.map((k) => ({ label: label(k), value: counts.get(k) ?? 0 })),
    byBranch: sorted(byBranch),
    byCategory: sorted(byCategory),
    topProducts: sorted(byProduct).slice(0, 5),
    hasDemoData: d.orders.some((o) => o.isDemo),
  };
}

export function eventCounts(d: Database): { event: string; count: number }[] {
  const m = new Map<string, number>();
  for (const e of d.analytics) m.set(e.event, (m.get(e.event) ?? 0) + 1);
  return Array.from(m, ([event, count]) => ({ event, count })).sort((a, b) => b.count - a.count);
}
