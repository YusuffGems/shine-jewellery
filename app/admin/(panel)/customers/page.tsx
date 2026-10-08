"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { CrudManager } from "@/admin/components/CrudManager";
import type { Customer } from "@/types";

/** Customer list (read-only for privacy; customers manage their own profile). Password hashes are never shown. */
export default function CustomersAdminPage() {
  const d = useDb();
  const { t, money, date } = useI18n();
  const stats = (c: Customer) => {
    const orders = d.orders.filter((o) => o.customerId === c.id && o.payment.status === "succeeded");
    return { count: orders.length, spend: orders.reduce((s, o) => s + o.total, 0) };
  };
  return (
    <CrudManager<Customer>
      title={t("admin.nav.customers")}
      sub={t("admin.customers.sub")}
      items={d.customers}
      search={(c) => `${c.name} ${c.email} ${c.phone}`}
      readPerm="customers.read"
      writePerm="users.update"
      onSave={() => undefined}
      fields={[
        { key: "name", label: t("forms.name"), type: "text", readOnly: true },
        { key: "email", label: t("forms.email"), type: "text", readOnly: true },
        { key: "phone", label: t("forms.phone"), type: "text", readOnly: true },
        { key: "createdAt", label: t("admin.customers.joined"), type: "text", readOnly: true },
      ]}
      columns={[
        { label: t("forms.name"), render: (c) => <span>{c.name}{c.isDemo ? <span className="badge" style={{ marginInlineStart: 6 }}>demo</span> : null}<br /><small className="muted">{c.email}</small></span> },
        { label: t("forms.phone"), render: (c) => <span className="ltr">{c.phone || "—"}</span> },
        { label: t("account.tab.addresses"), num: true, render: (c) => c.addresses.length },
        { label: t("account.tab.orders"), num: true, render: (c) => stats(c).count },
        { label: t("admin.customers.spend"), num: true, render: (c) => money(stats(c).spend) },
        { label: t("admin.customers.joined"), render: (c) => date(c.createdAt) },
      ]}
    />
  );
}
