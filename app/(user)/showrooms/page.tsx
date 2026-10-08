"use client";
import Link from "next/link";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { track } from "@/shared/services/core";
import { Media } from "@/shared/components/Media";
import { Icon } from "@/shared/components/Icon";

export default function ShowroomsPage() {
  const d = useDb();
  const { t, L } = useI18n();
  const branches = d.branches.filter((b) => b.active).sort((a, b) => a.sort - b.sort);
  return (
    <div className="container" style={{ paddingBottom: "var(--section-space)" }}>
      <div className="section-head" style={{ paddingTop: "4rem" }}>
        <span className="eyebrow">{t("showroom.eyebrow")}</span>
        <h1 className="section-title">{t("nav.showrooms")}</h1>
        <p className="section-sub">{t("showroom.intro")}</p>
      </div>
      <div className="showroom-grid">
        {branches.map((b) => (
          <article key={b.id} className="showroom-card">
            <Media mediaId={b.imageIds[0]} videoId={b.videoId} kind="showroom" />
            <div className="showroom-card-body">
              <h2 style={{ fontFamily: "var(--font-heading)", fontWeight: "var(--weight-heading)", fontSize: "1.6rem" }}>{L(b.name)}</h2>
              <p className="muted"><Icon name="pin" size={14} style={{ display: "inline", marginInlineEnd: 6 }} />{L(b.address)}</p>
              <p className="muted small">{[b.zone, b.area, b.city].filter(Boolean).join(" · ")}</p>
              <p className="muted small">{L(b.hours)}</p>
              <div className="row" style={{ flexWrap: "wrap" }}>{b.services.map((s) => <span key={s} className="badge">{t(`service.${s}`, undefined, s)}</span>)}</div>
              <div className="row" style={{ marginTop: "0.5rem" }}>
                <Link href={`/appointment?branch=${b.id}`} className="btn btn--sm" onClick={() => track("showroom_click", { branchId: b.id })}>{t("nav.bookAppointment")}</Link>
                {b.phone ? <a className="btn btn--secondary btn--sm" href={`tel:${b.phone}`}>{t("showroom.call")}</a> : null}
                {b.mapUrl ? <a className="btn btn--secondary btn--sm" href={b.mapUrl} target="_blank" rel="noopener noreferrer">{t("showroom.map")}</a> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
