"use client";
import { useState, type MouseEvent } from "react";
import { useI18n } from "@/shared/hooks/useI18n";
import { Media } from "@/shared/components/Media";
import type { Product } from "@/types";

type Slide = { kind: "image" | "video"; id: string };

export function Gallery({ product }: { product: Product }) {
  const { t, L } = useI18n();
  const slides: Slide[] = [...product.imageIds.map((id) => ({ kind: "image" as const, id })), ...product.videoIds.map((id) => ({ kind: "video" as const, id }))];
  const [index, setIndex] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const current = slides[index];

  const onMove = (e: MouseEvent<HTMLDivElement>) => {
    if (current?.kind !== "image") return;
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  return (
    <div className="gallery">
      <div className="gallery-thumbs" role="tablist" aria-label={t("product.gallery")}>
        {slides.map((s, i) => (
          <button key={s.id} role="tab" aria-current={i === index} aria-label={`${t("product.view")} ${i + 1}`} onClick={() => setIndex(i)}>
            <Media mediaId={s.kind === "image" ? s.id : undefined} videoId={s.kind === "video" ? s.id : undefined} kind={s.kind === "video" ? "video" : "product"} showVideoBadge={s.kind === "video"} />
          </button>
        ))}
      </div>
      <div className={`gallery-main${zoom ? " zooming" : ""}`} onMouseMove={onMove} onMouseLeave={() => setZoom(null)}>
        {current ? (
                   <Media
            key={current.id}
            mediaId={current.kind === "image" ? current.id : undefined}
            videoId={current.kind === "video" ? current.id : undefined}
            alt={L(product.name)}
            kind={current.kind === "video" ? "video" : "product"}
            priority
            controls={current.kind === "video"}
            playInView={false}
            style={zoom ? { transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
          />
                 
        ) : (
          <Media kind="product" />
        )}
      </div>
    </div>
  );
}
