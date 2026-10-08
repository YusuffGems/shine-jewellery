"use client";
/* A muted, looping video that only downloads when it comes near the screen
   and only plays while it is visible. Keeps pages with many videos smooth. */
import { useEffect, useRef, type CSSProperties } from "react";

type Props = { src: string; className?: string; style?: CSSProperties; label?: string };

export function InViewVideo({ src, className, style, label }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (el.preload !== "auto") { el.preload = "auto"; el.load(); }
          el.play().catch(() => undefined);
        } else {
          el.pause();
        }
      },
      { rootMargin: "200px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);
  return <video ref={ref} src={src} className={className} style={style} muted loop playsInline preload="none" aria-label={label} />;
}