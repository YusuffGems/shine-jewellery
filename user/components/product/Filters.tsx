"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { FACET_ORDER, caratBucketLabel, priceBucketLabel, type FacetKey, type FacetOption, type Selection } from "@/lib/catalog/facets";

export function useFacetLabel() {
  const d = useDb();
  const { t, L } = useI18n();
  return (key: FacetKey, value: string): string => {
    switch (key) {
      case "price": return `QAR ${priceBucketLabel(Number(value))}`;
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
      {FACET_ORDER.filter((k) => facets[k].length > 1 || (selection[k]?.length ?? 0) > 0).map((key, i) => (
        <details key={key} className="filter-group" open={i < 4 || (selection[key]?.length ?? 0) > 0}>
          <summary>
            {t(`filters.${key}`)}
            {selection[key]?.length ? <span>{selection[key]!.length}</span> : null}
          </summary>
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
        </details>
      ))}
    </div>
  );
}
