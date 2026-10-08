"use client";
import { useMemo, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { buildDashboard, eventCounts } from "@/lib/reports/analytics";
import { BarChart, HBars, PageHead } from "@/admin/components/ui";

function downloadCsv(name: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const d = useDb();
  const { t, L, money, date } = useI18n();
  const [days, setDays] = useState(30);
  const r = useMemo(() => buildDashboard(d, days), [d, days]);
  const events = useMemo(() => eventCounts(d), [d]);

  return (
    <>
      <PageHead
        title={t("admin.nav.reports")}
        sub={t("admin.reports.sub")}
        actions={
          <>
            <select className="select" value={days} onChange={(e) => setDays(Number(e.target.value))}>{[7, 14, 30, 90].map((n) => <option key={n} value={n}>{t("admin.reports.lastDays", { n })}</option>)}</select>
            <button className="btn btn--secondary" onClick={() => downloadCsv("shine-orders.csv", [["Order", "Date", "Customer", "Status", "Payment", "Total QAR"], ...d.orders.map((o) => [o.number, o.createdAt, o.customerName, o.status, o.payment.status, o.total])])}>{t("admin.reports.exportOrders")}</button>
          </>
        }
      />
      <div className="a-card"><h2>{t("admin.chart.sales")}<span className="muted small">{money(r.salesSeries.reduce((s, x) => s + x.value, 0))}</span></h2><BarChart data={r.salesSeries} format={(n) => n.toFixed(0)} /></div>
      <div className="a-grid-2" style={{ marginTop: "1.25rem" }}>
        <div className="a-card"><h2>{t("admin.chart.categories")}</h2><HBars data={r.byCategory.map((c) => ({ label: L(d.categories.find((x) => x.id === c.id)?.name) || c.id, value: c.value }))} format={(n) => money(n)} /></div>
        <div className="a-card"><h2>{t("admin.chart.showrooms")}</h2><HBars data={r.byBranch.map((b) => ({ label: L(d.branches.find((x) => x.id === b.id)?.name) || b.id, value: b.value }))} format={(n) => money(n)} /></div>
      </div>
      <div className="a-grid-2" style={{ marginTop: "1.25rem" }}>
        <div className="a-card"><h2>{t("admin.reports.events")}</h2>{events.length ? <HBars data={events.map((e) => ({ label: e.event, value: e.count }))} /> : <p className="muted small">{t("admin.reports.noEvents")}</p>}</div>
        <div className="a-card">
          <h2>{t("admin.reports.notifications")}</h2>
          <p className="field-hint" style={{ marginBottom: "0.5rem" }}>{t("admin.reports.notificationsHint")}</p>
          <table className="table"><tbody>{d.notifications.slice(0, 12).map((n) => <tr key={n.id}><td><span className="badge">{n.channel}</span></td><td className="small">{n.event}</td><td className="small muted">{n.to}</td><td className="small">{date(n.at, true)}</td></tr>)}</tbody></table>
        </div>
      </div>
    </>
  );
}
