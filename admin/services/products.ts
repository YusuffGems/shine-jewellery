/* ADMIN APP — product create/update/delete and CSV import. */
import { db } from "@/lib/store/db";
import type { Database, Product } from "@/types";
import { nowIso, uid } from "@/lib/utils";
import { removeEntity, upsertEntity } from "@/shared/services/core";


/* ── Mutations ─────────────────────────────────────────────── */
export const saveProduct = (p: Product) => upsertEntity("products", { ...p, updatedAt: nowIso() });

export function deleteProduct(id: string) {
  removeEntity("products", id);
  db.update((d) => {
    d.inventory = d.inventory.filter((r) => r.productId !== id);
  });
}

export function newProduct(d: Database): Product {
  const n = d.products.length + 1;
  return {
    id: uid("prd"), slug: `new-product-${n}`, sku: `SKU-${String(n).padStart(4, "0")}`,
    name: { en: "New product", ar: "منتج جديد" }, description: { en: "", ar: "" },
    type: "jewellery", categoryIds: [], collectionIds: [], metal: "gold", rateId: "gold-22k", metalColour: "Yellow",
    netWeight: 1, grossWeight: 1, makingChargeType: "perGram", makingCharge: 0, wastagePercent: 0, stoneValue: 0,
    premium: 0, otherCharges: 0, discountPercent: 0, badges: [], occasions: [], gender: "Women", sizes: [],
    imageIds: [], videoIds: [], status: "draft", popularity: 0, seo: { title: "", description: "" }, createdAt: nowIso(),
  };
}

/** CSV import (migration from existing site). Columns: sku,name_en,name_ar,category_slug,rate_id,net_weight,making_type,making_charge,status */
export function importProductsCsv(csv: string): { created: number; updated: number; errors: string[] } {
  const rows = csv.split(/\r?\n/).filter(Boolean);
  const header = rows.shift()?.split(",").map((h) => h.trim()) ?? [];
  const result = { created: 0, updated: 0, errors: [] as string[] };
  db.update((d) => {
    rows.forEach((line, i) => {
      const cells = line.split(",").map((c) => c.trim());
      const row = Object.fromEntries(header.map((h, j) => [h, cells[j] ?? ""]));
      if (!row.sku || !row.name_en) {
        result.errors.push(`Row ${i + 2}: sku and name_en are required`);
        return;
      }
      const cat = d.categories.find((c) => c.slug === row.category_slug);
      const existing = d.products.find((p) => p.sku === row.sku);
      const base = existing ?? newProduct(d);
      const next: Product = {
        ...base,
        sku: row.sku,
        slug: existing?.slug ?? row.sku.toLowerCase(),
        name: { en: row.name_en, ar: row.name_ar || base.name.ar },
        categoryIds: cat ? Array.from(new Set([...base.categoryIds, cat.id])) : base.categoryIds,
        rateId: row.rate_id || base.rateId,
        netWeight: Number(row.net_weight) || base.netWeight,
        makingChargeType: (row.making_type as Product["makingChargeType"]) || base.makingChargeType,
        makingCharge: Number(row.making_charge) || base.makingCharge,
        status: row.status === "active" ? "active" : "draft",
      };
      if (existing) {
        Object.assign(existing, next);
        result.updated++;
      } else {
        d.products.push(next);
        result.created++;
      }
    });
  });
  return result;
}
