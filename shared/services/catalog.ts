/* Read-only catalogue queries used by both apps (storefront listing/PDP and admin tables). */
import type { Database, Product } from "@/types";
import { calculatePrice } from "@/lib/pricing/engine";
import { availableForProduct } from "@/lib/inventory/stock";

export function activeProducts(d: Database): Product[] {
  return d.products.filter((p) => p.status === "active");
}

export function productBySlug(d: Database, slug: string): Product | undefined {
  return d.products.find((p) => p.slug === slug);
}

export function priceOf(d: Database, p: Product) {
  return calculatePrice(p, d.rates.find((r) => r.id === p.rateId), d.settings.taxRate);
}

export function stockOf(d: Database, productId: string, branchId?: string) {
  return availableForProduct(d.inventory, productId, branchId);
}

/** Resolves /collections/[slug]: "all", a category slug or a collection slug. */
export function resolveListing(d: Database, slug: string) {
  if (slug === "all") return { kind: "all" as const, products: activeProducts(d) };
  const cat = d.categories.find((c) => c.slug === slug && c.active);
  if (cat) return { kind: "category" as const, category: cat, products: activeProducts(d).filter((p) => p.categoryIds.includes(cat.id)) };
  const col = d.collections.find((c) => c.slug === slug && c.active);
  if (col) return { kind: "collection" as const, collection: col, products: activeProducts(d).filter((p) => p.collectionIds.includes(col.id)) };
  return null;
}

export function searchProducts(d: Database, query: string): Product[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return activeProducts(d).filter((p) => {
    const cats = p.categoryIds.map((id) => d.categories.find((c) => c.id === id)?.name.en ?? "").join(" ");
    const hay = `${p.name.en} ${p.name.ar} ${p.sku} ${p.metal} ${p.metalColour} ${cats} ${p.occasions.join(" ")}`.toLowerCase();
    return q.split(/\s+/).every((w) => hay.includes(w));
  });
}

export function relatedProducts(d: Database, p: Product, limit = 4): Product[] {
  return activeProducts(d)
    .filter((x) => x.id !== p.id && x.categoryIds.some((c) => p.categoryIds.includes(c)))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit);
}
