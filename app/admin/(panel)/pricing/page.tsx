"use client";
import { useMemo, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { calculatePrice } from "@/lib/pricing/engine";
import { saveSettings } from "@/admin/services/content";
import { PageHead } from "@/admin/components/ui";
import { PriceBreakdown } from "@/shared/components/PriceBreakdown";
import { useToast } from "@/shared/components/Toast";

/** Pricing rules (global) + full price list with breakdown + order price snapshots. */
export default function PricingPage() {
  const d = useDb();
  const { t, L, money, date } = useI18n();
  const { can } = useAdmin();
  const toast = useToast();
  const [rules, setRules] = useState({ taxRate: d.settings.taxRate, priceLockMinutes: d.settings.priceLockMinutes, deliveryFee: d.settings.deliveryFee, freeDeliveryThreshold: d.settings.freeDeliveryThreshold });
  const [selected, setSelected] = useState(d.products[0]?.id ?? "");
  const rows = useMemo(() => d.products.map((p) => ({ p, b: calculatePrice(p, d.rates.find((r) => r.id === p.rateId), d.settings.taxRate) })), [d]);
  const sel = rows.find((r) => r.p.id === selected);
  const snapshots = d.orders.flatMap((o) => o.items.map((it) => ({ o, it }))).slice(0, 15);

  return (
    <>
      <PageHead title={t("admin.nav.pricing")} sub={t("admin.pricing.sub")} />
      <div className="a-grid-2">
        <div className="a-card">
          <h2>{t("admin.pricing.rules")}</h2>
          <div className="a-form">
            {(Object.keys(rules) as (keyof typeof rules)[]).map((k) => (
              <label key={k} className="field"><span className="label">{t(`admin.pricing.${k}`)}</span><input className="input" type="number" step="0.01" value={rules[k]} onChange={(e) => setRules({ ...rules, [k]: Number(e.target.value) })} disabled={!can("settings.update")} /></label>
            ))}
          </div>
          <p className="field-hint" style={{ margin: "0.75rem 0" }}>{t("admin.pricing.formula")}</p>
          {can("settings.update") ? <button className="btn" onClick={() => (saveSettings({ ...d.settings, ...rules }), toast(t("common.saved")))}>{t("common.save")}</button> : null}
        </div>
        <div className="a-card">
          <h2>{t("admin.pricing.calculator")}<select className="select" style={{ maxWidth: 260 }} value={selected} onChange={(e) => setSelected(e.target.value)}>{d.products.map((p) => <option key={p.id} value={p.id}>{p.name.en}</option>)}</select></h2>
          {sel ? <PriceBreakdown b={sel.b} weight={sel.p.netWeight} /> : null}
        </div>
      </div>
      <div className="a-card">
        <h2>{t("admin.pricing.priceList")}</h2>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t("admin.f.product")}</th><th className="num">{t("price.metal")}</th><th className="num">{t("price.making")}</th><th className="num">{t("price.wastage")}</th><th className="num">{t("price.stone")}+{t("price.diamond")}</th><th className="num">{t("price.premium")}</th><th className="num">{t("price.tax", { rate: d.settings.taxRate })}</th><th className="num">{t("price.total")}</th></tr></thead>
            <tbody>
              {rows.map(({ p, b }) => (
                <tr key={p.id}><td>{L(p.name)}</td><td className="num">{money(b.metalValue)}</td><td className="num">{money(b.makingCharge)}</td><td className="num">{money(b.wastage)}</td><td className="num">{money(b.stoneValue + b.diamondValue)}</td><td className="num">{money(b.premium + b.otherCharges)}</td><td className="num">{money(b.tax)}</td><td className="num"><b>{money(b.total)}</b></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="a-card">
        <h2>{t("admin.pricing.snapshots")}</h2>
        <p className="field-hint" style={{ marginBottom: "0.75rem" }}>{t("admin.pricing.snapshotsHint")}</p>
        <table className="table">
          <thead><tr><th>{t("order.col.number")}</th><th>{t("admin.f.product")}</th><th className="num">{t("admin.pricing.rateAtOrder")}</th><th className="num">{t("admin.pricing.rateNow")}</th><th className="num">{t("admin.pricing.priceAtOrder")}</th><th>{t("order.col.date")}</th></tr></thead>
          <tbody>
            {snapshots.map(({ o, it }, i) => (
              <tr key={o.id + i}><td className="ltr">{o.number}</td><td>{L(it.name)}</td><td className="num">{money(it.rateSnapshot.ratePerGram)}</td><td className="num">{money(d.rates.find((r) => r.id === it.rateSnapshot.rateId)?.ratePerGram ?? 0)}</td><td className="num">{money(it.unitPrice)}</td><td>{date(o.createdAt)}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
