import { describe, expect, it } from "vitest";
import { applyCoupon, calculatePrice, deliveryFeeFor } from "@/lib/pricing/engine";
import { createSeed } from "@/lib/store/seed";
import type { Coupon, Product } from "@/types";

const base = createSeed().products[0];
const product = (o: Partial<Product>): Product => ({ ...base, diamond: undefined, stoneValue: 0, premium: 0, otherCharges: 0, discountPercent: 0, wastagePercent: 0, ...o });

describe("pricing engine — jewellery", () => {
  it("metal value = net weight × rate", () => {
    const b = calculatePrice(product({ netWeight: 10, makingChargeType: "fixed", makingCharge: 0 }), { ratePerGram: 300 }, 0);
    expect(b.metalValue).toBe(3000);
    expect(b.total).toBe(3000);
  });

  it("supports per-gram, percent and fixed making charges", () => {
    expect(calculatePrice(product({ netWeight: 5, makingChargeType: "perGram", makingCharge: 20 }), { ratePerGram: 100 }, 0).makingCharge).toBe(100);
    expect(calculatePrice(product({ netWeight: 5, makingChargeType: "percent", makingCharge: 10 }), { ratePerGram: 100 }, 0).makingCharge).toBe(50);
    expect(calculatePrice(product({ netWeight: 5, makingChargeType: "fixed", makingCharge: 75 }), { ratePerGram: 100 }, 0).makingCharge).toBe(75);
  });

  it("adds wastage, stones, diamonds, premium, other; discounts before tax", () => {
    const b = calculatePrice(
      product({ netWeight: 2, makingChargeType: "fixed", makingCharge: 100, wastagePercent: 5, stoneValue: 50, diamond: { carat: 0.3, shape: "Round", colour: "G", clarity: "VS1", pieces: 1, value: 1000 }, premium: 20, otherCharges: 30, discountPercent: 10 }),
      { ratePerGram: 250 },
      5,
    );
    // metal 500, making 100, wastage 25, stone 50, diamond 1000, premium 20, other 30 = 1725
    expect(b.subtotal).toBe(1725);
    expect(b.discount).toBe(172.5);
    expect(b.tax).toBe(77.63);
    expect(b.total).toBe(1630.13);
  });

  it("clamps invalid percentages", () => {
    const b = calculatePrice(product({ netWeight: 1, makingChargeType: "fixed", makingCharge: 0, discountPercent: 150 }), { ratePerGram: 100 }, -5);
    expect(b.discount).toBe(100);
    expect(b.tax).toBe(0);
  });

  it("missing rate prices metal at zero instead of crashing", () => {
    expect(calculatePrice(product({ netWeight: 3 }), undefined, 0).metalValue).toBe(0);
  });
});

describe("pricing engine — bullion", () => {
  it("ignores making, wastage, stones and diamonds", () => {
    const b = calculatePrice(product({ type: "bullion", netWeight: 10, makingChargeType: "perGram", makingCharge: 50, wastagePercent: 9, stoneValue: 999, premium: 85 }), { ratePerGram: 390 }, 0);
    expect(b.makingCharge).toBe(0);
    expect(b.wastage).toBe(0);
    expect(b.stoneValue).toBe(0);
    expect(b.total).toBe(3985);
  });
});

describe("coupons & delivery", () => {
  const c: Coupon = { id: "c", code: "X", type: "percent", value: 10, minSubtotal: 100, usageLimit: 2, used: 0, active: true };
  it("applies percent and fixed coupons", () => {
    expect(applyCoupon(c, 500)).toEqual({ valid: true, discount: 50 });
    expect(applyCoupon({ ...c, type: "fixed", value: 600 }, 500).discount).toBe(500);
  });
  it("rejects invalid coupons with a reason", () => {
    expect(applyCoupon(undefined, 500).reason).toBe("not_found");
    expect(applyCoupon({ ...c, active: false }, 500).reason).toBe("inactive");
    expect(applyCoupon(c, 50).reason).toBe("min_subtotal");
    expect(applyCoupon({ ...c, used: 2 }, 500).reason).toBe("limit");
  });
  it("delivery is free for pickup and above threshold", () => {
    expect(deliveryFeeFor(100, "pickup", 25, 500)).toBe(0);
    expect(deliveryFeeFor(600, "delivery", 25, 500)).toBe(0);
    expect(deliveryFeeFor(100, "delivery", 25, 500)).toBe(25);
  });
});
