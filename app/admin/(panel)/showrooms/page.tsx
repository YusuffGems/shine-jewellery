"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { removeEntity, upsertEntity } from "@/shared/services/core";
import { db } from "@/lib/store/db";
import { uid } from "@/lib/utils";
import { APPOINTMENT_SERVICES } from "@/config/site";
import { CrudManager } from "@/admin/components/CrudManager";
import { StatusBadge } from "@/admin/components/ui";
import { Media } from "@/shared/components/Media";
import type { Branch } from "@/types";

export default function ShowroomsAdminPage() {
  const d = useDb();
  const { t, L } = useI18n();
  return (
    <CrudManager<Branch>
      title={t("admin.nav.showrooms")}
      sub={t("admin.showrooms.sub")}
      items={[...d.branches].sort((a, b) => a.sort - b.sort)}
      search={(b) => `${b.name.en} ${b.name.ar} ${b.zone} ${b.area} ${b.city}`}
      readPerm="branches.read"
      writePerm="branches.update"
      newItem={() => ({ id: uid("br"), name: { en: "", ar: "" }, address: { en: "", ar: "" }, zone: "", area: "", city: "Doha", landmark: "", phone: "", whatsapp: "", mapUrl: "", hours: { en: "", ar: "" }, imageIds: [], services: [...APPOINTMENT_SERVICES], active: true, sort: d.branches.length + 1 })}
      validate={(b) => (!b.name.en.trim() ? t("admin.required") : null)}
      onSave={(b) => {
        upsertEntity("branches", b);
        // New branches get inventory rows so stock can be assigned immediately.
        db.update((x) => {
          for (const p of x.products) if (!x.inventory.some((r) => r.productId === p.id && r.branchId === b.id)) x.inventory.push({ id: uid("inv"), productId: p.id, branchId: b.id, total: 0, reserved: 0, sold: 0, returned: 0, damaged: 0, transferred: 0 });
        });
      }}
      onDelete={(b) => {
        if (d.inventory.some((r) => r.branchId === b.id && r.total - r.sold > 0)) return false;
        removeEntity("branches", b.id);
      }}
      fields={[
        { key: "name", label: t("admin.f.name"), type: "localized", span2: true },
        { key: "address", label: t("admin.showrooms.address"), type: "localizedText" },
        { key: "zone", label: t("address.zone"), type: "text" },
        { key: "area", label: t("address.area"), type: "text" },
        { key: "city", label: t("address.city"), type: "text" },
        { key: "landmark", label: t("address.landmark"), type: "text" },
        { key: "phone", label: t("forms.phone"), type: "text" },
        { key: "whatsapp", label: "WhatsApp", type: "text" },
        { key: "mapUrl", label: t("admin.showrooms.mapUrl"), type: "text", span2: true },
        { key: "lat", label: t("admin.showrooms.lat"), type: "number" },
        { key: "lng", label: t("admin.showrooms.lng"), type: "number" },
        { key: "hours", label: t("admin.showrooms.hours"), type: "localized", span2: true },
        { key: "services", label: t("admin.showrooms.services"), type: "multiselect", span2: true, options: APPOINTMENT_SERVICES.map((s) => ({ value: s, label: s })) },
        { key: "imageIds", label: t("admin.f.images"), type: "mediaList", span2: true },
        { key: "videoId", label: t("admin.f.heroVideo"), type: "video" },
        { key: "sort", label: t("admin.f.sort"), type: "number" },
        { key: "active", label: t("admin.f.active"), type: "toggle" },
      ]}
      columns={[
        { label: t("admin.f.name"), render: (b) => <span className="cell-main"><span className="thumb"><Media mediaId={b.imageIds[0]} kind="showroom" /></span><span><b>{L(b.name)}</b><small>{[b.zone, b.area, b.city].filter(Boolean).join(" · ")}</small></span></span> },
        { label: t("forms.phone"), render: (b) => <span className="ltr">{b.phone || "—"}</span> },
        { label: t("admin.inventory.available"), num: true, render: (b) => d.inventory.filter((r) => r.branchId === b.id).reduce((s, r) => s + Math.max(0, r.total - r.reserved - r.sold - r.damaged - r.transferred + r.returned), 0) },
        { label: t("admin.f.status"), render: (b) => <StatusBadge value={b.active ? "active" : "inactive"} /> },
      ]}
    />
  );
}
