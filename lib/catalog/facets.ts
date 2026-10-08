/* Product-listing facets & sorting — pure functions, unit-tested. */
import type { Database, Product } from "@/types";
import { calculatePrice } from "@/lib/pricing/engine";
import { availableForProduct } from "@/lib/inventory/stock";

export type FacetKey =
  | "price" | "category" | "metal" | "metalColour" | "purity" | "diamond" | "carat" | "shape" | "diamondColour"
  | "clarity" | "stone" | "collection" | "occasion" | "gender" | "availability" | "size";

export const FACET_ORDER: FacetKey[] = ["price", "category", "metal", "metalColour", "purity", "diamond", "carat", "shape", "diamondColour", "clarity", "stone", "collection", "occasion", "gender", "availability", "size"];

const PRICE_BUCKETS: [number, number][] = [[0, 1000], [1000, 3000], [3000, 7500], [7500, 15000], [15000, 40000], [40000, Infinity]];
const CARAT_BUCKETS: [number, number][] = [[0, 0.25], [0.25, 0.5], [0.5, 1], [1, 2], [2, Infinity]];

export function priceBucketLabel(i: number): string {
  const [a, b] = PRICE_BUCKETS[i];
  return b === Infinity ? `${a.toLocaleString("en")}+` : `${a.toLocaleString("en")} – ${b.toLocaleString("en")}`;
}
export function caratBucketLabel(i: number): string {
  const [a, b] = CARAT_BUCKETS[i];
  return b === Infinity ? `${a} ct+` : `${a} – ${b} ct`;
}

/** Values of a product for a facet (as string ids). */
export function facetValues(d: Database, p: Product, key: FacetKey, priceTotal: number): string[] {
  switch (key) {
    case "price": return [String(PRICE_BUCKETS.findIndex(([a, b]) => priceTotal >= a && priceTotal < b))];
    case "category": return p.categoryIds;
    case "metal": return [p.metal];
    case "metalColour": return [p.metalColour];
    case "purity": return [d.rates.find((r) => r.id === p.rateId)?.purity ?? ""];
    case "diamond": return [p.diamond ? "yes" : "no"];
    case "carat": return p.diamond ? [String(CARAT_BUCKETS.findIndex(([a, b]) => p.diamond!.carat >= a && p.diamond!.carat < b))] : [];
    case "shape": return p.diamond ? [p.diamond.shape] : [];
    case "diamondColour": return p.diamond ? [p.diamond.colour] : [];
    case "clarity": return p.diamond ? [p.diamond.clarity] : [];
    case "stone": return [p.stoneValue > 0 ? "gemstone" : "none"];
    case "collection": return p.collectionIds;
    case "occasion": return p.occasions;
    case "gender": return [p.gender];
    case "availability": return [availableForProduct(d.inventory, p.id) > 0 ? "in" : "out"];
    case "size": return p.sizes;
  }
}

export type Selection = Partial<Record<FacetKey, string[]>>;

export interface FacetOption { value: string; count: number }

export function computeFacets(d: Database, products: Product[], prices: Map<string, number>): Record<FacetKey, FacetOption[]> {
  const out = {} as Record<FacetKey, FacetOption[]>;
  for (const key of FACET_ORDER) {
    const counts = new Map<string, number>();
    for (const p of products) for (const v of facetValues(d, p, key, prices.get(p.id) ?? 0)) if (v !== "" && v !== "-1") counts.set(v, (counts.get(v) ?? 0) + 1);
    const opts = Array.from(counts, ([value, count]) => ({ value, count }));
    if (key === "price" || key === "carat") opts.sort((a, b) => Number(a.value) - Number(b.value));
    else opts.sort((a, b) => b.count - a.count);
    out[key] = opts;
  }
  return out;
}

export function applyFilters(d: Database, products: Product[], sel: Selection, prices: Map<string, number>): Product[] {
  const active = Object.entries(sel).filter(([, v]) => v && v.length) as [FacetKey, string[]][];
  if (!active.length) return products;
  return products.filter((p) => active.every(([key, values]) => facetValues(d, p, key, prices.get(p.id) ?? 0).some((v) => values.includes(v))));
}

export type SortKey = "recommended" | "new" | "best" | "priceAsc" | "priceDesc";
export const SORTS: SortKey[] = ["recommended", "new", "best", "priceAsc", "priceDesc"];

export function sortProducts(products: Product[], sort: SortKey, prices: Map<string, number>): Product[] {
  const list = [...products];
  switch (sort) {
    case "new": return list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    case "best": return list.sort((a, b) => b.popularity - a.popularity);
    case "priceAsc": return list.sort((a, b) => (prices.get(a.id) ?? 0) - (prices.get(b.id) ?? 0));
    case "priceDesc": return list.sort((a, b) => (prices.get(b.id) ?? 0) - (prices.get(a.id) ?? 0));
    default: return list.sort((a, b) => b.badges.length - a.badges.length || b.popularity - a.popularity);
  }
}

export function priceMap(d: Database, products: Product[]): Map<string, number> {
  return new Map(products.map((p) => [p.id, calculatePrice(p, d.rates.find((r) => r.id === p.rateId), d.settings.taxRate).total]));
}
