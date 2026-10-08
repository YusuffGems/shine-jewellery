"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { removeEntity, upsertEntity } from "@/shared/services/core";
import { uid } from "@/lib/utils";
import { CrudManager } from "@/admin/components/CrudManager";
import { StatusBadge } from "@/admin/components/ui";
import type { Coupon } from "@/types";

export default function CouponsAdminPage() {
  const d = useDb();
  const { t, money } = useI18n();
  return (
    <CrudManager<Coupon>
      title={t("admin.nav.coupons")}
      sub={t("admin.coupons.sub")}
      items={d.coupons}
      search={(c) => c.code}
      readPerm="coupons.read"
      writePerm="coupons.update"
      newItem={() => ({ id: uid("cp"), code: "", type: "percent", value: 5, minSubtotal: 0, usageLimit: 0, used: 0, active: true })}
      validate={(c) => (!/^[A-Z0-9_-]{3,24}$/i.test(c.code) ? t("admin.coupons.invalidCode") : d.coupons.some((x) => x.id !== c.id && x.code.toUpperCase() === c.code.toUpperCase()) ? t("admin.coupons.exists") : c.value <= 0 ? t("admin.required") : null)}
      onSave={(c) => upsertEntity("coupons", { ...c, code: c.code.toUpperCase() })}
      onDelete={(c) => removeEntity("coupons", c.id)}
      fields={[
        { key: "code", label: t("admin.coupons.code"), type: "text" },
        { key: "type", label: t("admin.coupons.type"), type: "select", options: [{ value: "percent", label: "%" }, { value: "fixed", label: "QAR" }] },
        { key: "value", label: t("admin.coupons.value"), type: "number" },
        { key: "minSubtotal", label: t("admin.coupons.min"), type: "number" },
        { key: "usageLimit", label: t("admin.coupons.limit"), type: "number", hint: t("admin.coupons.limitHint") },
        { key: "active", label: t("admin.f.active"), type: "toggle" },
      ]}
      columns={[
        { label: t("admin.coupons.code"), render: (c) => <b className="ltr" style={{ fontWeight: 600 }}>{c.code}</b> },
        { label: t("admin.coupons.value"), render: (c) => (c.type === "percent" ? `${c.value}%` : money(c.value)) },
        { label: t("admin.coupons.min"), num: true, render: (c) => money(c.minSubtotal) },
        { label: t("admin.coupons.used"), num: true, render: (c) => `${c.used}${c.usageLimit ? ` / ${c.usageLimit}` : ""}` },
        { label: t("admin.f.status"), render: (c) => <StatusBadge value={c.active ? "active" : "inactive"} /> },
      ]}
    />
  );
}
