import type { ThemeTokens } from "@/types";

export const HEADING_FONTS = ["Cormorant Garamond", "Playfair Display", "Marcellus", "Bodoni Moda", "Cinzel"];
export const BODY_FONTS = ["Jost", "Manrope", "Inter", "Montserrat", "DM Sans"];
export const ARABIC_FONTS = ["Noto Kufi Arabic", "Tajawal", "Cairo", "Amiri", "IBM Plex Sans Arabic"];

/** One Google Fonts stylesheet; browsers only download families actually used. */
export const GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Marcellus&family=Bodoni+Moda:wght@400;500;600;700&family=Cinzel:wght@400;500;600&family=Jost:wght@300;400;500;600&family=Manrope:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600&family=DM+Sans:wght@300;400;500;600&family=Noto+Kufi+Arabic:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700&family=Cairo:wght@300;400;600;700&family=Amiri:wght@400;700&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600&display=swap";

export const BASE_TOKENS: ThemeTokens = {
  brandName: "SHINE",
  tagline: "Gold & Diamonds",
  logoMediaId: "m-logo",
  logoDarkMediaId: "m-logo-light",
  faviconMediaId: "m-favicon",
  colorPrimary: "#101010",
  colorSecondary: "#1B1A18",
  colorAccent: "#C7A56A",
  colorGold: "#C7A56A",
  colorBackground: "#F7F4EE",
  colorSurface: "#FFFFFF",
  colorText: "#181818",
  colorMuted: "#68645D",
  colorBorder: "#DED8CE",
  colorSuccess: "#397354",
  colorWarning: "#A7792F",
  colorError: "#A64B4B",
  fontHeading: "Cormorant Garamond",
  fontBody: "Jost",
  fontArabic: "Noto Kufi Arabic",
  headingWeight: 500,
  bodyWeight: 400,
  letterSpacing: 0.02,
  buttonStyle: "solid",
  buttonRadius: 0,
  buttonHeight: 50,
  buttonUppercase: true,
  cardRadius: 2,
  cardShadow: "none",
  cardBorder: false,
  cardHover: "swap",
  imageRatio: "4/5",
  headerStyle: "centered",
  headerSticky: true,
  headerTransparent: false,
  announcementEnabled: true,
  logoSize: 30,
  navSpacing: 22,
  footerBackground: "#101010",
  footerText: "#EFEAE1",
  footerColumns: 4,
  footerSocial: true,
  footerNewsletter: true,
  gridColumns: 4,
  quickView: true,
  wishlistOnCard: true,
  inputRadius: 0,
  containerWidth: 1360,
  pagePadding: 32,
  sectionSpacing: 104,
  radius: 2,
  animationSpeed: 1,
};

