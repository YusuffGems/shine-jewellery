/* Mock database (browser), persisted to localStorage + shared online copy (cloudSync.ts). */
import type { Database } from "@/types";
import { SEED, createSeed } from "./seed";

const STORAGE_KEY = "shine.db.v1";
type Listener = () => void;

let state: Database = SEED;
let hydrated = false;
const listeners = new Set<Listener>();
const errorListeners = new Set<(msg: string) => void>();
const writeListeners = new Set<Listener>();
const notifyWrite = () => writeListeners.forEach((l) => l());

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
        /* ignore */
      }
    });
  },
  isHydrated() {
    return hydrated;
  },
  update(mutator: (draft: Database) => void) {
    const draft = structuredClone(state);
    mutator(draft);
    state = draft;
    persist();
    emit();
    notifyWrite();
  },
  onWrite(listener: Listener): () => void {
    writeListeners.add(listener);
    return () => writeListeners.delete(listener);
  },
  applyRemote(remote: Partial<Database>) {
    const local = state;
    const merged = migrate({ ...local, ...remote, session: local.session } as Partial<Database>);
    if (merged.adminUsers) {
      merged.adminUsers = merged.adminUsers.map((u) => (u.passwordHash ? u : { ...u, passwordHash: local.adminUsers.find((x) => x.id === u.id)?.passwordHash ?? "" }));
    }
    if (merged.customers) {
      merged.customers = merged.customers.map((c) => (c.passwordHash ? c : { ...c, passwordHash: local.customers.find((x) => x.id === c.id)?.passwordHash ?? "" }));
    }
    state = merged;
    persist();
    emit();
  },
  syncPayload(): Partial<Database> {
    const { session: _s, ...rest } = state;
    return rest;
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
    state = migrate({ ...JSON.parse(json), session: state.session });
    persist();
    emit();
    notifyWrite();
  },
};