"use client";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { saveProduct } from "@/admin/services/products";
import { CrudManager } from "@/admin/components/CrudManager";
import type { Product } from "@/types";

/** Certificates are stored on products (certificate no. + diamond grading); certificate files live in Media › Certificates. */
export default function CertificatesAdminPage() {
  const d = useDb();
  const { t, L } = useI18n();
  return (
    <CrudManager<Product>
      title={t("admin.nav.certificates")}
      sub={t("admin.certificates.sub")}
      items={d.products.filter((p) => p.diamond || p.certificateNo)}
      search={(p) => `${p.name.en} ${p.sku} ${p.certificateNo ?? ""}`}
      readPerm="products.read"
      writePerm="products.update"
      onSave={saveProduct}
      fields={[
        { key: "certificateNo", label: t("product.certificate"), type: "text", span2: true },
        { key: "diamond.carat", label: t("filters.carat"), type: "number", step: 0.01 },
        { key: "diamond.shape", label: t("filters.shape"), type: "text" },
        { key: "diamond.colour", label: t("filters.diamondColour"), type: "text" },
        { key: "diamond.clarity", label: t("filters.clarity"), type: "text" },
      ]}
      columns={[
        { label: t("admin.f.product"), render: (p) => <span><b style={{ fontWeight: 500 }}>{L(p.name)}</b><br /><small className="muted ltr">{p.sku}</small></span> },
        { label: t("product.certificate"), render: (p) => p.certificateNo || <span className="badge badge--warning">{t("admin.certificates.missing")}</span> },
        { label: t("admin.certificates.grading"), render: (p) => (p.diamond ? `${p.diamond.carat} ct · ${p.diamond.shape} · ${p.diamond.colour} · ${p.diamond.clarity}` : "—") },
      ]}
    />
  );
}