export const PRESETS: { id: string; name: string; tokens: ThemeTokens }[] = [
  {
    id: "theme-signature",
    name: "SHINE Signature",
    // Brand colours sampled from the SHINE logo: burgundy #7A303F + gold #A67E38
    tokens: {
      ...BASE_TOKENS,
      colorPrimary: "#6E2436",
      colorSecondary: "#4A1724",
      colorAccent: "#A67E38",
      colorGold: "#B08A48",
      colorBackground: "#FAF6F1",
      colorSurface: "#FFFFFF",
      colorText: "#1F1416",
      colorMuted: "#6B5D5F",
      colorBorder: "#E8DDD5",
      footerBackground: "#3E1320",
      footerText: "#F1E6DA",
      logoSize: 34,
    },
  },
  { id: "theme-luxury", name: "SHINE Luxury", tokens: BASE_TOKENS },
  {
    id: "theme-ivory",
    name: "SHINE Ivory",
    tokens: { ...BASE_TOKENS, colorBackground: "#FBF9F5", colorSurface: "#FFFFFF", colorPrimary: "#2A2622", buttonStyle: "outline", cardBorder: true, cardRadius: 0, footerBackground: "#EFEAE1", footerText: "#2A2622", fontHeading: "Playfair Display", headingWeight: 400 },
  },
  {
    id: "theme-obsidian",
    name: "SHINE Obsidian",
    tokens: { ...BASE_TOKENS, colorPrimary: "#D9C08A", colorSecondary: "#EFEAE1", colorBackground: "#0E0E0D", colorSurface: "#181715", colorText: "#EFEAE1", colorMuted: "#A39D92", colorBorder: "#34312C", footerBackground: "#070707", footerText: "#D9C08A", buttonStyle: "gold", cardShadow: "none" },
  },
  {
    id: "theme-champagne",
    name: "SHINE Champagne",
    tokens: { ...BASE_TOKENS, colorBackground: "#F4EDE1", colorSurface: "#FBF7F0", colorAccent: "#B88E4F", colorGold: "#B88E4F", buttonStyle: "gold", buttonRadius: 40, cardRadius: 14, cardShadow: "soft", radius: 12, fontHeading: "Bodoni Moda", headingWeight: 400, inputRadius: 10 },
  },
  {
    id: "theme-minimal",
    name: "SHINE Minimal",
    tokens: { ...BASE_TOKENS, colorBackground: "#FFFFFF", colorSurface: "#FFFFFF", colorBorder: "#E7E4DF", colorGold: "#B79A62", colorAccent: "#B79A62", fontHeading: "Marcellus", fontBody: "Manrope", headingWeight: 400, cardHover: "zoom", gridColumns: 3, sectionSpacing: 88, footerBackground: "#F5F3EF", footerText: "#181818", buttonUppercase: false },
  },
];

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0");
  const n = parseInt(full.slice(0, 6), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** Readable foreground (black/white family) for a background colour. */
export function onColor(hex: string, dark = "#101010", light = "#FFFFFF"): string {
  const [r, g, b] = hexToRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? dark : light;
}

const SHADOWS = {
  none: "none",
  soft: "0 10px 30px -18px rgba(16,16,16,.28)",
  lifted: "0 24px 48px -24px rgba(16,16,16,.38)",
};

/** Theme tokens → CSS custom properties consumed by styles/*.css */
export function toCssVars(t: ThemeTokens): Record<string, string> {
  const btn =
    t.buttonStyle === "outline"
      ? { bg: "transparent", fg: t.colorPrimary, border: t.colorPrimary, hoverBg: t.colorPrimary, hoverFg: onColor(t.colorPrimary) }
      : t.buttonStyle === "gold"
        ? { bg: t.colorGold, fg: onColor(t.colorGold), border: t.colorGold, hoverBg: t.colorPrimary, hoverFg: onColor(t.colorPrimary) }
        : { bg: t.colorPrimary, fg: onColor(t.colorPrimary), border: t.colorPrimary, hoverBg: t.colorGold, hoverFg: onColor(t.colorGold) };

  const speed = Math.max(0.01, t.animationSpeed);
  return {
    "--color-primary": t.colorPrimary,
    "--color-secondary": t.colorSecondary,
    "--color-accent": t.colorAccent,
    "--color-gold": t.colorGold,
    "--color-background": t.colorBackground,
    "--color-surface": t.colorSurface,
    "--color-text": t.colorText,
    "--color-muted": t.colorMuted,
    "--color-border": t.colorBorder,
    "--color-success": t.colorSuccess,
    "--color-warning": t.colorWarning,
    "--color-error": t.colorError,
    "--color-on-primary": onColor(t.colorPrimary),
    "--font-heading": `"${t.fontHeading}", "Times New Roman", serif`,
    "--font-body": `"${t.fontBody}", system-ui, sans-serif`,
    "--font-arabic": `"${t.fontArabic}", "Segoe UI", Tahoma, sans-serif`,
    "--weight-heading": String(t.headingWeight),
    "--weight-body": String(t.bodyWeight),
    "--tracking": `${t.letterSpacing}em`,
    "--btn-bg": btn.bg,
    "--btn-fg": btn.fg,
    "--btn-border": btn.border,
    "--btn-hover-bg": btn.hoverBg,
    "--btn-hover-fg": btn.hoverFg,
    "--btn-radius": `${t.buttonRadius}px`,
    "--btn-height": `${t.buttonHeight}px`,
    "--btn-transform": t.buttonUppercase ? "uppercase" : "none",
    "--card-radius": `${t.cardRadius}px`,
    "--card-shadow": SHADOWS[t.cardShadow],
    "--card-border": t.cardBorder ? `1px solid ${t.colorBorder}` : "1px solid transparent",
    "--image-ratio": t.imageRatio,
    "--header-position": t.headerSticky ? "sticky" : "relative",
    "--logo-size": `${t.logoSize}px`,
    "--nav-gap": `${t.navSpacing}px`,
    "--footer-bg": t.footerBackground,
    "--footer-fg": t.footerText,
    "--footer-cols": String(t.footerColumns),
    "--grid-cols": String(t.gridColumns),
    "--input-radius": `${t.inputRadius}px`,
    "--container": `${t.containerWidth}px`,
    "--page-pad": `${t.pagePadding}px`,
    "--section-space": `${t.sectionSpacing}px`,
    "--radius-sm": `${Math.round(t.radius / 2)}px`,
    "--radius-md": `${t.radius}px`,
    "--radius-lg": `${t.radius * 2}px`,
    "--speed": String(speed),
    "--dur-fast": `${Math.round(180 * speed)}ms`,
    "--dur": `${Math.round(320 * speed)}ms`,
    "--dur-slow": `${Math.round(700 * speed)}ms`,
  };
}

export function toDataAttrs(t: ThemeTokens): Record<string, string> {
  return {
    "data-card-hover": t.cardHover,
    "data-header": t.headerStyle,
    "data-header-transparent": String(t.headerTransparent),
  };
}
