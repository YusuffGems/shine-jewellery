"use client";
import { useMemo, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { PageHead } from "@/admin/components/ui";
import { RequirePermission } from "@/admin/layout/AdminShell";

export default function AuditPage() {
  const d = useDb();
  const { t, date } = useI18n();
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("all");
  const entities = useMemo(() => Array.from(new Set(d.audit.map((a) => a.entity))).sort(), [d.audit]);
  const rows = d.audit.filter((a) => (entity === "all" || a.entity === entity) && (!q || `${a.user} ${a.action} ${a.entityId}`.toLowerCase().includes(q.toLowerCase())));
  return (
    <RequirePermission perm="audit.read">
      <PageHead title={t("admin.nav.audit")} sub={t("admin.audit.sub")} />
      <div className="a-toolbar">
        <input className="input" type="search" placeholder={t("admin.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={entity} onChange={(e) => setEntity(e.target.value)}><option value="all">{t("admin.audit.allEntities")}</option>{entities.map((e) => <option key={e}>{e}</option>)}</select>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{t("admin.audit.time")}</th><th>{t("admin.audit.user")}</th><th>{t("admin.audit.action")}</th><th>{t("admin.audit.entity")}</th><th>ID</th><th>{t("admin.audit.change")}</th><th>IP</th></tr></thead>
          <tbody>
            {rows.slice(0, 300).map((a) => (
              <tr key={a.id}>
                <td style={{ whiteSpace: "nowrap" }}>{date(a.at, true)}</td>
                <td>{a.user}</td>
                <td><span className="badge">{a.action}</span></td>
                <td>{a.entity}</td>
                <td><code style={{ fontSize: 11 }}>{a.entityId}</code></td>
                <td>
                  {a.oldValue || a.newValue ? (
                    <details><summary className="small">{t("admin.audit.view")}</summary>
                      <pre style={{ whiteSpace: "pre-wrap", fontSize: 11, maxWidth: 420, maxHeight: 200, overflow: "auto" }}>{a.oldValue ? `− ${a.oldValue}\n` : ""}{a.newValue ? `+ ${a.newValue}` : ""}</pre>
                    </details>
                  ) : "—"}
                </td>
                <td className="muted small">{a.ip}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <div className="empty">{t("admin.noResults")}</div> : null}
      </div>
    </RequirePermission>
  );
}
