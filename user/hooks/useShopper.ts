"use client";
/* USER APP hooks — signed-in customer and cart. */
import { useMemo } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { summarizeCart } from "@/lib/orders/checkout";

export function useCustomer() {
  const d = useDb();
  return useMemo(() => d.customers.find((c) => c.id === d.session.customerId), [d.customers, d.session.customerId]);
}

export function useCart(fulfilment: "delivery" | "pickup" = "delivery", pickupBranchId?: string) {
  const d = useDb();
  return useMemo(
    () => ({ items: d.session.cart, count: d.session.cart.reduce((s, c) => s + c.qty, 0), summary: summarizeCart(d, d.session.cart, d.session.couponCode, fulfilment, pickupBranchId) }),
    [d, fulfilment, pickupBranchId],
  );
}
