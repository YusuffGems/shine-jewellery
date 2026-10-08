"use client";
import Link from "next/link";
import { useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { priceOf, stockOf } from "@/shared/services/catalog";
import { addToCart } from "@/user/services/shopping";
import { Modal } from "@/shared/components/Overlay";
import { Media } from "@/shared/components/Media";
import { useToast } from "@/shared/components/Toast";
import { SizePicker } from "./SizePicker";
import type { Product } from "@/types";

export function QuickView({ product, onClose }: { product: Product; onClose: () => void }) {
  const d = useDb();
  const { t, L, money } = useI18n();
  const toast = useToast();
  const [size, setSize] = useState(product.sizes[0]);
  const price = priceOf(d, product);
  const stock = stockOf(d, product.id);

  return (
    <Modal open onClose={onClose} title={L(product.name)} wide closeLabel={t("common.close")}>
      <div className="feature" style={{ gridTemplateColumns: "1fr 1fr", gap: "2rem", alignItems: "start" }}>
        <Media mediaId={product.imageIds[0]} videoId={product.videoIds[0]} ratio="4/5" kind="product" />
        <div className="stack">
          <span className="pdp-sku">{t("product.sku")} {product.sku}</span>
          <p className="price price--lg ltr">{money(price.total)}</p>
          <p className="muted">{L(product.description)}</p>
          <SizePicker sizes={product.sizes} value={size} onChange={setSize} />
          <div className="row">
            <button
              className="btn"
              disabled={stock <= 0}
              onClick={() => {
                addToCart(product.id, 1, size);
                toast(t("cart.added"));
                onClose();
              }}
            >
              {stock <= 0 ? t("product.outOfStock") : t("product.addToCart")}
            </button>
            <Link href={`/product/${product.slug}`} className="btn btn--ghost" onClick={onClose}>{t("product.viewDetails")}</Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}
