/* ADMIN APP — stock adjustments, transfers, damage. */
import { db } from "@/lib/store/db";
import { available } from "@/lib/inventory/stock";
import { nowIso, uid } from "@/lib/utils";
import { actor, writeAudit } from "@/shared/services/core";
import type { Database, InventoryRecord } from "@/types";

function ensure(d: Database, productId: string, branchId: string): InventoryRecord {
  let rec = d.inventory.find((r) => r.productId === productId && r.branchId === branchId);
  if (!rec) {
    rec = { id: uid("inv"), productId, branchId, total: 0, reserved: 0, sold: 0, returned: 0, damaged: 0, transferred: 0 };
    d.inventory.push(rec);
  }
  return rec;
}

export function adjustStock(productId: string, branchId: string, delta: number, note: string) {
  db.update((d) => {
    const rec = ensure(d, productId, branchId);
    if (rec.total + delta < rec.reserved + rec.sold) throw new Error("below_committed");
    rec.total += delta;
    d.inventoryTx.unshift({ id: uid("itx"), productId, branchId, kind: "adjust", qty: delta, note, at: nowIso(), by: actor(d) });
    writeAudit(d, "adjust", "inventory", rec.id, undefined, { delta, note });
  });
}

export function markDamaged(productId: string, branchId: string, qty: number, note: string) {
  db.update((d) => {
    const rec = ensure(d, productId, branchId);
    if (available(rec) < qty) throw new Error("insufficient_stock");
    rec.damaged += qty;
    d.inventoryTx.unshift({ id: uid("itx"), productId, branchId, kind: "damage", qty, note, at: nowIso(), by: actor(d) });
  });
}

export function transferStock(productId: string, fromBranch: string, toBranch: string, qty: number) {
  if (fromBranch === toBranch || qty <= 0) throw new Error("invalid_transfer");
  db.update((d) => {
    const from = ensure(d, productId, fromBranch);
    if (available(from) < qty) throw new Error("insufficient_stock");
    const to = ensure(d, productId, toBranch);
    from.transferred += qty;
    to.total += qty;
    const by = actor(d);
    d.inventoryTx.unshift(
      { id: uid("itx"), productId, branchId: fromBranch, kind: "transfer-out", qty, note: `to ${toBranch}`, at: nowIso(), by },
      { id: uid("itx"), productId, branchId: toBranch, kind: "transfer-in", qty, note: `from ${fromBranch}`, at: nowIso(), by },
    );
    writeAudit(d, "transfer", "inventory", productId, fromBranch, { toBranch, qty });
  });
}
