/* ADMIN APP — media library management: replace, edit, duplicate, delete, usage lookup. */
import { db } from "@/lib/store/db";
import { nowIso, uid } from "@/lib/utils";
import { writeAudit } from "@/shared/services/core";
import { deleteBlob, isIdbUrl, putBlob, resolveUrl } from "@/lib/media/blobStore";
import type { Database, MediaAsset } from "@/types";
import { IMAGE_TYPES, VIDEO_TYPES, storeFile } from "@/shared/services/media";

/** Replace the file behind an asset — every page referencing it updates instantly. */
export async function replaceFile(assetId: string, file: File): Promise<boolean> {
  const asset = db.get().media.find((m) => m.id === assetId);
  if (!asset) return false;
  const ok = asset.type === "image" ? IMAGE_TYPES.includes(file.type) : VIDEO_TYPES.includes(file.type);
  if (!ok) return false;
  await deleteBlob(asset.url);
  const url = await storeFile(asset.id, file, asset.type === "image");
  db.update((d) => {
    const a = d.media.find((m) => m.id === assetId);
    if (!a) return;
    a.url = url;
    a.mime = file.type;
    a.size = file.size;
    writeAudit(d, "replace", "media", assetId, undefined, file.name);
  });
  return true;
}

export function updateAsset(asset: MediaAsset) {
  db.update((d) => {
    const i = d.media.findIndex((m) => m.id === asset.id);
    if (i < 0) return;
    writeAudit(d, "update", "media", asset.id, { title: d.media[i].title }, { title: asset.title });
    d.media[i] = asset;
  });
}

export async function duplicateAsset(id: string) {
  const a = db.get().media.find((m) => m.id === id);
  if (!a) return;
  const newId = uid(a.type === "image" ? "m" : "v");
  let url = a.url;
  if (isIdbUrl(a.url)) {
    const blob = await (await fetch(await resolveUrl(a.url))).blob();
    url = await putBlob(newId, blob);
  }
  db.update((d) => {
    d.media.unshift({ ...structuredClone(a), id: newId, url, title: `${a.title} (copy)`, createdAt: nowIso() });
  });
}

/** Where is an asset used? Prevents deleting media that would leave empty slots. */
export function usagesOf(d: Database, id: string): string[] {
  const out: string[] = [];
  d.products.forEach((p) => (p.imageIds.includes(id) || p.videoIds.includes(id)) && out.push(`Product: ${p.name.en}`));
  d.collections.forEach((c) => [c.heroMediaId, c.heroVideoId, c.thumbnailId].includes(id) && out.push(`Collection: ${c.name.en}`));
  d.categories.forEach((c) => c.mediaId === id && out.push(`Category: ${c.name.en}`));
  d.cms.sections.forEach((s) => [s.mediaId, s.mobileMediaId, s.videoId].includes(id) && out.push(`Homepage: ${s.type}`));
  d.cms.navigation.forEach((n) => n.featuredMediaId === id && out.push(`Menu: ${n.label.en}`));
  d.branches.forEach((b) => (b.imageIds.includes(id) || b.videoId === id) && out.push(`Showroom: ${b.name.en}`));
  (d.banners ?? []).forEach((b) => [b.mediaId, b.mobileMediaId, b.videoId].includes(id) && out.push(`Banner: ${b.title.en}`));
  d.themes.forEach((t) => [t.tokens.logoMediaId, t.tokens.logoDarkMediaId, t.tokens.faviconMediaId].includes(id) && out.push(`Theme: ${t.name}`));
  return out;
}

export function deleteAsset(id: string, force = false): { ok: boolean; usages: string[] } {
  const usages = usagesOf(db.get(), id);
  if (usages.length && !force) return { ok: false, usages };
  db.update((d) => {
    const a = d.media.find((m) => m.id === id);
    void deleteBlob(a?.url);
    d.media = d.media.filter((m) => m.id !== id);
    d.products.forEach((p) => {
      p.imageIds = p.imageIds.filter((x) => x !== id);
      p.videoIds = p.videoIds.filter((x) => x !== id);
    });
    writeAudit(d, "delete", "media", id, a?.title);
  });
  return { ok: true, usages };
}
