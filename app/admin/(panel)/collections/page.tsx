"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { db } from "@/lib/store/db";
import { removeEntity, upsertEntity } from "@/shared/services/core";
import { slugify, uid } from "@/lib/utils";
import { CrudManager } from "@/admin/components/CrudManager";
import { StatusBadge } from "@/admin/components/ui";
import { Media } from "@/shared/components/Media";
import type { Collection } from "@/types";

export default function CollectionsAdminPage() {
  const d = useDb();
  const { t, L } = useI18n();
  return (
    <CrudManager<Collection & { productIds?: string[] }>
      title={t("admin.nav.collections")}
      sub={t("admin.collections.sub")}
      items={[...d.collections].sort((a, b) => a.sort - b.sort).map((c) => ({ ...c, productIds: d.products.filter((p) => p.collectionIds.includes(c.id)).map((p) => p.id) }))}
      search={(c) => `${c.name.en} ${c.name.ar} ${c.slug}`}
      readPerm="products.read"
      writePerm="products.update"
      deletePerm="products.delete"
      newItem={() => ({ id: uid("col"), slug: "", name: { en: "", ar: "" }, description: { en: "", ar: "" }, seo: { title: "", description: "" }, sort: d.collections.length, active: true, productIds: [] })}
      validate={(c) => (!c.name.en.trim() ? t("admin.required") : null)}
      onSave={({ productIds = [], ...c }) => {
        upsertEntity("collections", { ...c, slug: slugify(c.slug || c.name.en) });
        db.update((x) => {
          x.products.forEach((p) => {
            const has = p.collectionIds.includes(c.id);
            const want = productIds.includes(p.id);
            if (want && !has) p.collectionIds.push(c.id);
            if (!want && has) p.collectionIds = p.collectionIds.filter((id) => id !== c.id);
          });
        });
      }}
      onDelete={(c) => {
        removeEntity("collections", c.id);
        db.update((x) => x.products.forEach((p) => (p.collectionIds = p.collectionIds.filter((id) => id !== c.id))));
      }}
      fields={[
        { key: "name", label: t("admin.f.name"), type: "localized", span2: true },
        { key: "slug", label: t("admin.f.slug"), type: "text", hint: t("admin.f.slugHint") },
        { key: "sort", label: t("admin.f.sort"), type: "number" },
        { key: "description", label: t("admin.f.description"), type: "localizedText" },
        { key: "heroMediaId", label: t("admin.f.heroImage"), type: "media" },
        { key: "heroVideoId", label: t("admin.f.heroVideo"), type: "video" },
        { key: "thumbnailId", label: t("admin.f.thumbnail"), type: "media" },
        { key: "active", label: t("admin.f.active"), type: "toggle" },
        { key: "productIds", label: t("admin.nav.products"), type: "multiselect", span2: true, options: d.products.map((p) => ({ value: p.id, label: p.name.en })) },
        { key: "seo.title", label: t("admin.f.seoTitle"), type: "text", span2: true },
        { key: "seo.description", label: t("admin.f.seoDescription"), type: "textarea", span2: true },
      ]}
      columns={[
        { label: t("admin.f.name"), render: (c) => <span className="cell-main"><span className="thumb"><Media mediaId={c.thumbnailId || c.heroMediaId} kind="collection" /></span><span><b>{L(c.name)}</b><small>/{c.slug}</small></span></span> },
        { label: t("admin.nav.products"), num: true, render: (c) => c.productIds?.length ?? 0 },
        { label: t("admin.f.status"), render: (c) => <StatusBadge value={c.active ? "active" : "inactive"} /> },
      ]}
    />
  );
}
