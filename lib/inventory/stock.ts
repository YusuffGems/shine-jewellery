import type { InventoryRecord } from "@/types";

/** Available = total − reserved − sold − damaged − transferred + returned */
export function available(r: InventoryRecord): number {
  return Math.max(0, r.total - r.reserved - r.sold - r.damaged - r.transferred + r.returned);
}

export function availableForProduct(records: InventoryRecord[], productId: string, branchId?: string): number {
  return records
    .filter((r) => r.productId === productId && (!branchId || r.branchId === branchId))
    .reduce((sum, r) => sum + available(r), 0);
}

/**
 * Picks branches to fulfil a quantity, preferring a given branch (pickup),
 * then the branch with most stock. Returns null when it would oversell.
 */
export function allocate(records: InventoryRecord[], productId: string, qty: number, preferBranchId?: string): { branchId: string; qty: number }[] | null {
  const rows = records
    .filter((r) => r.productId === productId && available(r) > 0)
    .sort((a, b) => {
      if (a.branchId === preferBranchId) return -1;
      if (b.branchId === preferBranchId) return 1;
      return available(b) - available(a);
    });
  if (preferBranchId) {
    const pref = rows.find((r) => r.branchId === preferBranchId);
    if (!pref || available(pref) < qty) return null;
    return [{ branchId: preferBranchId, qty }];
  }
  const plan: { branchId: string; qty: number }[] = [];
  let left = qty;
  for (const r of rows) {
    if (left <= 0) break;
    const take = Math.min(left, available(r));
    plan.push({ branchId: r.branchId, qty: take });
    left -= take;
  }
  return left > 0 ? null : plan;
}

export function stockStatus(qty: number, lowThreshold: number): "out" | "low" | "in" {
  if (qty <= 0) return "out";
  if (qty <= lowThreshold) return "low";
  return "in";
}
