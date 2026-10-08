"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { removeEntity, upsertEntity } from "@/shared/services/core";
import { CrudManager } from "@/admin/components/CrudManager";
import { StatusBadge } from "@/admin/components/ui";
import type { Review } from "@/types";

export default function ReviewsAdminPage() {
  const d = useDb();
  const { t, L, date } = useI18n();
  return (
    <CrudManager<Review>
      title={t("admin.nav.reviews")}
      sub={t("admin.reviews.sub")}
      items={d.reviews}
      search={(r) => `${r.name} ${r.text}`}
      readPerm="reviews.read"
      writePerm="reviews.update"
      onSave={(r) => upsertEntity("reviews", r)}
      onDelete={(r) => removeEntity("reviews", r.id)}
      rowActions={(r) => <button className="btn btn--secondary btn--sm" onClick={() => upsertEntity("reviews", { ...r, approved: !r.approved })}>{r.approved ? t("admin.reviews.hide") : t("admin.reviews.approve")}</button>}
      fields={[
        { key: "name", label: t("forms.name"), type: "text" },
        { key: "rating", label: t("product.rating"), type: "number" },
        { key: "text", label: t("admin.reviews.text"), type: "textarea", span2: true },
        { key: "approved", label: t("admin.reviews.approved"), type: "toggle" },
      ]}
      columns={[
        { label: t("admin.f.product"), render: (r) => L(d.products.find((p) => p.id === r.productId)?.name) },
        { label: t("product.rating"), render: (r) => <span className="stars">{"★".repeat(r.rating)}</span> },
        { label: t("admin.reviews.text"), render: (r) => <span className="small">{r.text.slice(0, 80)}<br /><small className="muted">{r.name} · {date(r.createdAt)}</small></span> },
        { label: t("admin.f.status"), render: (r) => <StatusBadge value={r.approved ? "active" : "pending"} label={r.approved ? t("admin.reviews.published") : t("admin.reviews.pending")} /> },
      ]}
    />
  );
}
