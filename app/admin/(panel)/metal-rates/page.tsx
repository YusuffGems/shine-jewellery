"use client";
import { useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { updateRate } from "@/admin/services/rates";
import { BarChart, PageHead, StatusBadge } from "@/admin/components/ui";
import { useToast } from "@/shared/components/Toast";

export default function MetalRatesPage() {
  const d = useDb();
  const { t, L, money, date } = useI18n();
  const { can } = useAdmin();
  const toast = useToast();
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [historyFor, setHistoryFor] = useState(d.rates[0]?.id ?? "");
  const editable = can("metalRates.update");
  const history = d.rateHistory.filter((h) => h.rateId === historyFor).slice(0, 20);

  return (
    <>
      <PageHead title={t("admin.nav.metalRates")} sub={t("admin.rates.sub")} />
      <p className="notice" style={{ marginBottom: "1.25rem" }}>{t("admin.rates.providerNote")}</p>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{t("admin.rates.metal")}</th><th className="num">{t("admin.rates.current")}</th><th>{t("admin.rates.updated")}</th><th>{t("rates.source")}</th><th>{t("admin.f.status")}</th>{editable ? <th>{t("admin.rates.newRate")}</th> : null}</tr></thead>
          <tbody>
            {d.rates.map((r) => (
              <tr key={r.id}>
                <td><b style={{ fontWeight: 500 }}>{L(r.label)}</b></td>
                <td className="num">{money(r.ratePerGram)} / g</td>
                <td>{date(r.updatedAt, true)}</td>
                <td className="muted small">{r.source}</td>
                <td><StatusBadge value={r.status} label={t(`rates.status.${r.status}`)} /></td>
                {editable ? (
                  <td>
                    <div className="row" style={{ flexWrap: "nowrap" }}>
                      <input className="input" type="number" step="0.01" min="0" style={{ maxWidth: 130 }} value={edits[r.id] ?? ""} placeholder={String(r.ratePerGram)} onChange={(e) => setEdits({ ...edits, [r.id]: e.target.value })} aria-label={`${L(r.label)} ${t("admin.rates.newRate")}`} />
                      <button className="btn btn--sm" disabled={!edits[r.id]} onClick={() => {
                        try {
                          updateRate(r.id, Number(edits[r.id]));
                          setEdits({ ...edits, [r.id]: "" });
                          toast(t("admin.rates.updatedToast"));
                        } catch {
                          toast(t("admin.rates.invalid"), "error");
                        }
                      }}>{t("common.save")}</button>
                    </div>
                  </td>
                ) : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="a-card" style={{ marginTop: "1.25rem" }}>
        <h2>
          {t("admin.rates.history")}
          <select className="select" style={{ maxWidth: 220 }} value={historyFor} onChange={(e) => setHistoryFor(e.target.value)}>
            {d.rates.map((r) => <option key={r.id} value={r.id}>{r.label.en}</option>)}
          </select>
        </h2>
        <BarChart data={[...history].reverse().map((h) => ({ label: date(h.at).slice(0, 6), value: h.ratePerGram }))} format={(n) => n.toFixed(2)} />
        <table className="table" style={{ marginTop: "1rem" }}>
          <tbody>{history.map((h) => <tr key={h.id}><td>{date(h.at, true)}</td><td className="num">{money(h.ratePerGram)}</td><td className="muted">{h.by}</td></tr>)}</tbody>
        </table>
      </div>
    </>
  );
}
