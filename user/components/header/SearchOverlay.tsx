"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { searchProducts } from "@/shared/services/catalog";
import { track } from "@/shared/services/core";
import { ProductCard } from "@/user/components/product/ProductCard";
import { Icon } from "@/shared/components/Icon";

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const d = useDb();
  const { t, L } = useI18n();
  const router = useRouter();
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const results = useMemo(() => searchProducts(d, q).slice(0, 8), [d, q]);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;
  const submit = () => {
    if (!q.trim()) return;
    track("search", { q: q.trim() });
    onClose();
    router.push(`/search?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <div className="search-panel" role="dialog" aria-modal="true" aria-label={t("header.search")}>
      <div className="container">
        <form className="search-head" onSubmit={(e) => (e.preventDefault(), submit())}>
          <Icon name="search" size={26} />
          <input ref={inputRef} className="search-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search.placeholder")} aria-label={t("header.search")} />
          <button type="button" className="icon-btn" onClick={onClose} aria-label={t("common.close")}>
            <Icon name="close" size={24} />
          </button>
        </form>
        {!q ? (
          <div className="search-suggest">
            <span className="caps muted">{t("search.popular")}</span>
            {d.categories.filter((c) => c.active).slice(8, 15).map((c) => (
              <button key={c.id} className="chip" onClick={() => (onClose(), router.push(`/collections/${c.slug}`))}>
                {L(c.name)}
              </button>
            ))}
          </div>
        ) : (
          <div className="section--tight">
            <p className="result-count" style={{ marginBottom: "1.5rem" }}>{t("search.results", { count: results.length, q })}</p>
            <div className="grid-products" onClick={(e) => (e.target as HTMLElement).closest("a") && onClose()}>
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {results.length === 0 ? <p className="empty">{t("search.none")}</p> : null}
          </div>
        )}
      </div>
    </div>
  );
}
