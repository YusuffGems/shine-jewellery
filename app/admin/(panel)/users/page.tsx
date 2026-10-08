"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { removeEntity, upsertEntity } from "@/shared/services/core";
import { setAdminPassword } from "@/admin/services/auth";
import { ADMIN_ROLES } from "@/lib/auth/rbac";
import { isEmail, uid } from "@/lib/utils";
import { CrudManager } from "@/admin/components/CrudManager";
import { StatusBadge } from "@/admin/components/ui";
import { useToast } from "@/shared/components/Toast";
import type { AdminUser } from "@/types";

export default function UsersAdminPage() {
  const d = useDb();
  const { t, date } = useI18n();
  const { user, can } = useAdmin();
  const toast = useToast();
  return (
    <>
      <CrudManager<AdminUser>
        title={t("admin.nav.users")}
        sub={t("admin.users.sub")}
        items={d.adminUsers}
        search={(u) => `${u.name} ${u.email} ${u.role}`}
        readPerm="users.read"
        writePerm="users.update"
        newItem={() => ({ id: uid("adm"), name: "", email: "", passwordHash: "", role: "CONTENT_MANAGER", active: true, failedAttempts: 0 })}
        validate={(u) => {
          if (!u.name.trim() || !isEmail(u.email)) return t("admin.required");
          if (d.adminUsers.some((x) => x.id !== u.id && x.email === u.email.toLowerCase())) return t("admin.users.exists");
          if (u.role === "SUPER_ADMIN" && !can("roles.update")) return t("admin.users.superOnly");
          if (u.id === user?.id && (!u.active || u.role !== user.role)) return t("admin.users.notSelf");
          return null;
        }}
        onSave={(u) => {
          upsertEntity("adminUsers", { ...u, email: u.email.toLowerCase(), branchId: u.role === "BRANCH_MANAGER" ? u.branchId : undefined });
          if (!u.passwordHash) toast(t("admin.users.setPassword"));
        }}
        onDelete={(u) => (u.id === user?.id ? false : removeEntity("adminUsers", u.id))}
        rowActions={(u) => (can("users.update") ? (
          <button className="btn btn--secondary btn--sm" onClick={async () => {
            const pw = window.prompt(t("admin.users.newPassword"));
            if (!pw) return;
            toast((await setAdminPassword(u.id, pw)) ? t("common.saved") : t("auth.error.weak_password"), "default");
          }}>{t("admin.users.password")}</button>
        ) : null)}
        fields={[
          { key: "name", label: t("forms.name"), type: "text" },
          { key: "email", label: t("forms.email"), type: "text" },
          { key: "role", label: t("admin.users.role"), type: "select", options: ADMIN_ROLES.map((r) => ({ value: r, label: t(`role.${r}`) })) },
          { key: "branchId", label: t("admin.users.branch"), type: "select", hint: t("admin.users.branchHint"), options: [{ value: "", label: "—" }, ...d.branches.map((b) => ({ value: b.id, label: b.name.en }))] },
          { key: "active", label: t("admin.f.active"), type: "toggle" },
        ]}
        columns={[
          { label: t("forms.name"), render: (u) => <span>{u.name}<br /><small className="muted">{u.email}</small></span> },
          { label: t("admin.users.role"), render: (u) => t(`role.${u.role}`) },
          { label: t("admin.users.lastLogin"), render: (u) => (u.lastLoginAt ? date(u.lastLoginAt, true) : "—") },
          { label: t("admin.f.status"), render: (u) => <StatusBadge value={u.lockedUntil && Date.parse(u.lockedUntil) > Date.now() ? "failed" : u.active ? "active" : "inactive"} label={u.lockedUntil && Date.parse(u.lockedUntil) > Date.now() ? t("admin.users.locked") : undefined} /> },
        ]}
      />
      <div className="a-card" style={{ marginTop: "1.25rem" }}>
        <h2>{t("admin.users.loginHistory")}</h2>
        <table className="table"><tbody>{d.loginHistory.slice(0, 15).map((h) => <tr key={h.id}><td>{date(h.at, true)}</td><td>{h.email}</td><td>{h.area}</td><td><StatusBadge value={h.success ? "succeeded" : "failed"} /></td></tr>)}</tbody></table>
      </div>
    </>
  );
}
