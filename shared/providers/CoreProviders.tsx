"use client";
/* Root providers shared by BOTH apps (user + admin): data hydration, language direction,
   favicon, fonts and toasts. Storefront theming lives in user/providers/UserThemeSync. */
import { useEffect, type ReactNode } from "react";
import { db } from "@/lib/store/db";
import { useDb } from "@/shared/hooks/useDb";
import { useMediaUrl } from "@/shared/hooks/useMediaUrl";
import { dirOf } from "@/lib/i18n";
import { storefrontTokens } from "@/lib/theme/resolve";
import { GOOGLE_FONTS_HREF } from "@/lib/theme/tokens";
import { ToastProvider } from "@/shared/components/Toast";
import { migrateInlineMedia } from "@/shared/services/media";
import { startCloudSync } from "@/lib/store/cloudSync";

function DocumentSync() {
  const d = useDb();
  const lang = d.session.lang;
  const { tokens } = storefrontTokens(d);
  const favUrl = useMediaUrl(tokens.faviconMediaId ? d.media.find((m) => m.id === tokens.faviconMediaId)?.url : "");

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = dirOf(lang);
  }, [lang]);

  useEffect(() => {
    if (!favUrl) return;
    let link = document.querySelector<HTMLLinkElement>("link[rel='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = favUrl;
  }, [favUrl]);

  return null;
}

export function CoreProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    db.hydrate();
    void migrateInlineMedia();
        startCloudSync();
    if (!document.querySelector("link[data-shine-fonts]")) {
      const link = Object.assign(document.createElement("link"), { rel: "stylesheet", href: GOOGLE_FONTS_HREF });
      link.dataset.shineFonts = "1";
      document.head.appendChild(link);
    }
  }, []);
  return (
    <ToastProvider>
      <DocumentSync />
      {children}
    </ToastProvider>
  );
}
