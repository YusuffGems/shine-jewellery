import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ADMIN_ROLES, PERMISSIONS, ROLE_PERMISSIONS, can, canAccessAdmin } from "@/lib/auth/rbac";
import { DICTIONARIES, dirOf, translate } from "@/lib/i18n";
import { PRESETS, toCssVars, onColor } from "@/lib/theme/tokens";
import { applyDark } from "@/lib/theme/resolve";
import { applyFilters, computeFacets, priceMap, sortProducts } from "@/lib/catalog/facets";
import { createSeed } from "@/lib/store/seed";
import { hmacSha256, mockProvider } from "@/lib/payments/provider";
import { buildDashboard } from "@/lib/reports/analytics";

describe("RBAC", () => {
  it("super admin has every permission; customer has none", () => {
    expect(PERMISSIONS.every((p) => can("SUPER_ADMIN", p))).toBe(true);
    expect(ROLE_PERMISSIONS.CUSTOMER).toHaveLength(0);
  });
  it("customers can never access admin", () => {
    expect(canAccessAdmin("CUSTOMER")).toBe(false);
    expect(canAccessAdmin(undefined)).toBe(false);
    ADMIN_ROLES.forEach((r) => expect(canAccessAdmin(r)).toBe(true));
  });
  it("content managers edit theme/media but not orders or rates", () => {
    expect(can("CONTENT_MANAGER", "theme.update")).toBe(true);
    expect(can("CONTENT_MANAGER", "media.upload")).toBe(true);
    expect(can("CONTENT_MANAGER", "orders.refund")).toBe(false);
    expect(can("CONTENT_MANAGER", "metalRates.update")).toBe(false);
  });
  it("only super admin can edit roles", () => {
    expect(can("ADMIN", "roles.update")).toBe(false);
    expect(can("SUPER_ADMIN", "roles.update")).toBe(true);
  });
});

describe("i18n / RTL", () => {
  it("English and Arabic have exactly the same keys", () => {
    const en = Object.keys(DICTIONARIES.en).sort();
    const ar = Object.keys(DICTIONARIES.ar).sort();
    expect(ar).toEqual(en);
  });
  it("no Arabic value is empty", () => {
    expect(Object.entries(DICTIONARIES.ar).filter(([, v]) => !v.trim())).toEqual([]);
  });
  it("Arabic is RTL, English LTR", () => {
    expect(dirOf("ar")).toBe("rtl");
    expect(dirOf("en")).toBe("ltr");
  });
  it("admin overrides win and variables interpolate", () => {
    expect(translate("en", "cart.onlyLeft", undefined, { count: 2 })).toBe("Only 2 available");
    expect(translate("ar", "cart.title", { en: {}, ar: { "cart.title": "سلتي" } })).toBe("سلتي");
    expect(translate("en", "missing.key", undefined, undefined, "Fallback")).toBe("Fallback");
  });
});

describe("theme builder tokens", () => {
  it("every preset produces the full CSS variable set", () => {
    for (const p of PRESETS) {
      const vars = toCssVars(p.tokens);
      ["--color-primary", "--color-background", "--font-heading", "--btn-bg", "--grid-cols", "--radius-md"].forEach((k) => expect(vars[k]).toBeTruthy());
    }
  });
  it("picks readable foreground colours", () => {
    expect(onColor("#FFFFFF")).toBe("#101010");
    expect(onColor("#101010")).toBe("#FFFFFF");
  });
  it("dark appearance swaps colours but keeps layout tokens", () => {
    const dark = applyDark(PRESETS[0].tokens);
    expect(dark.colorBackground).not.toBe(PRESETS[0].tokens.colorBackground);
    expect(dark.gridColumns).toBe(PRESETS[0].tokens.gridColumns);
  });
});

describe("product listing", () => {
  const d = createSeed();
  const products = d.products;
  const prices = priceMap(d, products);
  it("facets count products", () => {
    const f = computeFacets(d, products, prices);
    expect(f.metal.reduce((s, o) => s + o.count, 0)).toBe(products.length);
  });
  it("filters by metal and diamond", () => {
    const res = applyFilters(d, products, { metal: ["gold"], diamond: ["yes"] }, prices);
    expect(res.length).toBeGreaterThan(0);
    expect(res.every((p) => p.metal === "gold" && p.diamond)).toBe(true);
  });
  it("sorts by price both ways", () => {
    const asc = sortProducts(products, "priceAsc", prices).map((p) => prices.get(p.id)!);
    expect([...asc].sort((a, b) => a - b)).toEqual(asc);
    const desc = sortProducts(products, "priceDesc", prices).map((p) => prices.get(p.id)!);
    expect([...desc].sort((a, b) => b - a)).toEqual(desc);
  });
});

describe("payments webhook", () => {
  it("accepts valid signatures and rejects tampered payloads", async () => {
    const body = JSON.stringify({ reference: "R", orderId: "o1", status: "succeeded", idempotencyKey: "k1", amount: 10 });
    const sig = await hmacSha256("secret", body);
    await expect(mockProvider.parseWebhook(body, sig, "secret")).resolves.toMatchObject({ orderId: "o1" });
    await expect(mockProvider.parseWebhook(body.replace("10", "99"), sig, "secret")).rejects.toThrow("invalid_signature");
    await expect(mockProvider.parseWebhook(body, null, "secret")).rejects.toThrow("missing_signature");
  });
});

describe("seed data & reports", () => {
  it("contains only placeholder showrooms and demo-labelled rates", () => {
    const d = createSeed();
    expect(d.branches.every((b) => /^Branch \d+$/.test(b.name.en) && !b.phone)).toBe(true);
    expect(d.rates.every((r) => r.status === "demo")).toBe(true);
    expect(d.social.every((s) => s.url === "")).toBe(true);
    // Every seeded visual points at a real file; all except the client's own logo are flagged as sample media.
    expect(d.media.every((m) => m.url && existsSync(join(process.cwd(), "public", m.url)))).toBe(true);
    expect(d.media.filter((m) => !m.generated).every((m) => m.tags.includes("brand"))).toBe(true);
    expect(d.products.every((p) => p.imageIds.length >= 3 && p.videoIds.length >= 1)).toBe(true);
  });
  it("dashboard aggregates from stored orders", () => {
    const r = buildDashboard(createSeed(), 30, new Date("2026-10-07T10:00:00Z"));
    expect(r.orders).toBe(10);
    expect(r.revenue).toBeGreaterThan(0);
    expect(r.salesSeries).toHaveLength(30);
  });
});
