"use client";
import Link from "next/link";
import { useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useCart } from "@/user/hooks/useShopper";
import { removeFromCart, setCartQty, setCoupon, toggleWishlist } from "@/user/services/shopping";
import { Media } from "@/shared/components/Media";
import { Icon } from "@/shared/components/Icon";

export default function CartPage() {
  const d = useDb();
  const { t, L, money } = useI18n();
  const { items, summary } = useCart();
  const [code, setCode] = useState(d.session.couponCode ?? "");

  if (!items.length) {
    return (
      <div className="container empty" style={{ paddingBlock: "6rem" }}>
        <h3>{t("cart.empty")}</h3>
        <p style={{ marginBottom: "2rem" }}>{t("cart.emptyHint")}</p>
        <Link href="/collections/all" className="btn">{t("cart.continue")}</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="page-title">{t("cart.title")}</h1>
      <div className="cart-layout">
        <div>
          {summary.lines.map((line) => {
            const p = d.products.find((x) => x.id === line.productId)!;
            return (
              <div key={line.item.key} className="cart-line">
                <Link href={`/product/${p.slug}`}><Media mediaId={p.imageIds[0]} kind="product" /></Link>
                <div className="stack" style={{ gap: "0.5rem" }}>
                  <h3><Link href={`/product/${p.slug}`}>{L(p.name)}</Link></h3>
                  <span className="muted small">{p.sku}{line.item.size ? ` · ${t("product.size")} ${line.item.size}` : ""}{line.item.engraving ? ` · “${line.item.engraving}”` : ""}</span>
                  {!line.ok ? <span className="field-error">{line.available ? t("cart.onlyLeft", { count: line.available }) : t("product.outOfStock")}</span> : null}
                  <div className="row" style={{ marginTop: "0.5rem" }}>
                    <div className="qty">
                      <button onClick={() => setCartQty(line.item.key, line.item.qty - 1)} aria-label={t("cart.decrease")}>−</button>
                      <span aria-live="polite">{line.item.qty}</span>
                      <button onClick={() => setCartQty(line.item.key, line.item.qty + 1)} disabled={line.item.qty >= line.available} aria-label={t("cart.increase")}>+</button>
                    </div>
                    <button className="btn btn--ghost btn--sm" onClick={() => (toggleWishlist(p.id), removeFromCart(line.item.key))}>{t("cart.moveToWishlist")}</button>
                    <button className="btn btn--ghost btn--sm" onClick={() => removeFromCart(line.item.key)}>{t("cart.remove")}</button>
                  </div>
                </div>
                <div className="cart-line-total price ltr">{money(line.lineTotal)}</div>
              </div>
            );
          })}
          <p className="muted small" style={{ marginTop: "1.5rem" }}><Icon name="refresh" size={14} style={{ display: "inline", marginInlineEnd: 6 }} />{t("cart.priceRefreshNote")}</p>
        </div>

        <aside className="summary">
          <h2>{t("cart.summary")}</h2>
          <div className="coupon-row">
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder={t("cart.couponPlaceholder")} aria-label={t("cart.coupon")} />
            <button className="btn btn--secondary" onClick={() => setCoupon(code)}>{t("cart.apply")}</button>
          </div>
          {d.session.couponCode ? (
            summary.couponValid ? <span className="badge badge--success">{t("cart.couponApplied", { code: d.session.couponCode })}</span> : <span className="field-error">{t(`cart.coupon_${summary.couponReason ?? "not_found"}`)}</span>
          ) : null}
          <dl className="kv">
            <dt>{t("cart.subtotal")}</dt><dd className="ltr">{money(summary.subtotal)}</dd>
            {summary.couponDiscount ? (<><dt>{t("cart.discount")}</dt><dd className="ltr">− {money(summary.couponDiscount)}</dd></>) : null}
            <dt>{t("cart.delivery")}</dt><dd>{summary.deliveryFee ? <span className="ltr">{money(summary.deliveryFee)}</span> : t("cart.free")}</dd>
            <dt className="kv-total">{t("cart.total")}</dt><dd className="kv-total ltr">{money(summary.total)}</dd>
          </dl>
          {d.settings.freeDeliveryThreshold > 0 && summary.deliveryFee > 0 ? <p className="small muted">{t("cart.freeDeliveryHint", { amount: money(d.settings.freeDeliveryThreshold) })}</p> : null}
          <Link href="/checkout" className="btn btn--block" aria-disabled={summary.hasIssues} onClick={(e) => summary.hasIssues && e.preventDefault()}>{t("cart.checkout")}</Link>
          <Link href="/collections/all" className="btn btn--ghost" style={{ justifySelf: "center" }}>{t("cart.continue")}</Link>
        </aside>
      </div>
    </div>
  );
}
