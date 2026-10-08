import type { Database, ThemeTokens } from "@/types";
import { BASE_TOKENS, PRESETS } from "./tokens";

const DARK_KEYS: (keyof ThemeTokens)[] = [
  "colorPrimary", "colorSecondary", "colorBackground", "colorSurface", "colorText", "colorMuted", "colorBorder", "footerBackground", "footerText",
];

/** Colours from the Obsidian preset layered over any theme = dark appearance. */
export function applyDark(tokens: ThemeTokens): ThemeTokens {
  const dark = PRESETS.find((p) => p.id === "theme-obsidian")!.tokens;
  const out = { ...tokens };
  for (const k of DARK_KEYS) (out as Record<string, unknown>)[k] = dark[k];
  if (tokens.buttonStyle === "solid") out.buttonStyle = "gold";
  return out;
}

/** Tokens the storefront should render right now (preview > active theme, then appearance). */
export function storefrontTokens(d: Database): { tokens: ThemeTokens; previewName?: string } {
  const preview = d.session.previewThemeId ? d.themes.find((t) => t.id === d.session.previewThemeId) : undefined;
  const active = d.themes.find((t) => t.id === d.settings.activeThemeId) ?? d.themes[0];
  const base = preview ? (preview.draft ?? preview.tokens) : (active?.tokens ?? BASE_TOKENS);
  return { tokens: d.session.appearance === "dark" ? applyDark(base) : base, previewName: preview?.name };
}
