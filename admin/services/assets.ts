/* ADMIN APP — assign media to every visual slot on the website (logo, hero, banners, categories…).
   Each change is audit-logged. Files themselves are managed in admin/services/media.ts. */
import { db } from "@/lib/store/db";
import { writeAudit } from "@/shared/services/core";

export type AssetTarget =
  | { kind: "brand"; key: "logoMediaId" | "logoDarkMediaId" | "faviconMediaId" }
  | { kind: "section"; sectionId: string; field: "mediaId" | "mobileMediaId" | "videoId" }
  | { kind: "category"; id: string }
  | { kind: "collection"; id: string; field: "heroMediaId" | "heroVideoId" | "thumbnailId" }
  | { kind: "branch"; id: string; field: "image" | "videoId" }
  | { kind: "nav"; id: string }
  | { kind: "banner"; id: string; field: "mediaId" | "mobileMediaId" | "videoId" }
  | { kind: "product"; id: string; field: "imageIds" | "videoIds"; ids: string[] };

/** Set (or clear with undefined) the media used by one slot. */
export function assignMedia(target: AssetTarget, mediaId: string | undefined) {
  db.update((d) => {
    switch (target.kind) {
      case "brand":
        // Brand assets apply to every theme so switching themes keeps the logo.
        d.themes.forEach((t) => {
          t.tokens[target.key] = mediaId;
          if (t.draft) t.draft[target.key] = mediaId;
        });
        break;
      case "section": {
        const s = d.cms.sections.find((x) => x.id === target.sectionId);
        if (s) s[target.field] = mediaId;
        break;
      }
      case "category": {
        const c = d.categories.find((x) => x.id === target.id);
        if (c) c.mediaId = mediaId;
        break;
      }
      case "collection": {
        const c = d.collections.find((x) => x.id === target.id);
        if (c) c[target.field] = mediaId;
        break;
      }
      case "branch": {
        const b = d.branches.find((x) => x.id === target.id);
        if (!b) break;
        if (target.field === "videoId") b.videoId = mediaId;
        else b.imageIds = mediaId ? [mediaId, ...b.imageIds.slice(1)] : b.imageIds.slice(1);
        break;
      }
      case "nav": {
        const n = d.cms.navigation.find((x) => x.id === target.id);
        if (n) n.featuredMediaId = mediaId;
        break;
      }
      case "banner": {
        const b = d.banners.find((x) => x.id === target.id);
        if (b) b[target.field] = mediaId;
        break;
      }
      case "product": {
        const p = d.products.find((x) => x.id === target.id);
        if (p) p[target.field] = target.ids;
        break;
      }
    }
    writeAudit(d, "assign_media", target.kind, "id" in target ? target.id : "sectionId" in target ? target.sectionId : target.key, undefined, mediaId ?? ("ids" in target ? target.ids : null));
  });
}
