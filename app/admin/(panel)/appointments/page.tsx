"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { setAppointmentStatus } from "@/admin/services/content";
import { CrudManager } from "@/admin/components/CrudManager";
import { StatusBadge } from "@/admin/components/ui";
import type { Appointment } from "@/types";

export default function AppointmentsAdminPage() {
  const d = useDb();
  const { t, L, date } = useI18n();
  const { user } = useAdmin();
  return (
    <CrudManager<Appointment>
      title={t("admin.nav.appointments")}
      sub={t("admin.appointments.sub")}
      items={d.appointments.filter((a) => !user?.branchId || a.branchId === user.branchId)}
      search={(a) => `${a.name} ${a.email} ${a.phone} ${a.service}`}
      readPerm="appointments.read"
      writePerm="appointments.update"
      onSave={(a) => setAppointmentStatus(a.id, a.status)}
      fields={[
        { key: "status", label: t("admin.f.status"), type: "select", options: (["requested", "confirmed", "completed", "cancelled"] as const).map((s) => ({ value: s, label: t(`apt.${s}`) })) },
        { key: "service", label: t("appointment.step.service"), type: "text", readOnly: true },
        { key: "date", label: t("appointment.step.date"), type: "text", readOnly: true },
        { key: "time", label: t("appointment.step.time"), type: "text", readOnly: true },
        { key: "name", label: t("forms.name"), type: "text", readOnly: true },
        { key: "phone", label: t("forms.phone"), type: "text", readOnly: true },
        { key: "email", label: t("forms.email"), type: "text", readOnly: true },
        { key: "notes", label: t("forms.notes"), type: "textarea", span2: true, readOnly: true },
      ]}
      rowActions={(a) => (a.status === "requested" ? <button className="btn btn--sm" onClick={() => setAppointmentStatus(a.id, "confirmed")}>{t("admin.appointments.confirm")}</button> : null)}
      columns={[
        { label: t("appointment.step.date"), render: (a) => <span className="ltr">{a.date} {a.time}</span> },
        { label: t("appointment.step.showroom"), render: (a) => L(d.branches.find((b) => b.id === a.branchId)?.name) },
        { label: t("appointment.step.service"), render: (a) => a.service },
        { label: t("admin.orders.customer"), render: (a) => <span>{a.name}<br /><small className="muted ltr">{a.phone}</small></span> },
        { label: t("admin.appointments.requestedAt"), render: (a) => date(a.createdAt, true) },
        { label: t("admin.f.status"), render: (a) => <StatusBadge value={a.status} label={t(`apt.${a.status}`)} /> },
      ]}
    />
  );
}
