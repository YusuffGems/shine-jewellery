"use client";
import Link from "next/link";
import { useMemo } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { buildDashboard } from "@/lib/reports/analytics";
import { BarChart, HBars, PageHead, Stat, StatusBadge } from "@/admin/components/ui";

export default function DashboardPage() {
  const d = useDb();
  const { t, L, money, date } = useI18n();
  const { user } = useAdmin();
  const r = useMemo(() => buildDashboard(d, 14), [d]);
  const compact = (n: number) => new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);

  return (
    <>
      <PageHead title={t("admin.dashboard.hello", { name: user?.name.split(" ")[0] ?? "" })} sub={t("admin.dashboard.sub")} />
      {r.hasDemoData ? <p className="notice" style={{ marginBottom: "1rem" }}>{t("admin.dashboard.demoNote")}</p> : null}
      <div className="stat-grid">
        <Stat label={t("admin.kpi.revenue")} value={money(r.revenue)} note={t("admin.kpi.paidOrders")} />
        <Stat label={t("admin.kpi.orders")} value={r.orders} note={t("admin.kpi.allTime")} />
        <Stat label={t("admin.kpi.customers")} value={r.customers} />
        <Stat label={t("admin.kpi.products")} value={r.products} note={t("admin.kpi.activeOf", { total: d.products.length })} />
        <Stat label={t("admin.kpi.inventory")} value={r.unitsAvailable} note={t("admin.kpi.unitsAvailable")} />
        <Stat label={t("admin.kpi.lowStock")} value={r.lowStock} alert={r.lowStock > 0} note={t("admin.kpi.lowStockNote")} />
        <Stat label={t("admin.kpi.pendingPayments")} value={r.pendingPayments} />
        <Stat label={t("admin.kpi.refunds")} value={money(r.refunds)} />
        <Stat label={t("admin.kpi.appointments")} value={r.openAppointments} note={t("admin.kpi.awaiting")} />
        <Stat label={t("admin.kpi.gold22")} value={money(d.rates.find((x) => x.id === "gold-22k")?.ratePerGram ?? 0)} note={t(`rates.status.${d.rates.find((x) => x.id === "gold-22k")?.status ?? "demo"}`)} />
      </div>

      <div className="a-grid-3">
        <div className="a-card">
          <h2>{t("admin.chart.sales14")}<span className="muted small">{money(r.salesSeries.reduce((s, x) => s + x.value, 0))}</span></h2>
          <BarChart data={r.salesSeries} format={compact} />
        </div>
        <div className="a-card">
          <h2>{t("admin.chart.showrooms")}</h2>
          <HBars data={r.byBranch.map((b) => ({ label: L(d.branches.find((x) => x.id === b.id)?.name) || b.id, value: b.value }))} format={compact} />
          <h2 style={{ marginTop: "1.5rem" }}>{t("admin.chart.categories")}</h2>
          <HBars data={r.byCategory.slice(0, 6).map((c) => ({ label: L(d.categories.find((x) => x.id === c.id)?.name) || c.id, value: c.value }))} format={compact} />
        </div>
      </div>

      <div className="a-grid-2" style={{ marginTop: "1.25rem" }}>
        <div className="a-card">
          <h2>{t("admin.dashboard.recentOrders")}<Link href="/admin/orders" className="btn btn--ghost btn--sm">{t("listing.viewAll")}</Link></h2>
          <table className="table">
            <tbody>
              {d.orders.slice(0, 6).map((o) => (
                <tr key={o.id}><td className="ltr">{o.number}</td><td>{o.customerName}</td><td>{date(o.createdAt)}</td><td><StatusBadge value={o.status} /></td><td className="num">{money(o.total)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="a-card">
          <h2>{t("admin.dashboard.orderCount")}</h2>
          <BarChart data={r.orderSeries} />
          <h2 style={{ marginTop: "1.5rem" }}>{t("admin.dashboard.topProducts")}</h2>
          <HBars data={r.topProducts.map((p) => ({ label: L(d.products.find((x) => x.id === p.id)?.name) || p.id, value: p.value }))} />
        </div>
      </div>
    </>
  );
}
