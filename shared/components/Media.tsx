"use client";
/* ──────────────────────────────────────────────────────────────
   Every visual on the site renders through <Media>.
   It takes media REFERENCES (ids from the Media Library), never
   hard-coded files. Video falls back to poster → image → placeholder,
   so no slot is ever broken.
   ────────────────────────────────────────────────────────────── */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import type { MediaAsset, PlaceholderKind } from "@/types";
import { Icon } from "@/shared/components/Icon";
import { useMediaUrl } from "@/shared/hooks/useMediaUrl";

interface MediaProps {
  mediaId?: string;
  mobileMediaId?: string;
  videoId?: string;
  alt?: string;
  ratio?: string;
  className?: string;
  style?: CSSProperties;
  kind?: PlaceholderKind;
  dark?: boolean;
  priority?: boolean;
  showVideoBadge?: boolean;
  /** For video: play only while visible (saves bandwidth) */
  playInView?: boolean;
  controls?: boolean;
}

const LABEL_KEYS: Record<PlaceholderKind, string> = {
  product: "media.productImage",
  collection: "media.collectionImage",
  campaign: "media.campaignImage",
  video: "media.video",
  showroom: "media.showroomImage",
  category: "media.collectionImage",
};

export function PlaceholderArt({ kind }: { kind: PlaceholderKind }) {
  const common = { viewBox: "0 0 64 64", fill: "none", stroke: "currentColor", strokeWidth: 1, "aria-hidden": true } as const;
  switch (kind) {
    case "product":
      return (
        <svg {...common}>
          <circle cx="32" cy="38" r="16" />
          <circle cx="32" cy="38" r="12.5" opacity=".5" />
          <path d="M26 22l6-9 6 9-6 4-6-4Z" />
          <path d="M26 22h12M32 13v13" opacity=".6" />
        </svg>
      );
    case "collection":
    case "category":
      return (
        <svg {...common}>
          <path d="M10 14c0 18 10 30 22 30s22-12 22-30" />
          <path d="M32 44v4M28 52l4-4 4 4-4 4-4-4Z" />
          {[16, 22, 28, 36, 42, 48].map((x, i) => (
            <circle key={i} cx={x} cy={14 + Math.sin((x - 10) / 14) * 22} r="1.2" fill="currentColor" stroke="none" />
          ))}
        </svg>
      );
    case "showroom":
      return (
        <svg {...common}>
          <path d="M14 56V30a18 18 0 0 1 36 0v26" />
          <path d="M22 56V32a10 10 0 0 1 20 0v24M8 56h48" opacity=".6" />
        </svg>
      );
    case "video":
      return (
        <svg {...common}>
          <circle cx="32" cy="32" r="22" />
          <path d="M27 23v18l15-9-15-9Z" fill="currentColor" stroke="none" opacity=".85" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <path d="M18 14h28l10 14-24 26L8 28l10-14Z" />
          <path d="M8 28h48M32 54 24 28l8-14 8 14-8 26" opacity=".6" />
        </svg>
      );
  }
}

function Placeholder({ kind, title, dark }: { kind: PlaceholderKind; title?: string; dark?: boolean }) {
  const { t } = useI18n();
  return (
    <div className={`placeholder${dark ? " placeholder--dark" : ""}`} aria-hidden="true">
      <span className="placeholder-pattern" />
      <PlaceholderArt kind={kind} />
      <span className="placeholder-label">{t(LABEL_KEYS[kind])}</span>
      {title ? <span className="placeholder-title">{title}</span> : null}
    </div>
  );
}

function AutoVideo({ asset, src, poster, playInView, controls }: { asset: MediaAsset; src: string; poster?: string; playInView?: boolean; controls?: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || !playInView || controls) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) el.play().catch(() => undefined);
      else el.pause();
    }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, [playInView, controls]);
  if (failed) return poster ? <img src={poster} alt="" /> : null;
  const reduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      muted={asset.muted ?? true}
      loop={asset.loop ?? true}
            autoPlay={!reduceMotion && (asset.autoplay ?? true) && !playInView}
      controls={controls ?? asset.controls}
      playsInline
      preload="metadata"
      onError={() => setFailed(true)}
      aria-label={asset.title}
    />
  );
}

export function Media({ mediaId, mobileMediaId, videoId, alt, ratio, className, style, kind, dark, priority, showVideoBadge, playInView = true, controls }: MediaProps) {
  const d = useDb();
  const { L } = useI18n();
  const image = mediaId ? d.media.find((m) => m.id === mediaId && m.status === "active") : undefined;
  const mobile = mobileMediaId ? d.media.find((m) => m.id === mobileMediaId && m.status === "active") : undefined;
  const video = videoId ? d.media.find((m) => m.id === videoId && m.status === "active") : undefined;
  const posterAsset = video?.posterId ? d.media.find((m) => m.id === video.posterId) : undefined;
  // Stored urls may be "idb:…" references (uploaded files) — resolve them to displayable URLs.
  const imageUrl = useMediaUrl(image?.url);
  const mobileUrl = useMediaUrl(mobile?.url);
  const videoUrl = useMediaUrl(video?.url);
  const posterUrl = useMediaUrl(posterAsset?.url);
  const poster = posterUrl || imageUrl || undefined;
  const altText = alt || (image ? L(image.alt) || image.title : "");
  const frameStyle: CSSProperties = { ...(ratio ? { aspectRatio: ratio } : {}), ...style };
  const objectPosition = image?.focalX !== undefined ? `${image.focalX}% ${image.focalY ?? 50}%` : undefined;

  let content;
  if (video && videoUrl) {
    content = <AutoVideo asset={video} src={videoUrl} poster={poster} playInView={playInView} controls={controls} />;
  } else if (image && imageUrl) {
    content = mobileUrl ? (
      <picture>
        <source media="(max-width: 768px)" srcSet={mobileUrl} />
        <img src={imageUrl} alt={altText} loading={priority ? "eager" : "lazy"} decoding="async" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition }} />
      </picture>
    ) : (
      <img src={imageUrl} alt={altText} loading={priority ? "eager" : "lazy"} decoding="async" style={objectPosition ? { objectPosition } : undefined} />
    );
  } else if (image?.url || video?.url) {
    content = <div className="placeholder skeleton" aria-hidden="true" />; // file still loading from storage
  } else {
    const k = kind ?? (video && !image ? "video" : image?.placeholder) ?? "campaign";
    content = <Placeholder kind={k} title={image?.title ?? video?.title} dark={dark} />;
  }

  return (
    <div className={["media", className].filter(Boolean).join(" ")} style={frameStyle} role={altText && !video?.url ? "img" : undefined} aria-label={!image?.url && altText ? altText : undefined}>
      {content}
      {showVideoBadge && video ? (
        <span className="video-badge" aria-hidden="true">
          <Icon name="play" size={12} />
        </span>
      ) : null}
    </div>
  );
}
