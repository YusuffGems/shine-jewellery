/* Media upload + storage shared by both apps (admin library, customer reference uploads). */
import { db } from "@/lib/store/db";
import { nowIso, uid } from "@/lib/utils";
import { writeAudit } from "@/shared/services/core";
import { dataUrlToBlob, putBlob } from "@/lib/media/blobStore";
import type { MediaAsset, MediaFolder } from "@/types";

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"];

export const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];

export const FOLDERS: MediaFolder[] = ["Homepage", "Products", "Collections", "Campaigns", "Banners", "Videos", "Showrooms", "Blog", "Social", "Certificates"];

const MAX_IMAGE_EDGE = 2400;

/**
 * Raster images are downscaled (max 2400px) and re-encoded to WebP to keep the library fast.
 * Files are saved in IndexedDB (lib/media/blobStore.ts), never in localStorage — so uploads
 * are limited only by the browser's disk quota, not the 5 MB localStorage limit.
 */
async function readImage(file: File): Promise<Blob> {
  if (file.type === "image/svg+xml") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", 0.86));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file; // e.g. AVIF on browsers that can't decode it — store the original
  }
}

export async function storeFile(id: string, file: File, isImage: boolean): Promise<string> {
  return putBlob(id, isImage ? await readImage(file) : file);
}

export async function uploadFiles(files: FileList | File[], folder: MediaFolder): Promise<{ ids: string[]; rejected: string[] }> {
  const ids: string[] = [];
  const rejected: string[] = [];
  const assets: MediaAsset[] = [];
  for (const file of Array.from(files)) {
    const isImage = IMAGE_TYPES.includes(file.type);
    const isVideo = VIDEO_TYPES.includes(file.type);
    if (!isImage && !isVideo) {
      rejected.push(file.name);
      continue;
    }
    const id = uid(isImage ? "m" : "v");
    let url: string;
    try {
      url = await storeFile(id, file, isImage);
    } catch {
      rejected.push(`${file.name} (storage full)`);
      continue;
    }
    const title = file.name.replace(/\.[^.]+$/, "");
    assets.push({
      id, type: isImage ? "image" : "video", title, alt: { en: title, ar: "" }, folder, tags: [], url,
      placeholder: isImage ? "product" : "video", mime: file.type, size: file.size, status: "active", sort: 0, createdAt: nowIso(),
      ...(isVideo ? { autoplay: true, muted: true, loop: true, controls: false } : {}),
    });
    ids.push(id);
  }
  if (assets.length)
    db.update((d) => {
      d.media.unshift(...assets);
      assets.forEach((a) => writeAudit(d, "upload", "media", a.id, undefined, { title: a.title, folder: a.folder }));
    });
  return { ids, rejected };
}

/**
 * One-time migration: uploads saved by the first version as data: URLs inside localStorage
 * are moved into IndexedDB, which frees localStorage and fixes "Browser storage is full".
 */
export async function migrateInlineMedia(): Promise<number> {
  const inline = db.get().media.filter((m) => m.url.startsWith("data:") || m.url.startsWith("blob:"));
  if (!inline.length) return 0;
  const moved: Record<string, string> = {};
  for (const m of inline) {
    if (m.url.startsWith("blob:")) {
      moved[m.id] = ""; // session-only links from v1 can't be recovered; slot falls back to placeholder
      continue;
    }
    try {
      moved[m.id] = await putBlob(m.id, await dataUrlToBlob(m.url));
    } catch {
      /* leave as-is if IndexedDB is unavailable */
    }
  }
  db.update((d) => {
    d.media.forEach((m) => {
      if (m.id in moved) m.url = moved[m.id];
    });
  });
  return Object.keys(moved).length;
}
