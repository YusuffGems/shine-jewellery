"use client";
import Link from "next/link";
import { useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { storefrontTokens } from "@/lib/theme/resolve";
import { priceOf, stockOf } from "@/shared/services/catalog";
import { toggleCompare, toggleWishlist } from "@/user/services/shopping";
import { Media } from "@/shared/components/Media";
import { Icon } from "@/shared/components/Icon";
import { QuickView } from "./QuickView";
import type { Product } from "@/types";

export function ProductCard({ product }: { product: Product }) {
  const d = useDb();
  const { t, L, money } = useI18n();
  const { tokens } = storefrontTokens(d);
  const [quick, setQuick] = useState(false);
  const price = priceOf(d, product);
  const stock = stockOf(d, product.id);
  const wished = d.session.wishlist.includes(product.id);
  const compared = d.session.compare.includes(product.id);
  const metalLabel = d.rates.find((r) => r.id === product.rateId);
  const name = L(product.name);

  return (
    <article className="pcard" data-bordered={tokens.cardBorder}>
      <div className="pcard-media">
        <Media className="pcard-main" mediaId={product.imageIds[0]} alt={name} kind="product" showVideoBadge={false} />
        {product.imageIds[1] ? <Media className="pcard-alt" mediaId={product.imageIds[1]} alt="" kind="product" /> : null}
        {product.badges.length ? (
          <div className="pcard-badges">
            {product.badges.slice(0, 2).map((b) => (
              <span key={b} className={`badge${b === "EXCLUSIVE" || b === "LIMITED" ? " badge--dark" : ""}`}>{t(`badge.${b}`)}</span>
            ))}
          </div>
        ) : null}
        {tokens.wishlistOnCard ? (
          <button className="icon-btn pcard-wish" aria-pressed={wished} aria-label={t(wished ? "product.removeWishlist" : "product.addWishlist")} onClick={() => toggleWishlist(product.id)}>
            <Icon name="heart" fill={wished ? "currentColor" : "none"} />
          </button>
        ) : null}
        <button className="icon-btn pcard-compare" aria-pressed={compared} aria-label={t("product.compare")} title={t("product.compare")} onClick={() => toggleCompare(product.id)}>
          <Icon name="compare" size={17} />
        </button>
        {tokens.quickView ? (
          <div className="pcard-quick">
            <button className="btn btn--sm" onClick={() => setQuick(true)}>{t("product.quickView")}</button>
          </div>
        ) : null}
      </div>
      <div className="pcard-body">
        <span className="pcard-meta">{L(metalLabel?.label)}{product.diamond ? ` · ${product.diamond.carat} ct` : ""}</span>
        <h3 className="pcard-name">
          <Link href={`/product/${product.slug}`}>{name}</Link>
        </h3>
        <span className="price ltr">
          {money(price.total)}
          {price.discount > 0 ? <del>{money(price.subtotal + price.tax)}</del> : null}
        </span>
        {stock <= 0 ? <span className="pcard-stock pcard-stock--out">{t("product.outOfStock")}</span> : stock <= d.settings.lowStockThreshold ? <span className="pcard-stock">{t("product.fewLeft")}</span> : null}
      </div>
      {quick ? <QuickView product={product} onClose={() => setQuick(false)} /> : null}
    </article>
  );
}
