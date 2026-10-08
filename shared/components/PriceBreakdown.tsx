"use client";
import { useI18n } from "@/shared/hooks/useI18n";
import type { PriceBreakdown as PB } from "@/types";

/** Transparent price breakdown (rendered from the engine's output — no maths in JSX). */
export function PriceBreakdown({ b, weight }: { b: PB; weight: number }) {
  const { t, money, num } = useI18n();
  const rows: [string, number][] = [
    [`${t("price.metal")} (${num(weight, 3)} g × ${money(b.metalRate)})`, b.metalValue],
    [t("price.making"), b.makingCharge],
    [t("price.wastage"), b.wastage],
    [t("price.stone"), b.stoneValue],
    [t("price.diamond"), b.diamondValue],
    [t("price.premium"), b.premium],
    [t("price.other"), b.otherCharges],
  ];
  return (
    <dl className="kv">
      {rows.filter(([, v]) => v > 0).map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}>
          <dt>{k}</dt>
          <dd className="ltr">{money(v)}</dd>
        </div>
      ))}
      {b.discount > 0 ? (<><dt>{t("price.discount")}</dt><dd className="ltr">− {money(b.discount)}</dd></>) : null}
      <dt>{t("price.tax", { rate: b.taxRate })}</dt>
      <dd className="ltr">{money(b.tax)}</dd>
      <dt className="kv-total">{t("price.total")}</dt>
      <dd className="kv-total ltr">{money(b.total)}</dd>
    </dl>
  );
}
