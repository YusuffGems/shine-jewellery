"use client";
import { useMemo, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { calculatePrice } from "@/lib/pricing/engine";
import { saveSettings } from "@/admin/services/content";
import { PageHead } from "@/admin/components/ui";
import { PriceBreakdown } from "@/shared/components/PriceBreakdown";
import { useToast } from "@/shared/components/Toast";
import { CrudManager, usePaged } from "@/admin/components/CrudManager";
import { deleteProduct, newProduct, saveProduct } from "@/admin/services/products";
import { slugify } from "@/lib/utils";
import type { Product } from "@/types";

/** Pricing rules (global) + full price list with breakdown + order price snapshots. */
export default function PricingPage() {
  const d = useDb();
  const { t, L, money, date } = useI18n();
  const { can } = useAdmin();
  const toast = useToast();
  const [rules, setRules] = useState({ taxRate: d.settings.taxRate, priceLockMinutes: d.settings.priceLockMinutes, deliveryFee: d.settings.deliveryFee, freeDeliveryThreshold: d.settings.freeDeliveryThreshold });
  const [selected, setSelected] = useState(d.products[0]?.id ?? "");
  const rows = useMemo(() => d.products.map((p) => ({ p, b: calculatePrice(p, d.rates.find((r) => r.id === p.rateId), d.settings.taxRate) })), [d]);
  const sel = rows.find((r) => r.p.id === selected);
  const snapshots = d.orders.flatMap((o) => o.items.map((it) => ({ o, it })));
  const snapPaged = usePaged(snapshots, snapshots.length);
  const [fRate, setFRate] = useState("all");
  const [fCat, setFCat] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [fPrice, setFPrice] = useState("all");
  const priceOfP = (p: Product) => calculatePrice(p, d.rates.find((r) => r.id === p.rateId), d.settings.taxRate);
  /** When this product's price last changed: product edited, or its metal rate updated — whichever is later. */
  const priceUpdated = (p: Product): { at: string; why: string } => {
    const prod = p.updatedAt ?? p.createdAt;
    const rate = d.rates.find((r) => r.id === p.rateId)?.updatedAt;
    return rate && Date.parse(rate) > Date.parse(prod) ? { at: rate, why: "Metal rate" } : { at: prod, why: p.updatedAt ? "Product edit" : "Added" };
  };
  const PRICE_BANDS: Record<string, [number, number]> = { "0-1000": [0, 1000], "1000-3000": [1000, 3000], "3000-7500": [3000, 7500], "7500-15000": [7500, 15000], "15000+": [15000, Infinity] };

  return (
    <>
      <PageHead title={t("admin.nav.pricing")} sub={t("admin.pricing.sub")} />
      <div className="a-grid-2">
        <div className="a-card">
          <h2>{t("admin.pricing.rules")}</h2>
          <div className="a-form">
            {(Object.keys(rules) as (keyof typeof rules)[]).map((k) => (
              <label key={k} className="field"><span className="label">{t(`admin.pricing.${k}`)}</span><input className="input" type="number" step="0.01" value={rules[k]} onChange={(e) => setRules({ ...rules, [k]: Number(e.target.value) })} disabled={!can("settings.update")} /></label>
            ))}
          </div>
          <p className="field-hint" style={{ margin: "0.75rem 0" }}>{t("admin.pricing.formula")}</p>
          {can("settings.update") ? <button className="btn" onClick={() => (saveSettings({ ...d.settings, ...rules }), toast(t("common.saved")))}>{t("common.save")}</button> : null}
        </div>
        <div className="a-card">
          <h2>{t("admin.pricing.calculator")}<select className="select" style={{ maxWidth: 260 }} value={selected} onChange={(e) => setSelected(e.target.value)}>{d.products.map((p) => <option key={p.id} value={p.id}>{p.name.en}</option>)}</select></h2>
          {sel ? <PriceBreakdown b={sel.b} weight={sel.p.netWeight} /> : null}
        </div>
      </div>
      <div className="a-card price-list-crud">
        <CrudManager<Product>
          title={t("admin.pricing.priceList")}
          sub="Add, edit or delete products and their price details. The total updates automatically from today's metal rate."
          items={d.products}
          search={(p) => `${p.name.en} ${p.name.ar} ${p.sku}`}
          filter={(p) => {
            if (fRate !== "all" && p.rateId !== fRate) return false;
            if (fCat !== "all" && !p.categoryIds.includes(fCat)) return false;
            if (fStatus !== "all" && p.status !== fStatus) return false;
            if (fPrice !== "all") {
              const [a, b] = PRICE_BANDS[fPrice];
              const tot = priceOfP(p).total;
              if (tot < a || tot >= b) return false;
            }
            return true;
          }}
          toolbar={
            <>
              <select className="select" value={fRate} onChange={(e) => setFRate(e.target.value)} aria-label={t("admin.f.metalRate")}>
                <option value="all">All metals</option>
                {d.rates.map((r) => <option key={r.id} value={r.id}>{L(r.label)}</option>)}
              </select>
              <select className="select" value={fCat} onChange={(e) => setFCat(e.target.value)} aria-label={t("admin.nav.categories")}>
                <option value="all">All categories</option>
                {d.categories.map((c) => <option key={c.id} value={c.id}>{L(c.name)}</option>)}
              </select>
              <select className="select" value={fPrice} onChange={(e) => setFPrice(e.target.value)} aria-label="Price">
                <option value="all">All prices</option>
                {Object.keys(PRICE_BANDS).map((k) => <option key={k} value={k}>QAR {k.replace("-", " – ")}</option>)}
              </select>
              <select className="select" value={fStatus} onChange={(e) => setFStatus(e.target.value)} aria-label={t("admin.f.status")}>
                <option value="all">{t("admin.allStatuses")}</option>
                <option value="active">{t("status.active")}</option>
                <option value="draft">{t("status.draft")}</option>
              </select>
            </>
          }
          readPerm="products.read"
          writePerm="products.update"
          deletePerm="products.delete"
          newItem={() => newProduct(d)}
          validate={(p) => {
            if (!p.name.en.trim() || !p.sku.trim()) return t("admin.products.required");
            if (d.products.some((x) => x.id !== p.id && x.sku === p.sku)) return t("admin.products.skuTaken");
            if (p.netWeight <= 0) return t("admin.products.weight");
            return null;
          }}
          onSave={(p) => {
            const dm: Partial<NonNullable<Product["diamond"]>> = p.diamond ?? {};
            const hasDiamond = (dm.carat ?? 0) > 0 || (dm.value ?? 0) > 0;
            const diamond = hasDiamond ? { carat: dm.carat || 0, pieces: dm.pieces || 1, value: dm.value || 0, shape: dm.shape || "Round", colour: dm.colour || "", clarity: dm.clarity || "" } : undefined;
            const slug = d.products.some((x) => x.id === p.id) ? p.slug : slugify(p.name.en) || p.slug;
            saveProduct({ ...p, slug, metal: p.rateId.startsWith("gold") ? "gold" : p.rateId.startsWith("silver") ? "silver" : "platinum", diamond });
          }}
          onDelete={(p) => deleteProduct(p.id)}
          fields={[
            { key: "", label: t("admin.f.basics"), type: "section" },
            { key: "name", label: t("admin.f.name"), type: "localized", span2: true },
            { key: "sku", label: "SKU", type: "text" },
            { key: "status", label: t("admin.f.status"), type: "select", options: [{ value: "active", label: t("status.active") }, { value: "draft", label: t("status.draft") }] },
            { key: "type", label: t("admin.f.productType"), type: "select", options: [{ value: "jewellery", label: t("admin.f.jewellery") }, { value: "bullion", label: t("admin.f.bullion") }] },
            { key: "categoryIds", label: t("admin.nav.categories"), type: "multiselect", span2: true, options: d.categories.map((c) => ({ value: c.id, label: c.name.en })) },
            { key: "", label: t("admin.f.metalPricing"), type: "section" },
            { key: "rateId", label: t("admin.f.metalRate"), type: "select", options: d.rates.map((r) => ({ value: r.id, label: r.label.en })) },
            { key: "netWeight", label: `${t("product.netWeight")} (g)`, type: "number", step: 0.001 },
            { key: "grossWeight", label: `${t("product.grossWeight")} (g)`, type: "number", step: 0.001 },
            { key: "makingChargeType", label: t("admin.f.makingType"), type: "select", options: [{ value: "perGram", label: t("admin.f.perGram") }, { value: "percent", label: t("admin.f.percent") }, { value: "fixed", label: t("admin.f.fixed") }] },
            { key: "makingCharge", label: t("price.making"), type: "number" },
            { key: "wastagePercent", label: `${t("price.wastage")} %`, type: "number" },
            { key: "stoneValue", label: `${t("price.stone")} (QAR)`, type: "number" },
            { key: "diamond.value", label: `${t("price.diamond")} (QAR)`, type: "number" },
            { key: "diamond.carat", label: t("filters.carat"), type: "number", step: 0.01 },
            { key: "premium", label: `${t("price.premium")} (QAR)`, type: "number" },
            { key: "otherCharges", label: `${t("price.other")} (QAR)`, type: "number" },
            { key: "discountPercent", label: `${t("price.discount")} %`, type: "number" },
          ]}
          editorExtra={(p) => (
            <div className="price-preview">
              <div className="row row--between" style={{ marginBottom: "0.75rem" }}><strong>{t("admin.products.livePrice")}</strong><span className="muted small">{t("admin.products.livePriceHint")}</span></div>
              <PriceBreakdown b={priceOfP(p)} weight={p.netWeight} />
            </div>
          )}
          columns={[
            { label: t("admin.f.product"), render: (p) => <span><b style={{ fontWeight: 500 }}>{L(p.name)}</b><br /><small className="muted ltr">{p.sku} · {L(d.rates.find((r) => r.id === p.rateId)?.label)}</small></span> },
            { label: t("price.metal"), num: true, render: (p) => money(priceOfP(p).metalValue) },
            { label: t("price.making"), num: true, render: (p) => money(priceOfP(p).makingCharge) },
            { label: t("price.wastage"), num: true, render: (p) => money(priceOfP(p).wastage) },
            { label: `${t("price.stone")}+${t("price.diamond")}`, num: true, render: (p) => { const b = priceOfP(p); return money(b.stoneValue + b.diamondValue); } },
            { label: t("price.premium"), num: true, render: (p) => { const b = priceOfP(p); return money(b.premium + b.otherCharges); } },
            { label: t("price.tax", { rate: d.settings.taxRate }), num: true, render: (p) => money(priceOfP(p).tax) },
            { label: t("price.total"), num: true, render: (p) => <b>{money(priceOfP(p).total)}</b> },
            { label: "Price updated", render: (p) => { const u = priceUpdated(p); return <span className="small" style={{ whiteSpace: "nowrap" }}>{date(u.at, true)}<br /><small className="muted">{u.why}</small></span>; } },
          ]}
        />
      </div>
      <div className="a-card">
        <h2>{t("admin.pricing.snapshots")}</h2>
        <p className="field-hint" style={{ marginBottom: "0.75rem" }}>{t("admin.pricing.snapshotsHint")}</p>
        <table className="table">
          <thead><tr><th className="num" style={{ width: 56 }}>S.No</th><th>{t("order.col.number")}</th><th>{t("admin.f.product")}</th><th className="num">{t("admin.pricing.rateAtOrder")}</th><th className="num">{t("admin.pricing.rateNow")}</th><th className="num">{t("admin.pricing.priceAtOrder")}</th><th>{t("order.col.date")}</th></tr></thead>
          <tbody>
            {snapPaged.pageRows.map(({ o, it }, i) => (
              <tr key={o.id + i}><td className="num muted">{snapPaged.start + i + 1}</td><td className="ltr">{o.number}</td><td>{L(it.name)}</td><td className="num">{money(it.rateSnapshot.ratePerGram)}</td><td className="num">{money(d.rates.find((r) => r.id === it.rateSnapshot.rateId)?.ratePerGram ?? 0)}</td><td className="num">{money(it.unitPrice)}</td><td>{date(o.createdAt)}</td></tr>
            ))}
          </tbody>
        </table>
        {snapPaged.pager}
      </div>
    </>
  );
}