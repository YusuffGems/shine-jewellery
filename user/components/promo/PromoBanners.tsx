"use client";
/* USER APP — promotional banners managed in Admin › Banners (image / mobile image / video all replaceable). */
import Link from "next/link";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { Media } from "@/shared/components/Media";
import type { PromoBanner } from "@/types";

export function PromoBanners({ placement, compact }: { placement: PromoBanner["placement"]; compact?: boolean }) {
  const d = useDb();
  const { L } = useI18n();
  const list = (d.banners ?? []).filter((b) => b.active && b.placement === placement).sort((a, b) => a.sort - b.sort);
  if (!list.length) return null;
  return (
    <div className={`promo-stack${compact ? " promo-stack--compact" : ""}`}>
      {list.map((b) => (
        <section key={b.id} className={`promo promo--${b.tone}`} aria-label={L(b.title)}>
          <Media mediaId={b.mediaId} mobileMediaId={b.mobileMediaId} videoId={b.videoId} kind="campaign" dark={b.tone === "dark"} />
          <div className="promo-body reveal">
            <h2 className="promo-title">{L(b.title)}</h2>
            {L(b.subtitle) ? <p className="promo-sub">{L(b.subtitle)}</p> : null}
            {b.ctaHref ? <Link href={b.ctaHref} className={`btn${b.tone === "dark" ? " btn--light" : ""}`}>{L(b.ctaLabel)}</Link> : null}
          </div>
        </section>
      ))}
    </div>
  );
}
