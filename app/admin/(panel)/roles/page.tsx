"use client";
import { useI18n } from "@/shared/hooks/useI18n";
import { ADMIN_ROLES, PERMISSIONS, ROLE_PERMISSIONS } from "@/lib/auth/rbac";
import { PageHead } from "@/admin/components/ui";
import { RequirePermission } from "@/admin/layout/AdminShell";

/** Role → permission matrix. Source of truth: lib/auth/rbac.ts (mirrored to Role/Permission tables in the database). */
export default function RolesPage() {
  const { t } = useI18n();
  return (
    <RequirePermission perm="roles.read">
      <PageHead title={t("admin.nav.roles")} sub={t("admin.roles.sub")} />
      <div className="table-wrap">
        <table className="table matrix">
          <thead><tr><th>{t("admin.roles.permission")}</th>{ADMIN_ROLES.map((r) => <th key={r}>{t(`role.${r}`)}</th>)}</tr></thead>
          <tbody>
            {PERMISSIONS.map((p) => (
              <tr key={p}>
                <td><code style={{ fontSize: 12 }}>{p}</code></td>
                {ADMIN_ROLES.map((r) => <td key={r}><span className={`dot${ROLE_PERMISSIONS[r].includes(p) ? "" : " dot--off"}`} aria-label={ROLE_PERMISSIONS[r].includes(p) ? "yes" : "no"} /></td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="field-hint" style={{ marginTop: "0.75rem" }}>{t("admin.roles.customerNote")}</p>
    </RequirePermission>
  );
}
