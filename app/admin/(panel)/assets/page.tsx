"use client";
/* ADMIN › Site assets — every logo, hero, banner, category, collection, showroom and product visual in one place.
   Each slot: Upload new · Replace file (updates everywhere it's used) · Choose from library · Remove. */
import Link from "next/link";
import { useMemo, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { assignMedia } from "@/admin/services/assets";
import { storefrontTokens } from "@/lib/theme/resolve";
import { AssetSlot } from "@/admin/components/AssetSlot";
import { MediaField } from "@/admin/components/MediaPicker";
import { PageHead } from "@/admin/components/ui";
import { Media } from "@/shared/components/Media";

const TABS = ["brand", "homepage", "banners", "categories", "collections", "showrooms", "menus", "products"] as const;
type Tab = (typeof TABS)[number];

export default function SiteAssetsPage() {
  const d = useDb();
  const { t, L } = useI18n();
  const { can } = useAdmin();
  const [tab, setTab] = useState<Tab>("brand");
  const [q, setQ] = useState("");
  const locked = !can("media.upload") || !can("cms.update");
  const { tokens } = storefrontTokens(d);
  const placeholders = d.media.filter((m) => m.generated || !m.url).length;
  const products = useMemo(() => d.products.filter((p) => !q || `${p.name.en} ${p.sku}`.toLowerCase().includes(q.toLowerCase())), [d.products, q]);
  const sectionsWithMedia = d.cms.sections.filter((s) => ["hero", "featuredCollection", "diamondStory", "goldStory", "editorial", "videoStory", "personalisation", "craftsmanship"].includes(s.type));

  return (
    <>
      <PageHead title={t("admin.nav.assets")} sub={t("admin.assets.sub", { count: placeholders })} actions={<Link href="/admin/media" className="btn btn--secondary">{t("admin.nav.media")}</Link>} />
      <div className="tabs" role="tablist" style={{ marginBottom: "1.25rem" }}>
        {TABS.map((x) => <button key={x} role="tab" className="tab" aria-selected={tab === x} onClick={() => setTab(x)}>{t(`admin.assets.tab.${x}`)}</button>)}
      </div>

      {tab === "brand" ? (
        <div className="asset-grid">
          <AssetSlot label={t("admin.theme.logo")} hint={t("admin.assets.logoHint")} mediaId={tokens.logoMediaId} folder="Homepage" ratio="3/1" disabled={locked} onChange={(id) => assignMedia({ kind: "brand", key: "logoMediaId" }, id)} />
          <AssetSlot label={t("admin.theme.logoDark")} hint={t("admin.assets.logoDarkHint")} mediaId={tokens.logoDarkMediaId} folder="Homepage" ratio="3/1" disabled={locked} onChange={(id) => assignMedia({ kind: "brand", key: "logoDarkMediaId" }, id)} />
          <AssetSlot label={t("admin.theme.favicon")} hint={t("admin.assets.faviconHint")} mediaId={tokens.faviconMediaId} folder="Homepage" ratio="1/1" disabled={locked} onChange={(id) => assignMedia({ kind: "brand", key: "faviconMediaId" }, id)} />
        </div>
      ) : null}

      {tab === "homepage" ? (
        <div className="stack" style={{ gap: "1.5rem" }}>
          {sectionsWithMedia.map((s) => (
            <div key={s.id} className="a-card">
              <h2>{t(`admin.section.${s.type}`)} <small className="muted">{L(s.title)}</small></h2>
              <div className="asset-grid">
                <AssetSlot label={s.type === "hero" ? t("admin.cms.desktopImage") : t("admin.f.image")} mediaId={s.mediaId} folder={s.type === "hero" ? "Homepage" : "Campaigns"} disabled={locked} onChange={(id) => assignMedia({ kind: "section", sectionId: s.id, field: "mediaId" }, id)} />
                {s.type === "hero" ? <AssetSlot label={t("admin.cms.mobileImage")} mediaId={s.mobileMediaId} folder="Homepage" ratio="2/3" disabled={locked} onChange={(id) => assignMedia({ kind: "section", sectionId: s.id, field: "mobileMediaId" }, id)} /> : null}
                <AssetSlot label={t("admin.cms.video")} hint={t("admin.cms.videoHint")} type="video" mediaId={s.videoId} folder="Videos" disabled={locked} onChange={(id) => assignMedia({ kind: "section", sectionId: s.id, field: "videoId" }, id)} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "banners" ? (
        <div className="stack" style={{ gap: "1.5rem" }}>
          <p className="notice">{t("admin.assets.bannersNote")} <Link href="/admin/banners" className="btn btn--ghost btn--sm">{t("admin.nav.banners")}</Link></p>
          {d.banners.map((b) => (
            <div key={b.id} className="a-card">
              <h2>{L(b.title)} <small className="muted">{t(`admin.banners.place.${b.placement}`)}</small></h2>
              <div className="asset-grid">
                <AssetSlot label={t("admin.cms.desktopImage")} mediaId={b.mediaId} folder="Banners" disabled={locked} onChange={(id) => assignMedia({ kind: "banner", id: b.id, field: "mediaId" }, id)} />
                <AssetSlot label={t("admin.cms.mobileImage")} mediaId={b.mobileMediaId} folder="Banners" ratio="4/5" disabled={locked} onChange={(id) => assignMedia({ kind: "banner", id: b.id, field: "mobileMediaId" }, id)} />
                <AssetSlot label={t("admin.cms.video")} type="video" mediaId={b.videoId} folder="Videos" disabled={locked} onChange={(id) => assignMedia({ kind: "banner", id: b.id, field: "videoId" }, id)} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "categories" ? (
        <div className="asset-grid">
          {d.categories.map((c) => <AssetSlot key={c.id} label={L(c.name)} mediaId={c.mediaId} folder="Collections" ratio="3/4" disabled={locked} onChange={(id) => assignMedia({ kind: "category", id: c.id }, id)} />)}
        </div>
      ) : null}

      {tab === "collections" ? (
        <div className="stack" style={{ gap: "1.5rem" }}>
          {d.collections.map((c) => (
            <div key={c.id} className="a-card">
              <h2>{L(c.name)}</h2>
              <div className="asset-grid">
                <AssetSlot label={t("admin.f.heroImage")} mediaId={c.heroMediaId} folder="Collections" disabled={locked} onChange={(id) => assignMedia({ kind: "collection", id: c.id, field: "heroMediaId" }, id)} />
                <AssetSlot label={t("admin.f.heroVideo")} type="video" mediaId={c.heroVideoId} folder="Videos" disabled={locked} onChange={(id) => assignMedia({ kind: "collection", id: c.id, field: "heroVideoId" }, id)} />
                <AssetSlot label={t("admin.f.thumbnail")} mediaId={c.thumbnailId} folder="Collections" ratio="1/1" disabled={locked} onChange={(id) => assignMedia({ kind: "collection", id: c.id, field: "thumbnailId" }, id)} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "showrooms" ? (
        <div className="stack" style={{ gap: "1.5rem" }}>
          {d.branches.map((b) => (
            <div key={b.id} className="a-card">
              <h2>{L(b.name)}</h2>
              <div className="asset-grid">
                <AssetSlot label={t("admin.f.image")} mediaId={b.imageIds[0]} folder="Showrooms" disabled={locked} onChange={(id) => assignMedia({ kind: "branch", id: b.id, field: "image" }, id)} />
                <AssetSlot label={t("admin.cms.video")} type="video" mediaId={b.videoId} folder="Videos" disabled={locked} onChange={(id) => assignMedia({ kind: "branch", id: b.id, field: "videoId" }, id)} />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === "menus" ? (
        <div className="asset-grid">
          {d.cms.navigation.filter((n) => n.columns.length).map((n) => <AssetSlot key={n.id} label={`${t("admin.navigation.feature")} — ${L(n.label)}`} mediaId={n.featuredMediaId} folder="Banners" ratio="4/3" disabled={locked} onChange={(id) => assignMedia({ kind: "nav", id: n.id }, id)} />)}
        </div>
      ) : null}

      {tab === "products" ? (
        <>
          <div className="a-toolbar"><input className="input" type="search" placeholder={t("admin.search")} value={q} onChange={(e) => setQ(e.target.value)} /><span className="muted small">{t("admin.assets.productHint")}</span></div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{t("admin.f.product")}</th><th>{t("admin.f.images")}</th><th>{t("admin.f.videos")}</th></tr></thead>
              <tbody>
                {products.map((p) => (
                  <tr key={p.id}>
                    <td><span className="cell-main"><span className="thumb"><Media mediaId={p.imageIds[0]} kind="product" /></span><span><b>{L(p.name)}</b><small className="ltr">{p.sku}</small></span></span></td>
                    <td style={{ whiteSpace: "normal" }}><fieldset disabled={locked} style={{ border: 0 }}><MediaField multiple folder="Products" value={p.imageIds} onChange={(ids) => assignMedia({ kind: "product", id: p.id, field: "imageIds", ids }, undefined)} /></fieldset></td>
                    <td style={{ whiteSpace: "normal" }}><fieldset disabled={locked} style={{ border: 0 }}><MediaField multiple type="video" folder="Videos" value={p.videoIds} onChange={(ids) => assignMedia({ kind: "product", id: p.id, field: "videoIds", ids }, undefined)} /></fieldset></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </>
  );
}
