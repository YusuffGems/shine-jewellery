/* SERVER ONLY — shared online copy of the store data (Vercel Blob). */
import { del, list, put } from "@vercel/blob";
import type { Database } from "@/types";

const PREFIX = "shine-data/";
const KEEP = 5;

export const cloudEnabled = () => !!process.env.BLOB_READ_WRITE_TOKEN;

async function snapshots() {
  const out: { url: string; uploadedAt: Date }[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: PREFIX, cursor, limit: 1000 });
    out.push(...page.blobs.map((b) => ({ url: b.url, uploadedAt: new Date(b.uploadedAt) })));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return out.sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
}

export async function readCloud(): Promise<Partial<Database> | null> {
  const [latest] = await snapshots();
  if (!latest) return null;
  const res = await fetch(latest.url, { cache: "no-store" });
  if (!res.ok) return null;
  return (await res.json()) as Partial<Database>;
}

export async function writeCloud(data: Partial<Database>): Promise<void> {
  await put(`${PREFIX}db-${Date.now()}.json`, JSON.stringify(data), {
    access: "public",
    addRandomSuffix: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
  const all = await snapshots();
  const old = all.slice(KEEP).map((b) => b.url);
  if (old.length) await del(old).catch(() => undefined);
}