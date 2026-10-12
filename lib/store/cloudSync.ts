/* Shared online data (browser side). Turns on by itself when Vercel Blob is connected. */
import { db } from "./db";
import { getBlob, isIdbUrl } from "@/lib/media/blobStore";

const TOKEN_KEY = "shine.admin.cloudToken";
const PUSH_DELAY = 1200;

type Status = "unknown" | "on" | "off";
let status: Status = "unknown";
let pushTimer: ReturnType<typeof setTimeout> | undefined;
let pushing = false;
let pushAgain = false;
const statusListeners = new Set<(s: SyncState) => void>();

export type SyncState = { enabled: Status; saving: boolean; lastSavedAt?: string; error?: string };
let syncState: SyncState = { enabled: "unknown", saving: false };
function setSync(patch: Partial<SyncState>) {
  syncState = { ...syncState, ...patch };
  statusListeners.forEach((l) => l(syncState));
}
export const getSyncState = () => syncState;
export function onSyncState(l: (s: SyncState) => void) {
  statusListeners.add(l);
  return () => statusListeners.delete(l);
}

export function cloudToken(): string | null {
  try { return window.localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
function setToken(token: string | null) {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch { /* private mode */ }
}
const authHeaders = (): Record<string, string> => {
  const t = cloudToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
};

export const cloudOn = () => status === "on";

export async function pullCloud(): Promise<{ enabled: boolean; hasData: boolean }> {
  try {
    const res = await fetch("/api/data", { headers: authHeaders(), cache: "no-store" });
    const body = (await res.json()) as { enabled: boolean; data?: Record<string, unknown> | null };
    status = body.enabled ? "on" : "off";
    setSync({ enabled: status });
    if (body.enabled && body.data) {
      db.applyRemote(body.data);
      return { enabled: true, hasData: true };
    }
    return { enabled: !!body.enabled, hasData: false };
  } catch {
    return { enabled: false, hasData: false };
  }
}

export async function pushCloud(): Promise<boolean> {
  if (status !== "on" || !cloudToken()) return false;
  if (pushing) { pushAgain = true; return true; }
  pushing = true;
  setSync({ saving: true, error: undefined });
  try {
    const res = await fetch("/api/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      body: JSON.stringify(db.syncPayload()),
    });
    if (res.status === 401) {
      setToken(null);
      setSync({ saving: false, error: "signed_out" });
      return false;
    }
    if (!res.ok) throw new Error(String(res.status));
    setSync({ saving: false, lastSavedAt: new Date().toISOString() });
    return true;
  } catch {
    setSync({ saving: false, error: "save_failed" });
    return false;
  } finally {
    pushing = false;
    if (pushAgain) { pushAgain = false; schedulePush(); }
  }
}

function schedulePush() {
  if (status !== "on" || !cloudToken()) return;
  clearTimeout(pushTimer);
  pushTimer = setTimeout(() => void pushCloud(), PUSH_DELAY);
}

export async function uploadToCloud(id: string, file: Blob, name: string): Promise<string | null> {
  const token = cloudToken();
  if (status !== "on" || !token) return null;
  const { upload } = await import("@vercel/blob/client");
  const safe = name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-+|-+$/g, "") || "file";
  const result = await upload(`media/${id}-${safe}`, file, { access: "public", handleUploadUrl: "/api/media/upload", clientPayload: token, multipart: file.size > 8 * 1024 * 1024 });
  return result.url;
}

async function moveLocalUploads() {
  const local = db.get().media.filter((m) => isIdbUrl(m.url));
  if (!local.length) return;
  const moved: Record<string, string> = {};
  for (const m of local) {
    try {
      const blob = await getBlob(m.url);
      if (!blob) continue;
      const ext = (blob.type.split("/")[1] || (m.type === "video" ? "mp4" : "webp")).replace("quicktime", "mov").replace("svg+xml", "svg");
      const url = await uploadToCloud(m.id, blob, `${m.title || m.id}.${ext}`);
      if (url) moved[m.id] = url;
    } catch { /* keep it local */ }
  }
  if (Object.keys(moved).length)
    db.update((d) => {
      d.media.forEach((m) => { if (moved[m.id]) m.url = moved[m.id]; });
    });
}

export async function cloudLogin(email: string, password: string): Promise<{ result: "ok" | "invalid" | "inactive" | "off"; user?: { id: string } & Record<string, unknown>; firstRun?: boolean }> {
  try {
    const res = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    if (res.status === 503) return { result: "off" };
    const body = (await res.json()) as { ok?: boolean; token?: string; user?: { id: string } & Record<string, unknown>; firstRun?: boolean; error?: string };
    if (!res.ok || !body.token) return { result: body.error === "inactive" ? "inactive" : "invalid" };
    setToken(body.token);
    status = "on";
    setSync({ enabled: "on" });
    return { result: "ok", user: body.user, firstRun: body.firstRun };
  } catch {
    return { result: "off" };
  }
}

export async function afterAdminLogin(firstRun: boolean) {
  if (!firstRun) await pullCloud();
  await moveLocalUploads();
  await pushCloud();
}

export function cloudLogout() {
  setToken(null);
}

let started = false;
export function startCloudSync() {
  if (started || typeof window === "undefined") return;
  started = true;
  db.onWrite(schedulePush);
  void pullCloud();
  window.addEventListener("beforeunload", () => {
    if (pushTimer && cloudToken() && status === "on") {
      clearTimeout(pushTimer);
      void fetch("/api/data", { method: "PUT", keepalive: true, headers: { "Content-Type": "application/json", ...authHeaders() }, body: JSON.stringify(db.syncPayload()) });
    }
  });
}