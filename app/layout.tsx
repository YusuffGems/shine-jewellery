import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { CoreProviders } from "@/shared/providers/CoreProviders";
import { organizationJsonLd } from "@/lib/seo/schema";
import { SITE } from "@/config/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "SHINE Gold & Diamonds | Qatar", template: "%s | SHINE Gold & Diamonds" },
  description: SITE.description,
  alternates: { canonical: "/", languages: { en: "/", ar: "/?lang=ar" } },
  openGraph: { type: "website", siteName: "SHINE Gold & Diamonds", locale: "en_QA", alternateLocale: ["ar_QA"], title: "SHINE Gold & Diamonds", description: SITE.description },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#101010",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }} />
      </head>
      <body>
        <CoreProviders>{children}</CoreProviders>
      </body>
    </html>
  );
}
