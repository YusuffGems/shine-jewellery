"use client";
/* USER APP ONLY — applies the active storefront theme to <html> and runs scroll reveals.
   When the site is shown inside the Admin Theme Builder preview (iframe with ?shinePreview=1),
   it also accepts unsaved draft tokens from the admin window via postMessage. */
import { useEffect, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { storefrontTokens, applyDark } from "@/lib/theme/resolve";
import { toCssVars, toDataAttrs } from "@/lib/theme/tokens";
import type { ThemeTokens } from "@/types";

export const PREVIEW_MESSAGE = "shine:theme-preview";
const PREVIEW_FLAG = "shine.preview-frame";

export function isPreviewFrame(): boolean {
  if (typeof window === "undefined" || window.self === window.top) return false;
  try {
    if (new URLSearchParams(window.location.search).has("shinePreview")) sessionStorage.setItem(PREVIEW_FLAG, "1");
    return sessionStorage.getItem(PREVIEW_FLAG) === "1";
  } catch {
    return false;
  }
}

export function UserThemeSync() {
  const d = useDb();
  const [draft, setDraft] = useState<ThemeTokens | null>(null);
  const base = storefrontTokens(d).tokens;
  const tokens = draft ? (d.session.appearance === "dark" ? applyDark(draft) : draft) : base;

  useEffect(() => {
    if (!isPreviewFrame()) return;
    document.documentElement.dataset.previewFrame = "true";
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.data?.type !== PREVIEW_MESSAGE) return;
      setDraft(e.data.tokens as ThemeTokens);
    };
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: `${PREVIEW_MESSAGE}:ready` }, window.location.origin);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    for (const [k, v] of Object.entries(toCssVars(tokens))) html.style.setProperty(k, v);
    for (const [k, v] of Object.entries(toDataAttrs(tokens))) html.setAttribute(k, v);
    html.style.colorScheme = d.session.appearance === "dark" ? "dark" : "light";
  }, [tokens, d.session.appearance]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("is-visible"), io.unobserve(e.target))),
      { rootMargin: "0px 0px -8% 0px" },
    );
    const scan = () => document.querySelectorAll(".reveal:not(.is-visible)").forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);

  return null;
}
