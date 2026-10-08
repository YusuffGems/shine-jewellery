/* ──────────────────────────────────────────────────────────────
   Mock database (browser).
   A tiny observable store persisted to localStorage so every admin
   change shows up on the storefront immediately — no backend needed.

   Services in /services are the ONLY callers of db.update().
   To go live, replace service internals with fetch() to /api/*
   (see docs/API-INTEGRATION.md); components and hooks stay the same.
   ────────────────────────────────────────────────────────────── */
import type { Database } from "@/types";
import { SEED, createSeed } from "./seed";

const STORAGE_KEY = "shine.db.v1";
type Listener = () => void;

let state: Database = SEED;
let hydrated = false;
const listeners = new Set<Listener>();
const errorListeners = new Set<(msg: string) => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    errorListeners.forEach((l) => l("storage_full"));
  }
}

/** Fill in keys added in newer seed versions without wiping user data. */
function migrate(raw: Partial<Database>): Database {
  const fresh = createSeed();
  const merged = { ...fresh, ...raw } as Database;
  merged.settings = { ...fresh.settings, ...raw.settings };
  merged.session = { ...fresh.session, ...raw.session };
  merged.cms = { ...fresh.cms, ...raw.cms };
  merged.translations = { en: { ...raw.translations?.en }, ar: { ...raw.translations?.ar } };
  if ((raw.version ?? 1) < 2) upgradeToV2(merged, fresh);
  return merged;
}

/**
 * v2: brand logo + generated placeholder media + product videos + "SHINE Signature" theme.
 * Only fills empty slots — anything the admin already uploaded or edited is kept.
 */
function upgradeToV2(d: Database, fresh: Database) {
  for (const f of fresh.media) {
    const cur = d.media.find((m) => m.id === f.id);
    if (!cur) d.media.push(f);
    else if (!cur.url) Object.assign(cur, { url: f.url, generated: f.generated, title: f.title });
  }
  for (const fp of fresh.products) {
    const p = d.products.find((x) => x.id === fp.id);
    if (p && !p.videoIds.length) p.videoIds = fp.videoIds;
  }
  for (const preset of fresh.themes) if (!d.themes.some((t) => t.id === preset.id)) d.themes.unshift(preset);
  for (const t of d.themes) {
    for (const tok of [t.tokens, t.draft]) {
      if (!tok) continue;
      tok.logoMediaId ??= "m-logo";
      tok.logoDarkMediaId ??= "m-logo-light";
      tok.faviconMediaId ??= "m-favicon";
    }
  }
  if (d.settings.activeThemeId === "theme-luxury") d.settings.activeThemeId = "theme-signature";
  d.version = 2;
}

export const db = {
  get(): Database {
    return state;
  },
  /** Server snapshot = seed; avoids hydration mismatch. */
  getServerSnapshot(): Database {
    return SEED;
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  onError(listener: (msg: string) => void): () => void {
    errorListeners.add(listener);
    return () => errorListeners.delete(listener);
  },
  /** Load persisted state once on the client. */
  hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      state = raw ? migrate(JSON.parse(raw)) : createSeed();
    } catch {
      state = createSeed();
    }
    emit();
    window.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY || !e.newValue) return;
      try {
        state = migrate(JSON.parse(e.newValue));
        emit();
      } catch {
        /* ignore malformed cross-tab payloads */
      }
    });
  },
  isHydrated() {
    return hydrated;
  },
  /** Immutable update: mutate the draft, it becomes the new state. */
  update(mutator: (draft: Database) => void) {
    const draft = structuredClone(state);
    mutator(draft);
    state = draft;
    persist();
    emit();
  },
  reset() {
    state = createSeed();
    persist();
    emit();
  },
  exportJson(): string {
    return JSON.stringify(state, null, 2);
  },
  importJson(json: string) {
    state = migrate(JSON.parse(json));
    persist();
    emit();
  },
};
