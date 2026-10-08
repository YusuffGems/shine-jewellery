"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDb, useHydrated } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { addReview } from "@/user/services/engagement";
import { priceOf, productBySlug, relatedProducts, stockOf } from "@/shared/services/catalog";
import { addToCart, markViewed, toggleWishlist } from "@/user/services/shopping";
import { track } from "@/shared/services/core";
import { productJsonLd } from "@/lib/seo/schema";
import { sanitizeText } from "@/lib/utils";
import { Gallery } from "./Gallery";
import { SizePicker } from "./SizePicker";
import { PriceBreakdown } from "@/shared/components/PriceBreakdown";
import { FindInShowroom } from "./FindInShowroom";
import { ProductCard } from "./ProductCard";
import { PromoBanners } from "@/user/components/promo/PromoBanners";
import { Icon } from "@/shared/components/Icon";
import { useToast } from "@/shared/components/Toast";

export function ProductView({ slug }: { slug: string }) {
  const d = useDb();
  const hydrated = useHydrated();
  const router = useRouter();
  const toast = useToast();
  const { t, L, money, num } = useI18n();
  const product = productBySlug(d, slug);
  const [size, setSize] = useState<string | undefined>(product?.sizes[0]);
  const [engraving, setEngraving] = useState("");
  const [showroomOpen, setShowroomOpen] = useState(false);
  const [review, setReview] = useState({ name: "", rating: 5, text: "" });

  useEffect(() => {
    if (product && hydrated) markViewed(product.id);
  }, [product?.id, hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!product || product.status !== "active") {
    return hydrated ? (
      <div className="container empty"><h3>{t("product.notFound")}</h3><Link className="btn" href="/collections/all">{t("listing.viewAll")}</Link></div>
    ) : <div className="container section" />;
  }

  const price = priceOf(d, product);
  const stock = stockOf(d, product.id);
  const rate = d.rates.find((r) => r.id === product.rateId);
  const wished = d.session.wishlist.includes(product.id);
  const category = d.categories.find((c) => c.id === product.categoryIds[0]);
  const reviews = d.reviews.filter((r) => r.productId === product.id && r.approved);
  const whatsapp = d.settings.whatsapp.replace(/\D/g, "");
  const canEngrave = product.categoryIds.includes("cat-personalised") || product.categoryIds.includes("cat-rings");

  const add = (buyNow: boolean) => {
    if (product.sizes.length && !size) return toast(t("product.chooseSize"), "error");
    addToCart(product.id, 1, size, engraving.trim() || undefined);
    if (buyNow) router.push("/checkout");
    else toast(t("cart.added"));
  };

  return (
    <div className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, price.total, stock > 0)) }} />
      <ol className="breadcrumb" style={{ paddingTop: "2rem" }}>
        <li><Link href="/">{t("nav.home")}</Link></li>
        {category ? <li><Link href={`/collections/${category.slug}`}>{L(category.name)}</Link></li> : null}
        <li aria-current="page">{L(product.name)}</li>
      </ol>

      <div className="pdp">
        <Gallery product={product} />
        <div className="pdp-info">
          <div className="stack" style={{ gap: "0.6rem" }}>
            {product.badges.length ? <div className="row">{product.badges.map((b) => <span key={b} className="badge badge--gold">{t(`badge.${b}`)}</span>)}</div> : null}
            <h1 className="pdp-title">{L(product.name)}</h1>
            <span className="pdp-sku">{t("product.sku")} {product.sku}</span>
          </div>
          <div>
            <div className="pdp-price-row">
              <span className="price price--lg ltr">{money(price.total)}</span>
              <span className={`badge ${stock > 0 ? "badge--success" : "badge--error"}`}>{stock > 0 ? (stock <= d.settings.lowStockThreshold ? t("product.fewLeft") : t("product.inStock")) : t("product.outOfStock")}</span>
            </div>
            <p className="pdp-rate-note">
              {t("product.rateNote", { metal: L(rate?.label), rate: money(rate?.ratePerGram ?? 0) })}
              {rate?.status === "demo" ? ` · ${t("rates.demo")}` : ""}
            </p>
          </div>
          <p className="muted">{L(product.description)}</p>

          <SizePicker sizes={product.sizes} value={size} onChange={setSize} />
          {canEngrave ? (
            <label className="field">
              <span className="label">{t("product.engraving")}</span>
              <input className="input" maxLength={20} value={engraving} onChange={(e) => setEngraving(sanitizeText(e.target.value, 20))} placeholder={t("product.engravingHint")} />
            </label>
          ) : null}

          <div className="pdp-actions">
            <button className="btn" disabled={stock <= 0} onClick={() => add(false)}>{t("product.addToCart")}</button>
            <button className="btn btn--secondary btn--buy" disabled={stock <= 0} onClick={() => add(true)}>{t("product.buyNow")}</button>
            <button className="btn btn--secondary btn--icon" aria-pressed={wished} aria-label={t(wished ? "product.removeWishlist" : "product.addWishlist")} onClick={() => toggleWishlist(product.id)}>
              <Icon name="heart" fill={wished ? "currentColor" : "none"} />
            </button>
          </div>

          <div className="pdp-links">
            <button onClick={() => setShowroomOpen(true)}><Icon name="store" /> {t("product.findInShowroom")}</button>
            <Link href={`/appointment?product=${product.id}`}><Icon name="calendar" /> {t("nav.bookAppointment")}</Link>
            {whatsapp ? (
              <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`${t("product.whatsappMsg")} ${product.sku}`)}`} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp_click", { productId: product.id })}>
                <Icon name="chat" /> WhatsApp
              </a>
            ) : (
              <Link href="/showrooms"><Icon name="chat" /> {t("product.contact")}</Link>
            )}
          </div>

          <div className="trust-row">
            <div><Icon name="shield" />{t("trust.certified")}</div>
            <div><Icon name="truck" />{t("trust.delivery")}</div>
            <div><Icon name="gem" />{t("trust.transparent")}</div>
          </div>

          <div className="accordion">
            <details open>
              <summary>{t("product.details")}</summary>
              <div className="acc-body">
                <dl className="kv">
                  <dt>{t("product.metal")}</dt><dd>{t(`metal.${product.metal}`)} · {rate?.purity}</dd>
                  <dt>{t("product.colour")}</dt><dd>{t(`colour.${product.metalColour}`, undefined, product.metalColour)}</dd>
                  <dt>{t("product.netWeight")}</dt><dd className="ltr">{num(product.netWeight, 3)} g</dd>
                  <dt>{t("product.grossWeight")}</dt><dd className="ltr">{num(product.grossWeight, 3)} g</dd>
                  {product.stoneDetails ? (<><dt>{t("product.stones")}</dt><dd>{product.stoneDetails}</dd></>) : null}
                </dl>
              </div>
            </details>
            {product.diamond ? (
              <details>
                <summary>{t("product.diamondDetails")}</summary>
                <div className="acc-body">
                  <dl className="kv">
                    <dt>{t("filters.carat")}</dt><dd className="ltr">{product.diamond.carat} ct</dd>
                    <dt>{t("filters.shape")}</dt><dd>{product.diamond.shape}</dd>
                    <dt>{t("filters.diamondColour")}</dt><dd>{product.diamond.colour}</dd>
                    <dt>{t("filters.clarity")}</dt><dd>{product.diamond.clarity}</dd>
                    <dt>{t("product.pieces")}</dt><dd>{product.diamond.pieces}</dd>
                    {product.certificateNo ? (<><dt>{t("product.certificate")}</dt><dd className="ltr">{product.certificateNo}</dd></>) : null}
                  </dl>
                </div>
              </details>
            ) : null}
            <details>
              <summary>{t("product.priceBreakdown")}</summary>
              <div className="acc-body"><PriceBreakdown b={price} weight={product.netWeight} /></div>
            </details>
            <details>
              <summary>{t("product.reviews")} ({reviews.length})</summary>
              <div className="acc-body">
                {reviews.map((r) => (
                  <div key={r.id} className="review">
                    <span className="stars">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <p style={{ color: "var(--color-text)" }}>{r.text}</p>
                    <small>{r.name}</small>
                  </div>
                ))}
                <form
                  className="stack"
                  style={{ marginTop: "1rem" }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!review.name.trim() || !review.text.trim()) return;
                    addReview(product.id, sanitizeText(review.name, 60), review.rating, sanitizeText(review.text, 800));
                    setReview({ name: "", rating: 5, text: "" });
                    toast(t("product.reviewThanks"));
                  }}
                >
                  <div className="form-grid">
                    <input className="input" placeholder={t("forms.name")} value={review.name} onChange={(e) => setReview({ ...review, name: e.target.value })} aria-label={t("forms.name")} />
                    <select className="select" value={review.rating} onChange={(e) => setReview({ ...review, rating: Number(e.target.value) })} aria-label={t("product.rating")}>
                      {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}
                    </select>
                    <textarea className="textarea span-2" placeholder={t("product.writeReview")} value={review.text} onChange={(e) => setReview({ ...review, text: e.target.value })} aria-label={t("product.writeReview")} />
                  </div>
                  <button className="btn btn--secondary btn--sm" style={{ justifySelf: "start" }}>{t("product.submitReview")}</button>
                </form>
              </div>
            </details>
          </div>
        </div>
      </div>

      <section className="section--tight" style={{ paddingTop: 0 }}>
        <div style={{ marginBottom: "var(--section-space)" }}><PromoBanners placement="product" compact /></div>
        <div className="section-head"><span className="eyebrow">{t("product.youMayLike")}</span><h2 className="section-title">{t("product.related")}</h2></div>
        <div className="grid-products">{relatedProducts(d, product).map((p) => <ProductCard key={p.id} product={p} />)}</div>
      </section>
      <FindInShowroom product={product} open={showroomOpen} onClose={() => setShowroomOpen(false)} />
    </div>
  );
}
