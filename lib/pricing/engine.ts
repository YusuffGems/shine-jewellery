import type { Coupon, MetalRate, PriceBreakdown, Product } from "@/types";
import { round2 } from "@/lib/utils";

/**
 * SHINE pricing engine — pure functions, no UI, no storage.
 * In mock mode it runs in the browser; in API mode the same module
 * runs on the server (see app/api/pricing/quote/route.ts).
 *
 * Jewellery:
 *   Metal value = net weight × metal rate
 *   Subtotal    = metal + making + wastage + stone + diamond + premium + other
 *   Total       = (subtotal − discount) + tax
 * Bullion:
 *   Subtotal    = weight × rate + premium + additional charges
 *   Total       = (subtotal − discount) + tax
 */
export function calculatePrice(product: Product, rate: Pick<MetalRate, "ratePerGram"> | undefined, taxRate: number): PriceBreakdown {
  const metalRate = rate?.ratePerGram ?? 0;
  const metalValue = round2(product.netWeight * metalRate);
  const isBullion = product.type === "bullion";

  let makingCharge = 0;
  let wastage = 0;
  if (!isBullion) {
    if (product.makingChargeType === "percent") makingCharge = round2((metalValue * product.makingCharge) / 100);
    else if (product.makingChargeType === "perGram") makingCharge = round2(product.netWeight * product.makingCharge);
    else makingCharge = round2(product.makingCharge);
    wastage = round2((metalValue * product.wastagePercent) / 100);
  }

  const stoneValue = isBullion ? 0 : round2(product.stoneValue);
  const diamondValue = isBullion ? 0 : round2(product.diamond?.value ?? 0);
  const premium = round2(product.premium);
  const otherCharges = round2(product.otherCharges);

  const subtotal = round2(metalValue + makingCharge + wastage + stoneValue + diamondValue + premium + otherCharges);
  const discount = round2((subtotal * clampPct(product.discountPercent)) / 100);
  const taxable = round2(subtotal - discount);
  const tax = round2((taxable * clampPct(taxRate)) / 100);
  const total = round2(taxable + tax);

  return { metalRate, metalValue, makingCharge, wastage, stoneValue, diamondValue, premium, otherCharges, subtotal, discount, taxRate, tax, total };
}

function clampPct(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

export interface CouponResult { valid: boolean; discount: number; reason?: "not_found" | "inactive" | "min_subtotal" | "limit" }

export function applyCoupon(coupon: Coupon | undefined, subtotal: number): CouponResult {
  if (!coupon) return { valid: false, discount: 0, reason: "not_found" };
  if (!coupon.active) return { valid: false, discount: 0, reason: "inactive" };
  if (coupon.usageLimit > 0 && coupon.used >= coupon.usageLimit) return { valid: false, discount: 0, reason: "limit" };
  if (subtotal < coupon.minSubtotal) return { valid: false, discount: 0, reason: "min_subtotal" };
  const raw = coupon.type === "percent" ? (subtotal * clampPct(coupon.value)) / 100 : coupon.value;
  return { valid: true, discount: round2(Math.min(raw, subtotal)) };
}

export function deliveryFeeFor(subtotal: number, fulfilment: "delivery" | "pickup", fee: number, freeThreshold: number): number {
  if (fulfilment === "pickup") return 0;
  if (freeThreshold > 0 && subtotal >= freeThreshold) return 0;
  return round2(fee);
}
