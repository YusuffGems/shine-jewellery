"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { deleteProduct, importProductsCsv, newProduct, saveProduct } from "@/admin/services/products";
import { stockOf } from "@/shared/services/catalog";
import { calculatePrice } from "@/lib/pricing/engine";
import { slugify } from "@/lib/utils";
import { CrudManager, type FieldDef } from "@/admin/components/CrudManager";
import { StatusBadge } from "@/admin/components/ui";
import { PriceBreakdown } from "@/shared/components/PriceBreakdown";
import { Media } from "@/shared/components/Media";
import { Modal } from "@/shared/components/Overlay";
import { useToast } from "@/shared/components/Toast";
import type { Badge, Product } from "@/types";

const BADGES: Badge[] = ["NEW", "BESTSELLER", "EXCLUSIVE", "LIMITED", "TRENDING"];
const OCCASIONS = ["Everyday", "Wedding", "Engagement", "Anniversary", "Gifting"];

export default function ProductsAdminPage() {
  const d = useDb();
  const { t, L, money } = useI18n();
  const toast = useToast();
  const [status, setStatus] = useState<"all" | "active" | "draft">("all");
  const [importOpen, setImportOpen] = useState(false);
  const [csv, setCsv] = useState("sku,name_en,name_ar,category_slug,rate_id,net_weight,making_type,making_charge,status\n");

  const fields: FieldDef[] = useMemo(() => [
    { key: "", label: t("admin.f.basics"), type: "section" },
    { key: "name", label: t("admin.f.name"), type: "localized", span2: true },
    { key: "sku", label: "SKU", type: "text" },
    { key: "slug", label: t("admin.f.slug"), type: "text", hint: t("admin.f.slugHint") },
    { key: "status", label: t("admin.f.status"), type: "select", options: [{ value: "active", label: t("status.active") }, { value: "draft", label: t("status.draft") }] },
    { key: "type", label: t("admin.f.productType"), type: "select", options: [{ value: "jewellery", label: t("admin.f.jewellery") }, { value: "bullion", label: t("admin.f.bullion") }] },
    { key: "description", label: t("admin.f.description"), type: "localizedText" },
    { key: "", label: t("admin.f.merchandising"), type: "section" },
    { key: "categoryIds", label: t("admin.nav.categories"), type: "multiselect", span2: true, options: d.categories.map((c) => ({ value: c.id, label: c.name.en })) },
    { key: "collectionIds", label: t("admin.nav.collections"), type: "multiselect", span2: true, options: d.collections.map((c) => ({ value: c.id, label: c.name.en })) },
    { key: "badges", label: t("admin.f.badges"), type: "multiselect", options: BADGES.map((b) => ({ value: b, label: b })) },
    { key: "occasions", label: t("filters.occasion"), type: "multiselect", options: OCCASIONS.map((o) => ({ value: o, label: o })) },
    { key: "gender", label: t("filters.gender"), type: "select", options: ["Women", "Men", "Unisex", "Kids"].map((g) => ({ value: g, label: g })) },
    { key: "sizes", label: t("admin.f.sizes"), type: "tags" },
    { key: "popularity", label: t("admin.f.popularity"), type: "number", hint: t("admin.f.popularityHint") },
    { key: "", label: t("admin.f.metalPricing"), type: "section" },
    { key: "rateId", label: t("admin.f.metalRate"), type: "select", options: d.rates.map((r) => ({ value: r.id, label: r.label.en })) },
    { key: "metalColour", label: t("product.colour"), type: "select", options: ["Yellow", "White", "Rose", "Two-tone"].map((c) => ({ value: c, label: c })) },
    { key: "netWeight", label: `${t("product.netWeight")} (g)`, type: "number", step: 0.001 },
    { key: "grossWeight", label: `${t("product.grossWeight")} (g)`, type: "number", step: 0.001 },
    { key: "makingChargeType", label: t("admin.f.makingType"), type: "select", options: [{ value: "perGram", label: t("admin.f.perGram") }, { value: "percent", label: t("admin.f.percent") }, { value: "fixed", label: t("admin.f.fixed") }] },
    { key: "makingCharge", label: t("price.making"), type: "number" },
    { key: "wastagePercent", label: `${t("price.wastage")} %`, type: "number" },
    { key: "stoneValue", label: `${t("price.stone")} (QAR)`, type: "number" },
    { key: "stoneDetails", label: t("product.stones"), type: "text" },
    { key: "premium", label: `${t("price.premium")} (QAR)`, type: "number" },
    { key: "otherCharges", label: `${t("price.other")} (QAR)`, type: "number" },
    { key: "discountPercent", label: `${t("price.discount")} %`, type: "number" },
    { key: "", label: t("product.diamondDetails"), type: "section" },
    { key: "diamond.carat", label: t("filters.carat"), type: "number", step: 0.01 },
    { key: "diamond.shape", label: t("filters.shape"), type: "text" },
    { key: "diamond.colour", label: t("filters.diamondColour"), type: "text" },
    { key: "diamond.clarity", label: t("filters.clarity"), type: "text" },
    { key: "diamond.pieces", label: t("product.pieces"), type: "number" },
    { key: "diamond.value", label: `${t("price.diamond")} (QAR)`, type: "number" },
    { key: "certificateNo", label: t("product.certificate"), type: "text" },
    { key: "", label: t("admin.f.media"), type: "section" },
    { key: "imageIds", label: t("admin.f.images"), type: "mediaList", span2: true, hint: t("admin.f.imagesHint") },
    { key: "videoIds", label: t("admin.f.videos"), type: "videoList", span2: true, hint: t("admin.f.videosHint") },
    { key: "", label: "SEO", type: "section" },
    { key: "seo.title", label: t("admin.f.seoTitle"), type: "text", span2: true },
    { key: "seo.description", label: t("admin.f.seoDescription"), type: "textarea", span2: true },
  ], [d.categories, d.collections, d.rates, t]);

  return (
    <>
      <CrudManager<Product>
        title={t("admin.nav.products")}
        fields={fields}
        sub={t("admin.products.sub")}
        items={d.products}
        filter={(p) => status === "all" || p.status === status}
        toolbar={
          <select className="select" value={status} onChange={(e) => setStatus(e.target.value as typeof status)} aria-label={t("admin.f.status")}>
            <option value="all">{t("admin.allStatuses")}</option>
            <option value="active">{t("status.active")}</option>
            <option value="draft">{t("status.draft")}</option>
          </select>
        }
        headerActions={<button className="btn btn--secondary" onClick={() => setImportOpen(true)}>{t("admin.products.import")}</button>}
        search={(p) => `${p.name.en} ${p.name.ar} ${p.sku}`}
        readPerm="products.read"
        writePerm="products.update"
        deletePerm="products.delete"
        newItem={() => newProduct(d)}
        validate={(p) => {
          if (!p.name.en.trim() || !p.sku.trim()) return t("admin.products.required");
          if (d.products.some((x) => x.id !== p.id && x.sku === p.sku)) return t("admin.products.skuTaken");
          if (d.products.some((x) => x.id !== p.id && x.slug === p.slug)) return t("admin.products.slugTaken");
          if (p.netWeight <= 0) return t("admin.products.weight");
          return null;
        }}
        onSave={(p) => {
          const dm: Partial<NonNullable<Product["diamond"]>> = p.diamond ?? {};
          const diamond = dm.carat && dm.carat > 0 ? { carat: dm.carat, pieces: dm.pieces || 1, value: dm.value || 0, shape: dm.shape || "Round", colour: dm.colour || "", clarity: dm.clarity || "" } : undefined;
          saveProduct({ ...p, slug: slugify(p.slug || p.name.en), metal: p.rateId.startsWith("gold") ? "gold" : p.rateId.startsWith("silver") ? "silver" : "platinum", diamond });
        }}
        onDelete={(p) => deleteProduct(p.id)}
        editorExtra={(p) => (
          <div className="price-preview">
            <div className="row row--between" style={{ marginBottom: "0.75rem" }}><strong>{t("admin.products.livePrice")}</strong><span className="muted small">{t("admin.products.livePriceHint")}</span></div>
            <PriceBreakdown b={calculatePrice(p, d.rates.find((r) => r.id === p.rateId), d.settings.taxRate)} weight={p.netWeight} />
          </div>
        )}
        columns={[
          { label: t("admin.f.product"), render: (p) => (
            <span className="cell-main">
              <span className="thumb"><Media mediaId={p.imageIds[0]} kind="product" /></span>
              <span><b>{L(p.name)}</b><small className="ltr">{p.sku}</small></span>
            </span>
          ) },
          { label: t("admin.f.metalRate"), render: (p) => L(d.rates.find((r) => r.id === p.rateId)?.label) },
          { label: t("price.total"), num: true, render: (p) => money(calculatePrice(p, d.rates.find((r) => r.id === p.rateId), d.settings.taxRate).total) },
          { label: t("admin.f.stock"), num: true, render: (p) => stockOf(d, p.id) },
          { label: t("admin.f.status"), render: (p) => <StatusBadge value={p.status} /> },
        ]}
        rowActions={(p) => <Link className="btn btn--secondary btn--sm" href={`/product/${p.slug}`} target="_blank">{t("common.view")}</Link>}
      />
      <Modal open={importOpen} onClose={() => setImportOpen(false)} title={t("admin.products.import")} wide closeLabel={t("common.close")} footer={
        <button className="btn" onClick={() => {
          const r = importProductsCsv(csv);
          toast(t("admin.products.importDone", { created: r.created, updated: r.updated }));
          if (r.errors.length) toast(r.errors.slice(0, 2).join(" · "), "error");
          setImportOpen(false);
        }}>{t("admin.products.runImport")}</button>
      }>
        <p className="muted small" style={{ marginBottom: "0.75rem" }}>{t("admin.products.importHint")}</p>
        <input type="file" accept=".csv,text/csv" className="input" style={{ marginBottom: "0.75rem" }} onChange={async (e) => e.target.files?.[0] && setCsv(await e.target.files[0].text())} />
        <textarea className="textarea" style={{ minHeight: 220, fontFamily: "ui-monospace, monospace", fontSize: 12 }} value={csv} onChange={(e) => setCsv(e.target.value)} />
      </Modal>
    </>
  );
}
