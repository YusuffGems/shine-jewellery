"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { removeEntity, upsertEntity } from "@/shared/services/core";
import { uid } from "@/lib/utils";
import { CrudManager } from "@/admin/components/CrudManager";
import { StatusBadge } from "@/admin/components/ui";
import { SocialIcon } from "@/shared/components/Icon";
import type { SocialLink } from "@/types";

const PLATFORMS = ["Instagram", "Facebook", "TikTok", "YouTube", "X", "WhatsApp", "LinkedIn"];

export default function SocialAdminPage() {
  const d = useDb();
  const { t } = useI18n();
  return (
    <CrudManager<SocialLink>
      title={t("admin.nav.social")}
      sub={t("admin.social.sub")}
      items={[...d.social].sort((a, b) => a.sort - b.sort)}
      search={(s) => `${s.platform} ${s.url}`}
      readPerm="cms.read"
      writePerm="cms.update"
      newItem={() => ({ id: uid("so"), platform: "LinkedIn", url: "", active: true, sort: d.social.length })}
      validate={(s) => (s.url && !/^https:\/\//.test(s.url) ? t("admin.social.https") : null)}
      onSave={(s) => upsertEntity("social", s)}
      onDelete={(s) => removeEntity("social", s.id)}
      fields={[
        { key: "platform", label: t("admin.social.platform"), type: "select", options: PLATFORMS.map((p) => ({ value: p, label: p })) },
        { key: "url", label: "URL", type: "text", hint: t("admin.social.urlHint") },
        { key: "sort", label: t("admin.f.sort"), type: "number" },
        { key: "active", label: t("admin.f.active"), type: "toggle" },
      ]}
      columns={[
        { label: t("admin.social.platform"), render: (s) => <span className="row"><SocialIcon platform={s.platform} /> {s.platform}</span> },
        { label: "URL", render: (s) => (s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer" className="small">{s.url}</a> : <span className="badge badge--warning">{t("admin.social.notSet")}</span>) },
        { label: t("admin.f.status"), render: (s) => <StatusBadge value={s.active && s.url ? "active" : "inactive"} /> },
      ]}
    />
  );
}