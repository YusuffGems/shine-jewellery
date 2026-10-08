"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDb, useHydrated } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { resolveListing } from "@/shared/services/catalog";
import { storefrontTokens } from "@/lib/theme/resolve";
import { track } from "@/shared/services/core";
import { SORTS, applyFilters, computeFacets, priceMap, sortProducts, type FacetKey, type Selection, type SortKey } from "@/lib/catalog/facets";
import { Filters, useFacetLabel } from "@/user/components/product/Filters";
import { ProductCard } from "@/user/components/product/ProductCard";
import { PromoBanners } from "@/user/components/promo/PromoBanners";
import { Media } from "@/shared/components/Media";
import { Drawer } from "@/shared/components/Overlay";
import { Icon } from "@/shared/components/Icon";

const PAGE = 12;

export function ListingView({ slug }: { slug: string }) {
  const d = useDb();
  const hydrated = useHydrated();
  const { t, L } = useI18n();
  const params = useSearchParams();
  const facetLabel = useFacetLabel();
  const listing = resolveListing(d, slug);
  const [sort, setSort] = useState<SortKey>((params.get("sort") as SortKey) || "recommended");
  const [sel, setSel] = useState<Selection>(() => (params.get("occasion") ? { occasion: [params.get("occasion")!] } : {}));
  const [limit, setLimit] = useState(PAGE);
  const [showFilters, setShowFilters] = useState(true);
  const [mobileFilters, setMobileFilters] = useState(false);
    const [videoReady, setVideoReady] = useState(false);
  useEffect(() => setVideoReady(false), [slug]);

  const base = useMemo(() => listing?.products ?? [], [listing]);
  const prices = useMemo(() => priceMap(d, base), [d, base]);
  const facets = useMemo(() => computeFacets(d, base, prices), [d, base, prices]);
  const filtered = useMemo(() => sortProducts(applyFilters(d, base, sel, prices), sort, prices), [d, base, sel, sort, prices]);

  useEffect(() => setLimit(PAGE), [sel, sort]);
  const changeSel = (s: Selection) => {
    setSel(s);
    track("filter", { slug, filters: Object.values(s).flat().length });
  };

  if (!listing) {
    return hydrated ? (
      <div className="container empty"><h3>{t("listing.notFound")}</h3><Link href="/collections/all" className="btn">{t("listing.viewAll")}</Link></div>
    ) : <div className="container section" />;
  }

  const title = listing.kind === "category" ? L(listing.category.name) : listing.kind === "collection" ? L(listing.collection.name) : t("listing.allJewellery");
  const desc = listing.kind === "category" ? L(listing.category.description) : listing.kind === "collection" ? L(listing.collection.description) : t("listing.allDescription");
  const heroMedia = listing.kind === "collection" ? listing.collection.heroMediaId : listing.kind === "category" ? listing.category.mediaId : undefined;
  const heroVideo = listing.kind === "collection" ? listing.collection.heroVideoId : undefined;

  // ── Page banners: one video per category / collection page ──────────────
  // Key = the last part of the page address (/collections/<key>). Value = video file in /public.
  // Pages not listed here keep their default image.
   const bannerVideos: Record<string, string> = {
    // Top menu
    "gold-jewellery": "/media/videos/gold.mp4",
    "diamond-jewellery": "/media/videos/diamond.mp4",
    "platinum-jewellery": "/media/videos/platinum.mp4",
    "silver-jewellery": "/media/videos/silver.mp4",
    rings: "/media/videos/rings.mp4",
    earrings: "/media/videos/earrings.mp4",
    necklaces: "/media/videos/necklaces.mp4",
    bracelets: "/media/videos/bracelets.mp4",
    bangles: "/media/videos/bangles.mp4",
    pendants: "/media/videos/pendants.mp4",
    "gold-coins": "/media/videos/gold-coins.mp4",
    gifting: "/media/videos/gifting.mp4",
    // Collections
    "diamond-stories": "/media/videos/dimond-nekles.mp4",
  };
  const pageSlug = listing.kind === "category" ? listing.category.slug : listing.kind === "collection" ? listing.collection.slug : "";
  const bannerVideo = bannerVideos[pageSlug];
  const activeChips = (Object.entries(sel) as [FacetKey, string[]][]).flatMap(([k, vs]) => vs.map((v) => ({ k, v })));

  const crumbs = (
    <ol className="breadcrumb">
      <li><Link href="/">{t("nav.home")}</Link></li>
      <li><Link href="/collections/all">{t("nav.jewellery")}</Link></li>
      {listing.kind !== "all" ? <li aria-current="page">{title}</li> : null}
    </ol>
  );

  return (
    <>
      {bannerVideo || heroMedia ? (
        <section className="plp-hero">
                   {/* The page image shows instantly; the banner video fades in on top once it can play. */}
          {heroMedia ? <Media mediaId={heroMedia} kind="collection" dark priority /> : null}
          {bannerVideo ? (
            <div className="media" style={{ background: "transparent", opacity: videoReady ? 1 : 0, transition: "opacity 0.6s ease" }}>
              <video key={bannerVideo} src={bannerVideo} autoPlay muted loop playsInline preload="auto" aria-hidden="true" onCanPlay={() => setVideoReady(true)} />
            </div>
          ) : null}
          <div className="container plp-hero-inner">
            {crumbs}
            <h1>{title}</h1>
            <p>{desc}</p>
          </div>
        </section>
      ) : (
        <div className="container plp-plain">
          {crumbs}
          <h1>{title}</h1>
          <p className="muted">{desc}</p>
        </div>
      )}

      <div className="container">
        <div className="plp-toolbar">
          <div className="row">
            <button className="btn btn--secondary btn--sm filters-desktop" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters}>
              <Icon name="layers" size={15} /> {showFilters ? t("filters.hide") : t("filters.show")}
            </button>
            <button className="btn btn--secondary btn--sm filters-mobile-btn" onClick={() => setMobileFilters(true)}>
              <Icon name="layers" size={15} /> {t("filters.title")}
            </button>
            <span className="result-count" aria-live="polite">{t("listing.count", { count: filtered.length })}</span>
          </div>
          <label className="row small">
            <span className="muted">{t("sort.label")}</span>
            <select className="select" style={{ minHeight: 40, width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {SORTS.map((s) => <option key={s} value={s}>{t(`sort.${s}`)}</option>)}
            </select>
          </label>
        </div>

        <div className={`plp-layout${showFilters ? "" : " plp-layout--collapsed"}`}>
          {showFilters ? (
            <aside className="filters-desktop">
              <Filters facets={facets} selection={sel} onChange={changeSel} />
            </aside>
          ) : null}
          <div>
            <div style={{ marginBottom: "2rem" }}><PromoBanners placement="listing" compact /></div>
            {activeChips.length ? (
              <div className="active-filters">
                {activeChips.map(({ k, v }) => (
                  <button key={k + v} className="chip" aria-pressed="true" onClick={() => changeSel({ ...sel, [k]: (sel[k] ?? []).filter((x) => x !== v) })}>
                    {facetLabel(k, v)} <Icon name="close" size={12} />
                  </button>
                ))}
                <button className="btn btn--ghost btn--sm" onClick={() => changeSel({})}>{t("filters.clear")}</button>
              </div>
            ) : null}
            {filtered.length ? (
              <div className="grid-products" style={!showFilters ? undefined : { ["--grid-cols" as string]: String(Math.min(storefrontTokens(d).tokens.gridColumns, 3)) }}>
                {filtered.slice(0, limit).map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="empty"><h3>{t("listing.noResults")}</h3><button className="btn btn--secondary" onClick={() => changeSel({})}>{t("filters.clear")}</button></div>
            )}
            {limit < filtered.length ? (
              <div style={{ textAlign: "center", marginTop: "3.5rem" }}>
                <p className="muted small" style={{ marginBottom: "1rem" }}>{t("listing.showing", { shown: Math.min(limit, filtered.length), total: filtered.length })}</p>
                <button className="btn btn--secondary" onClick={() => setLimit((l) => l + PAGE)}>{t("listing.loadMore")}</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <Drawer open={mobileFilters} onClose={() => setMobileFilters(false)} label={t("filters.title")}>
        <div className="row row--between" style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--color-border)" }}>
          <strong>{t("filters.title")}</strong>
          <button className="icon-btn" onClick={() => setMobileFilters(false)} aria-label={t("common.close")}><Icon name="close" /></button>
        </div>
        <div style={{ padding: "0 1.25rem", flex: 1 }}>
          <Filters facets={facets} selection={sel} onChange={changeSel} />
        </div>
        <div style={{ padding: "1rem 1.25rem" }}>
          <button className="btn btn--block" onClick={() => setMobileFilters(false)}>{t("filters.showResults", { count: filtered.length })}</button>
        </div>
      </Drawer>
    </>
  );
}