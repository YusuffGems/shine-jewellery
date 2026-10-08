"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";

export default function GoldRatePage() {
  const d = useDb();
  const { t, L, money, date } = useI18n();
  const demo = d.rates.some((r) => r.status === "demo");
  return (
    <div className="container" style={{ paddingBottom: "var(--section-space)" }}>
      <div className="section-head" style={{ paddingTop: "4rem" }}>
        <span className="eyebrow">{t("rates.eyebrow")}</span>
        <h1 className="section-title">{t("rates.title")}</h1>
        <p className="section-sub">{t("rates.sub")}</p>
      </div>
      {demo ? <p className="notice" style={{ marginBottom: "2rem" }}>{t("rates.demoNotice")}</p> : null}
      <div className="rate-board">
        {d.rates.map((r) => (
          <div key={r.id} className="rate-cell">
            <span className="caps muted">{L(r.label)}</span>
            <b className="ltr">{money(r.ratePerGram)}</b>
            <span className="small muted">{t("rates.perGram")} · {date(r.updatedAt, true)}</span>
            <span className="small muted">{t("rates.source")}: {r.source} · <span className={`badge ${r.status === "live" ? "badge--success" : "badge--warning"}`}>{t(`rates.status.${r.status}`)}</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}
