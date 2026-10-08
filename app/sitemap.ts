import type { MetadataRoute } from "next";
import { SITE } from "@/config/site";
import { SEED } from "@/lib/store/seed";

/** Mock mode lists seed content; API mode should query the database here. */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const statics = ["", "/collections/all", "/showrooms", "/appointment", "/personalise", "/gold-rate", "/faq"];
  return [
    ...statics.map((p) => ({ url: `${SITE.url}${p}`, lastModified: now })),
    ...SEED.categories.filter((c) => c.active).map((c) => ({ url: `${SITE.url}/collections/${c.slug}`, lastModified: now })),
    ...SEED.collections.filter((c) => c.active).map((c) => ({ url: `${SITE.url}/collections/${c.slug}`, lastModified: now })),
    ...SEED.products.filter((p) => p.status === "active").map((p) => ({ url: `${SITE.url}/product/${p.slug}`, lastModified: new Date(p.createdAt) })),
    ...SEED.cms.pages.filter((p) => p.active).map((p) => ({ url: `${SITE.url}/pages/${p.slug}`, lastModified: now })),
  ];
}
