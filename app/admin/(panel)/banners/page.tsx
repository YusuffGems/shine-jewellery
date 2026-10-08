"use client";
/* ADMIN › Banners — promotional banners for the homepage, listing pages and product pages. */
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { removeEntity, upsertEntity } from "@/shared/services/core";
import { uid } from "@/lib/utils";
import { CrudManager } from "@/admin/components/CrudManager";
import { StatusBadge } from "@/admin/components/ui";
import { Media } from "@/shared/components/Media";
import type { PromoBanner } from "@/types";

export default function BannersAdminPage() {
  const d = useDb();
  const { t, L } = useI18n();
  const places = (["home", "listing", "product"] as const).map((p) => ({ value: p, label: t(`admin.banners.place.${p}`) }));
  return (
    <CrudManager<PromoBanner>
      title={t("admin.nav.banners")}
      sub={t("admin.banners.sub")}
      items={[...(d.banners ?? [])].sort((a, b) => a.sort - b.sort)}
      search={(b) => `${b.title.en} ${b.title.ar} ${b.placement}`}
      readPerm="cms.read"
      writePerm="cms.update"
      newItem={() => ({ id: uid("bn"), title: { en: "", ar: "" }, subtitle: { en: "", ar: "" }, ctaLabel: { en: "", ar: "" }, ctaHref: "", placement: "home", tone: "dark", active: true, sort: d.banners.length })}
      validate={(b) => (!b.title.en.trim() ? t("admin.required") : null)}
      onSave={(b) => upsertEntity("banners", b)}
      onDelete={(b) => removeEntity("banners", b.id)}
      fields={[
        { key: "title", label: t("admin.cms.heading"), type: "localized", span2: true },
        { key: "subtitle", label: t("admin.cms.body"), type: "localizedText" },
        { key: "ctaLabel", label: t("admin.cms.ctaLabel"), type: "localized", span2: true },
        { key: "ctaHref", label: t("admin.cms.ctaLink"), type: "text", hint: t("admin.cms.ctaHint") },
        { key: "placement", label: t("admin.banners.placement"), type: "select", options: places },
        { key: "tone", label: t("admin.banners.tone"), type: "select", options: [{ value: "dark", label: t("admin.banners.toneDark") }, { value: "light", label: t("admin.banners.toneLight") }] },
        { key: "sort", label: t("admin.f.sort"), type: "number" },
        { key: "mediaId", label: t("admin.cms.desktopImage"), type: "media" },
        { key: "mobileMediaId", label: t("admin.cms.mobileImage"), type: "media" },
        { key: "videoId", label: t("admin.cms.video"), type: "video", hint: t("admin.cms.videoHint") },
        { key: "active", label: t("admin.f.active"), type: "toggle" },
      ]}
      columns={[
        { label: t("admin.cms.heading"), render: (b) => <span className="cell-main"><span className="thumb"><Media mediaId={b.mediaId} kind="campaign" /></span><span><b>{L(b.title)}</b><small>{b.ctaHref}</small></span></span> },
        { label: t("admin.banners.placement"), render: (b) => t(`admin.banners.place.${b.placement}`) },
        { label: t("admin.f.status"), render: (b) => <StatusBadge value={b.active ? "active" : "inactive"} /> },
      ]}
    />
  );
}
