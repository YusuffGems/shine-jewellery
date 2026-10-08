"use client";
import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { searchProducts } from "@/shared/services/catalog";
import { ProductCard } from "@/user/components/product/ProductCard";

function SearchInner() {
  const d = useDb();
  const { t } = useI18n();
  const q = useSearchParams().get("q") ?? "";
  const results = useMemo(() => searchProducts(d, q), [d, q]);
  return (
    <div className="container" style={{ paddingBottom: "var(--section-space)" }}>
      <h1 className="page-title">{t("search.title")}</h1>
      <p className="result-count" style={{ marginBottom: "2rem" }}>{t("search.results", { count: results.length, q })}</p>
      {results.length ? <div className="grid-products">{results.map((p) => <ProductCard key={p.id} product={p} />)}</div> : <p className="empty">{t("search.none")}</p>}
    </div>
  );
}

export default function SearchPage() {
  return <Suspense><SearchInner /></Suspense>;
}
