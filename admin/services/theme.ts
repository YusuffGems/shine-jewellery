/* ADMIN APP — theme builder drafts, publish, presets. */
import { db } from "@/lib/store/db";
import { nowIso, uid } from "@/lib/utils";
import { writeAudit } from "@/shared/services/core";
import type { Theme, ThemeTokens } from "@/types";

export function saveDraft(themeId: string, tokens: ThemeTokens) {
  db.update((d) => {
    const t = d.themes.find((x) => x.id === themeId);
    if (!t) return;
    t.draft = structuredClone(tokens);
    t.updatedAt = nowIso();
    writeAudit(d, "save_draft", "themes", themeId);
  });
}

/** Publish = draft becomes live tokens. If the theme is active the storefront updates immediately. */
export function publishTheme(themeId: string, tokens: ThemeTokens, activate = true) {
  db.update((d) => {
    const t = d.themes.find((x) => x.id === themeId);
    if (!t) return;
    writeAudit(d, "publish", "themes", themeId, t.tokens, tokens);
    t.tokens = structuredClone(tokens);
    t.draft = undefined;
    t.updatedAt = nowIso();
    if (activate) d.settings.activeThemeId = themeId;
  });
}

export function activateTheme(themeId: string) {
  db.update((d) => {
    if (!d.themes.some((t) => t.id === themeId)) return;
    writeAudit(d, "activate", "themes", themeId, d.settings.activeThemeId, themeId);
    d.settings.activeThemeId = themeId;
  });
}

export function duplicateTheme(themeId: string, tokens?: ThemeTokens): string {
  const id = uid("theme");
  db.update((d) => {
    const src = d.themes.find((x) => x.id === themeId);
    if (!src) return;
    const copy: Theme = { id, name: `${src.name} copy`, preset: false, tokens: structuredClone(tokens ?? src.tokens), updatedAt: nowIso() };
    d.themes.push(copy);
    writeAudit(d, "duplicate", "themes", id, undefined, { from: themeId });
  });
  return id;
}

export function renameTheme(themeId: string, name: string) {
  db.update((d) => {
    const t = d.themes.find((x) => x.id === themeId);
    if (t && name.trim()) t.name = name.trim();
  });
}

/** The active theme can never be deleted. Presets are protected too. */
export function deleteTheme(themeId: string): { ok: boolean; reason?: "active" | "preset" } {
  const d0 = db.get();
  if (d0.settings.activeThemeId === themeId) return { ok: false, reason: "active" };
  if (d0.themes.find((t) => t.id === themeId)?.preset) return { ok: false, reason: "preset" };
  db.update((d) => {
    d.themes = d.themes.filter((t) => t.id !== themeId);
    if (d.session.previewThemeId === themeId) d.session.previewThemeId = undefined;
    writeAudit(d, "delete", "themes", themeId);
  });
  return { ok: true };
}
