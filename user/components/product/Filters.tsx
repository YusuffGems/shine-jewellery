"use client";
import { useEffect, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { FACET_ORDER, caratBucketLabel, parsePriceRange, priceBucketLabel, priceRangeValue, type FacetKey, type FacetOption, type Selection } from "@/lib/catalog/facets";

const qar = (n: number) => `QAR ${Math.round(n).toLocaleString("en")}`;

export function useFacetLabel() {
  const d = useDb();
  const { t, L } = useI18n();
  return (key: FacetKey, value: string): string => {
    switch (key) {
      case "price": {
        const r = parsePriceRange(value);
        return r ? `${qar(r[0])} – ${qar(r[1])}` : `QAR ${priceBucketLabel(Number(value))}`;
      }
      case "carat": return caratBucketLabel(Number(value));
      case "category": return L(d.categories.find((c) => c.id === value)?.name) || value;
      case "collection": return L(d.collections.find((c) => c.id === value)?.name) || value;
      case "metal": return t(`metal.${value}`);
      case "diamond": return t(value === "yes" ? "filters.withDiamonds" : "filters.withoutDiamonds");
      case "stone": return t(value === "gemstone" ? "filters.gemstone" : "filters.noStone");
      case "availability": return t(value === "in" ? "filters.inStock" : "filters.outOfStock");
      case "metalColour": return t(`colour.${value}`, undefined, value);
      case "gender": return t(`gender.${value}`, undefined, value);
      case "occasion": return t(`occasion.${value}`, undefined, value);
      default: return value;
    }
  };
}

/** Two-handle price slider + min/max boxes. Empty selection = all prices. */
function PriceRange({ min, max, value, onChange }: { min: number; max: number; value: [number, number] | null; onChange: (v: [number, number] | null) => void }) {
  const [lo, setLo] = useState(value?.[0] ?? min);
  const [hi, setHi] = useState(value?.[1] ?? max);
  useEffect(() => {
    setLo(value?.[0] ?? min);
    setHi(value?.[1] ?? max);
  }, [value?.[0], value?.[1], min, max]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = Math.max(1, Math.round((max - min) / 200));
  const commit = (a: number, b: number) => {
    const l = Math.max(min, Math.min(a, b));
    const h = Math.min(max, Math.max(a, b));
    onChange(l <= min && h >= max ? null : [l, h]);
  };
  const pct = (n: number) => (max > min ? ((n - min) / (max - min)) * 100 : 0);
  return (
    <div className="price-range">
      <div className="price-range-track">
        <span className="price-range-fill" style={{ insetInlineStart: `${pct(Math.min(lo, hi))}%`, insetInlineEnd: `${100 - pct(Math.max(lo, hi))}%` }} />
        <input type="range" min={min} max={max} step={step} value={lo} aria-label="Minimum price" onChange={(e) => setLo(Math.min(Number(e.target.value), hi))} onMouseUp={() => commit(lo, hi)} onTouchEnd={() => commit(lo, hi)} onKeyUp={() => commit(lo, hi)} />
        <input type="range" min={min} max={max} step={step} value={hi} aria-label="Maximum price" onChange={(e) => setHi(Math.max(Number(e.target.value), lo))} onMouseUp={() => commit(lo, hi)} onTouchEnd={() => commit(lo, hi)} onKeyUp={() => commit(lo, hi)} />
      </div>
      <div className="price-range-inputs">
        <label><span>Min</span><input className="input ltr" type="number" inputMode="numeric" min={min} max={max} value={Math.round(lo)} onChange={(e) => setLo(Number(e.target.value))} onBlur={() => commit(lo, hi)} onKeyDown={(e) => e.key === "Enter" && commit(lo, hi)} /></label>
        <span aria-hidden="true">–</span>
        <label><span>Max</span><input className="input ltr" type="number" inputMode="numeric" min={min} max={max} value={Math.round(hi)} onChange={(e) => setHi(Number(e.target.value))} onBlur={() => commit(lo, hi)} onKeyDown={(e) => e.key === "Enter" && commit(lo, hi)} /></label>
      </div>
      <p className="muted small ltr">{qar(min)} – {qar(max)}</p>
    </div>
  );
}

export function Filters({ facets, selection, onChange }: { facets: Record<FacetKey, FacetOption[]>; selection: Selection; onChange: (s: Selection) => void }) {
  const { t } = useI18n();
  const label = useFacetLabel();
  const toggle = (key: FacetKey, value: string) => {
    const cur = selection[key] ?? [];
    const next = cur.includes(value) ? cur.filter((v) => v !== value) : [...cur, value];
    onChange({ ...selection, [key]: next });
  };
  return (
    <div className="filters" role="group" aria-label={t("filters.title")}>
      {FACET_ORDER.filter((k) => (k === "price" ? facets.price.length === 2 && facets.price[1].count > facets.price[0].count : facets[k].length > 1) || (selection[k]?.length ?? 0) > 0).map((key, i) => (
        <details key={key} className="filter-group" open={i < 4 || (selection[key]?.length ?? 0) > 0}>
          <summary>
            {t(`filters.${key}`)}
            {selection[key]?.length ? <span>{selection[key]!.length}</span> : null}
          </summary>
          {key === "price" ? (
            <PriceRange
              min={facets.price[0]?.count ?? 0}
              max={facets.price[1]?.count ?? 0}
              value={parsePriceRange(selection.price?.[0])}
              onChange={(r) => onChange({ ...selection, price: r ? [priceRangeValue(r[0], r[1])] : [] })}
            />
          ) : (
          <div className="filter-options">
            {facets[key].map((o) => (
              <label key={o.value} className="check">
                <span className="row" style={{ gap: "0.6rem" }}>
                  <input type="checkbox" checked={selection[key]?.includes(o.value) ?? false} onChange={() => toggle(key, o.value)} />
                  {label(key, o.value)}
                </span>
                <em>{o.count}</em>
              </label>
            ))}
          </div>
          )}
        </details>
      ))}
    </div>
  );
}