import { describe, expect, it } from "vitest";
import { allocate, available, availableForProduct } from "@/lib/inventory/stock";
import { buildOrder, summarizeCart } from "@/lib/orders/checkout";
import { createSeed } from "@/lib/store/seed";
import type { Address, InventoryRecord } from "@/types";

const rec = (o: Partial<InventoryRecord>): InventoryRecord => ({ id: "r", productId: "p", branchId: "b1", total: 0, reserved: 0, sold: 0, returned: 0, damaged: 0, transferred: 0, ...o });
const address: Address = { id: "a", label: "Home", fullName: "Test", phone: "55551234", building: "1", street: "2", zone: "3", area: "Area", city: "Doha", landmark: "", directions: "", country: "Qatar" };

describe("inventory", () => {
  it("available = total − reserved − sold − damaged − transferred + returned", () => {
    expect(available(rec({ total: 10, reserved: 2, sold: 3, damaged: 1, transferred: 1, returned: 1 }))).toBe(4);
    expect(available(rec({ total: 1, sold: 5 }))).toBe(0);
  });

  it("allocates across branches and never oversells", () => {
    const rows = [rec({ branchId: "b1", total: 2 }), rec({ branchId: "b2", total: 3 })];
    expect(allocate(rows, "p", 4)).toEqual([{ branchId: "b2", qty: 3 }, { branchId: "b1", qty: 1 }]);
    expect(allocate(rows, "p", 6)).toBeNull();
    expect(availableForProduct(rows, "p")).toBe(5);
  });

  it("pickup allocates only from the chosen branch", () => {
    const rows = [rec({ branchId: "b1", total: 1 }), rec({ branchId: "b2", total: 5 })];
    expect(allocate(rows, "p", 2, "b1")).toBeNull();
    expect(allocate(rows, "p", 2, "b2")).toEqual([{ branchId: "b2", qty: 2 }]);
  });
});

describe("checkout", () => {
  it("builds an order with price + rate snapshots", () => {
    const d = createSeed();
    const p = d.products.find((x) => d.inventory.some((r) => r.productId === x.id && available(r) > 0))!;
    const res = buildOrder(d, [{ key: "k", productId: p.id, qty: 1 }], { customerId: "guest", name: "T", email: "t@example.com", phone: "55551234", fulfilment: "delivery", address });
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.order.status).toBe("pending_payment");
    expect(res.order.items[0].rateSnapshot.ratePerGram).toBe(d.rates.find((r) => r.id === p.rateId)!.ratePerGram);
    expect(res.order.items[0].snapshot.total).toBe(res.order.items[0].unitPrice);
    expect(res.allocations.reduce((s, a) => s + a.qty, 0)).toBe(1);
  });

  it("rejects out-of-stock and missing address", () => {
    const d = createSeed();
    const p = d.products[0];
    const total = availableForProduct(d.inventory, p.id);
    const tooMany = buildOrder(d, [{ key: "k", productId: p.id, qty: total + 1 }], { customerId: "g", name: "T", email: "t@e.com", phone: "55551234", fulfilment: "delivery", address });
    expect(tooMany).toMatchObject({ ok: false, error: "out_of_stock" });
    expect(buildOrder(d, [{ key: "k", productId: p.id, qty: 1 }], { customerId: "g", name: "T", email: "t@e.com", phone: "1", fulfilment: "delivery" })).toMatchObject({ ok: false, error: "missing_address" });
    expect(buildOrder(d, [], { customerId: "g", name: "T", email: "t@e.com", phone: "1", fulfilment: "pickup", pickupBranchId: "br-01" })).toMatchObject({ ok: false, error: "empty_cart" });
  });

  it("old order snapshots don't change when rates change", () => {
    const d = createSeed();
    const order = d.orders[0];
    const before = order.items[0].unitPrice;
    d.rates.forEach((r) => (r.ratePerGram *= 2));
    expect(d.orders[0].items[0].unitPrice).toBe(before);
  });

  it("summarizes cart with coupon and delivery", () => {
    const d = createSeed();
    const p = d.products.find((x) => availableForProduct(d.inventory, x.id) > 0)!;
    const s = summarizeCart(d, [{ key: "k", productId: p.id, qty: 1 }], "WELCOME5");
    expect(s.lines).toHaveLength(1);
    if (s.subtotal >= 300) expect(s.couponDiscount).toBeCloseTo(s.subtotal * 0.05, 1);
    expect(s.total).toBeGreaterThan(0);
  });
});
