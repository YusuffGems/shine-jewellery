"use client";
import Link from "next/link";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { ProductCard } from "@/user/components/product/ProductCard";

export default function WishlistPage() {
  const d = useDb();
  const { t } = useI18n();
  const items = d.products.filter((p) => d.session.wishlist.includes(p.id) && p.status === "active");
  return (
    <div className="container" style={{ paddingBottom: "var(--section-space)" }}>
      <h1 className="page-title">{t("wishlist.title")}</h1>
      {items.length ? (
        <div className="grid-products">{items.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      ) : (
        <div className="empty"><h3>{t("wishlist.empty")}</h3><Link className="btn" href="/collections/all">{t("cart.continue")}</Link></div>
      )}
    </div>
  );
}
