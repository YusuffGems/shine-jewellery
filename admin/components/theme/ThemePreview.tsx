"use client";
/* ADMIN — live theme preview.
   Shows the REAL user website inside an isolated <iframe> (so no user components or
   user CSS are ever loaded into the admin app). Draft tokens are sent to the frame with
   postMessage; user/providers/UserThemeSync applies them instantly. Device widths use
   the real responsive breakpoints because the iframe has its own viewport. */
import { useCallback, useEffect, useRef, useState } from "react";
import type { ThemeTokens } from "@/types";

export type Device = "desktop" | "tablet" | "mobile";
const WIDTH: Record<Device, number> = { desktop: 1366, tablet: 820, mobile: 390 };
const MESSAGE = "shine:theme-preview";

export function ThemePreview({ tokens, device, path = "/" }: { tokens: ThemeTokens; device: Device; path?: string }) {
  const outer = useRef<HTMLDivElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const [box, setBox] = useState({ w: 1000, h: 700 });

  useEffect(() => {
    if (!outer.current) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(outer.current);
    return () => ro.disconnect();
  }, []);

  const send = useCallback(() => {
    frame.current?.contentWindow?.postMessage({ type: MESSAGE, tokens }, window.location.origin);
  }, [tokens]);

  useEffect(() => {
    send();
  }, [send]);

  useEffect(() => {
    const onReady = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.data?.type === `${MESSAGE}:ready`) send();
    };
    window.addEventListener("message", onReady);
    return () => window.removeEventListener("message", onReady);
  }, [send]);

  const width = WIDTH[device];
  const scale = Math.min(1, (box.w - 8) / width);
  const height = Math.max(480, (box.h - 8) / scale);

  return (
    <div ref={outer} className="tb-frame-wrap">
      <div className={`device device--${device}`} style={{ width: width * scale, height: height * scale }}>
        <iframe
          ref={frame}
          title="Website preview"
          src={`${path}${path.includes("?") ? "&" : "?"}shinePreview=1`}
          onLoad={send}
          style={{ width, height, transform: `scale(${scale})` }}
        />
      </div>
    </div>
  );
}
