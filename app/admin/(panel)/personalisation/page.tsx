"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { setPersonalisationStatus } from "@/admin/services/content";
import { CrudManager } from "@/admin/components/CrudManager";
import { StatusBadge } from "@/admin/components/ui";
import { Media } from "@/shared/components/Media";
import type { PersonalisationRequest } from "@/types";

export default function PersonalisationAdminPage() {
  const d = useDb();
  const { t, date } = useI18n();
  return (
    <CrudManager<PersonalisationRequest>
      title={t("admin.nav.personalisation")}
      sub={t("admin.personalisation.sub")}
      items={d.personalisation}
      search={(p) => `${p.name} ${p.email} ${p.text} ${p.type}`}
      readPerm="appointments.read"
      writePerm="appointments.update"
      onSave={(p) => setPersonalisationStatus(p.id, p.status)}
      editorExtra={(p) => (p.referenceMediaId ? <div style={{ maxWidth: 220 }}><span className="label">{t("personalise.reference")}</span><Media mediaId={p.referenceMediaId} ratio="1" /></div> : null)}
      fields={[
        { key: "status", label: t("admin.f.status"), type: "select", options: ["new", "in_review", "quoted", "closed"].map((s) => ({ value: s, label: s.replace("_", " ") })) },
        { key: "type", label: t("admin.coupons.type"), type: "text", readOnly: true },
        { key: "text", label: t("personalise.textToEngrave"), type: "text", readOnly: true, span2: true },
        { key: "notes", label: t("forms.notes"), type: "textarea", readOnly: true, span2: true },
        { key: "name", label: t("forms.name"), type: "text", readOnly: true },
        { key: "phone", label: t("forms.phone"), type: "text", readOnly: true },
        { key: "email", label: t("forms.email"), type: "text", readOnly: true },
      ]}
      columns={[
        { label: t("order.col.date"), render: (p) => date(p.createdAt, true) },
        { label: t("admin.coupons.type"), render: (p) => p.type },
        { label: t("personalise.idea"), render: (p) => <span className="small">{p.text || p.notes.slice(0, 60)}</span> },
        { label: t("admin.orders.customer"), render: (p) => <span>{p.name}<br /><small className="muted">{p.email}</small></span> },
        { label: t("admin.f.status"), render: (p) => <StatusBadge value={p.status} /> },
      ]}
    />
  );
}
