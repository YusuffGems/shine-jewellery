/* ──────────────────────────────────────────────────────────────
   Uploaded photo/video files live in IndexedDB (large browser storage,
   hundreds of MB) — NOT in localStorage (~5 MB). The media record keeps
   only a reference: url = "idb:<key>". In API mode, files go to
   object storage / CDN and url is a normal https:// link instead.
   ────────────────────────────────────────────────────────────── */
const DB_NAME = "shine-media";
const STORE = "files";
export const IDB_PREFIX = "idb:";

let dbPromise: Promise<IDBDatabase> | null = null;
function open(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const req = run(db.transaction(STORE, mode).objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

export const isIdbUrl = (url?: string) => !!url && url.startsWith(IDB_PREFIX);
export const idbKey = (url: string) => url.slice(IDB_PREFIX.length);

export async function putBlob(key: string, blob: Blob): Promise<string> {
  await tx("readwrite", (s) => s.put(blob, key));
  urlCache.delete(key);
  return IDB_PREFIX + key;
}

export async function deleteBlob(url?: string) {
  if (!isIdbUrl(url)) return;
  const key = idbKey(url!);
  const cached = urlCache.get(key);
  if (cached) URL.revokeObjectURL(cached);
  urlCache.delete(key);
  await tx("readwrite", (s) => s.delete(key));
}

const urlCache = new Map<string, string>();
const pending = new Map<string, Promise<string>>();

/** Resolve "idb:key" → blob: object URL (cached). Normal URLs pass through. */
export function resolveUrl(url: string): Promise<string> {
  if (!isIdbUrl(url)) return Promise.resolve(url);
  const key = idbKey(url);
  const hit = urlCache.get(key);
  if (hit) return Promise.resolve(hit);
  if (!pending.has(key)) {
    pending.set(
      key,
      tx<Blob | undefined>("readonly", (s) => s.get(key) as IDBRequest<Blob | undefined>)
        .then((blob) => {
          const objUrl = blob ? URL.createObjectURL(blob) : "";
          if (objUrl) urlCache.set(key, objUrl);
          return objUrl;
        })
        .finally(() => pending.delete(key)),
    );
  }
  return pending.get(key)!;
}

export function cachedUrl(url: string): string | undefined {
  if (!isIdbUrl(url)) return url;
  return urlCache.get(idbKey(url));
}

/** data: URL → Blob (used to migrate older uploads out of localStorage). */
export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  return (await fetch(dataUrl)).blob();
}
