"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { removeEntity, upsertEntity } from "@/shared/services/core";
import { slugify, uid } from "@/lib/utils";
import { CrudManager } from "@/admin/components/CrudManager";
import { StatusBadge } from "@/admin/components/ui";
import { Media } from "@/shared/components/Media";
import type { Category } from "@/types";

export default function CategoriesAdminPage() {
  const d = useDb();
  const { t, L } = useI18n();
  return (
    <CrudManager<Category>
      title={t("admin.nav.categories")}
      sub={t("admin.categories.sub")}
      items={[...d.categories].sort((a, b) => a.sort - b.sort)}
      search={(c) => `${c.name.en} ${c.name.ar} ${c.slug}`}
      readPerm="products.read"
      writePerm="products.update"
      deletePerm="products.delete"
      newItem={() => ({ id: uid("cat"), slug: "", name: { en: "", ar: "" }, description: { en: "", ar: "" }, sort: d.categories.length, active: true })}
      validate={(c) => (!c.name.en.trim() ? t("admin.required") : d.categories.some((x) => x.id !== c.id && x.slug === slugify(c.slug || c.name.en)) ? t("admin.products.slugTaken") : null)}
      onSave={(c) => upsertEntity("categories", { ...c, slug: slugify(c.slug || c.name.en) })}
      onDelete={(c) => {
        if (d.products.some((p) => p.categoryIds.includes(c.id))) return false;
        removeEntity("categories", c.id);
      }}
      fields={[
        { key: "name", label: t("admin.f.name"), type: "localized", span2: true },
        { key: "slug", label: t("admin.f.slug"), type: "text", hint: t("admin.f.slugHint") },
        { key: "parentId", label: t("admin.f.parent"), type: "select", options: [{ value: "", label: "—" }, ...d.categories.map((c) => ({ value: c.id, label: c.name.en }))] },
        { key: "description", label: t("admin.f.description"), type: "localizedText" },
        { key: "mediaId", label: t("admin.f.image"), type: "media" },
        { key: "sort", label: t("admin.f.sort"), type: "number" },
        { key: "active", label: t("admin.f.active"), type: "toggle" },
      ]}
      columns={[
        { label: t("admin.f.name"), render: (c) => <span className="cell-main"><span className="thumb"><Media mediaId={c.mediaId} kind="category" /></span><span><b>{L(c.name)}</b><small>/{c.slug}</small></span></span> },
        { label: t("admin.nav.products"), num: true, render: (c) => d.products.filter((p) => p.categoryIds.includes(c.id)).length },
        { label: t("admin.f.sort"), num: true, render: (c) => c.sort },
        { label: t("admin.f.status"), render: (c) => <StatusBadge value={c.active ? "active" : "inactive"} /> },
      ]}
    />
  );
}
