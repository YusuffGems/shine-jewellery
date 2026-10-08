"use client";
import Link from "next/link";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { priceOf, stockOf } from "@/shared/services/catalog";
import { toggleCompare } from "@/user/services/shopping";
import { Media } from "@/shared/components/Media";

export default function ComparePage() {
  const d = useDb();
  const { t, L, money, num } = useI18n();
  const items = d.products.filter((p) => d.session.compare.includes(p.id));
  if (!items.length) return <div className="container empty"><h3>{t("compare.empty")}</h3><Link className="btn" href="/collections/all">{t("cart.continue")}</Link></div>;
  const rows: [string, (p: (typeof items)[number]) => string][] = [
    [t("price.total"), (p) => money(priceOf(d, p).total)],
    [t("product.metal"), (p) => `${t(`metal.${p.metal}`)} ${d.rates.find((r) => r.id === p.rateId)?.purity ?? ""}`],
    [t("product.colour"), (p) => p.metalColour],
    [t("product.netWeight"), (p) => `${num(p.netWeight, 3)} g`],
    [t("filters.carat"), (p) => (p.diamond ? `${p.diamond.carat} ct ${p.diamond.shape}` : "—")],
    [t("filters.clarity"), (p) => p.diamond?.clarity ?? "—"],
    [t("filters.availability"), (p) => (stockOf(d, p.id) > 0 ? t("filters.inStock") : t("filters.outOfStock"))],
  ];
  return (
    <div className="container" style={{ paddingBottom: "var(--section-space)" }}>
      <h1 className="page-title">{t("compare.title")}</h1>
      <div className="table-wrap">
        <table className="table compare-table">
          <thead>
            <tr>
              <th />
              {items.map((p) => (
                <th key={p.id}>
                  <Link href={`/product/${p.slug}`}><Media mediaId={p.imageIds[0]} ratio="1" kind="product" /></Link>
                  <p style={{ textTransform: "none", letterSpacing: 0, color: "var(--color-text)", marginTop: 8 }}>{L(p.name)}</p>
                  <button className="btn btn--ghost btn--sm" onClick={() => toggleCompare(p.id)}>{t("cart.remove")}</button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{rows.map(([label, fn]) => <tr key={label}><td className="muted">{label}</td>{items.map((p) => <td key={p.id}>{fn(p)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
