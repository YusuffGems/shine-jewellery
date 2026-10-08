"use client";
import { useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { db } from "@/lib/store/db";
import { saveSettings } from "@/admin/services/content";
import { PageHead } from "@/admin/components/ui";
import { RequirePermission } from "@/admin/layout/AdminShell";
import { useToast } from "@/shared/components/Toast";
import type { Settings } from "@/types";

export default function SettingsPage() {
  const d = useDb();
  const { t } = useI18n();
  const toast = useToast();
  const [s, setS] = useState<Settings>(d.settings);
  const text = (k: keyof Settings, label: string, hint?: string) => (
    <label className="field" key={k}><span className="label">{label}</span><input className="input" value={String(s[k] ?? "")} onChange={(e) => setS({ ...s, [k]: typeof d.settings[k] === "number" ? Number(e.target.value) : e.target.value })} type={typeof d.settings[k] === "number" ? "number" : "text"} />{hint ? <span className="field-hint">{hint}</span> : null}</label>
  );
  return (
    <RequirePermission perm="settings.update">
      <PageHead title={t("admin.nav.settings")} sub={t("admin.settings.sub")} actions={<button className="btn" onClick={() => (saveSettings(s), toast(t("common.saved")))}>{t("common.save")}</button>} />
      <div className="a-grid-2">
        <div className="a-card">
          <h2>{t("admin.settings.store")}</h2>
          <div className="a-form">
            {text("storeName", t("admin.settings.storeName"))}
            <label className="field"><span className="label">{t("admin.settings.currency")}</span><input className="input" value="QAR" readOnly /></label>
            <label className="field"><span className="label">{t("admin.settings.timezone")}</span><input className="input" value="Asia/Qatar" readOnly /></label>
            {text("supportEmail", t("admin.settings.email"))}
            {text("supportPhone", t("admin.settings.phone"))}
            {text("whatsapp", "WhatsApp", t("admin.settings.whatsappHint"))}
          </div>
        </div>
        <div className="a-card">
          <h2>{t("admin.settings.commerce")}</h2>
          <div className="a-form">
            {text("taxRate", t("admin.pricing.taxRate"), t("admin.settings.taxHint"))}
            {text("deliveryFee", t("admin.pricing.deliveryFee"))}
            {text("freeDeliveryThreshold", t("admin.pricing.freeDeliveryThreshold"))}
            {text("priceLockMinutes", t("admin.pricing.priceLockMinutes"))}
            {text("lowStockThreshold", t("admin.settings.lowStock"))}
          </div>
        </div>
      </div>
      <div className="a-card">
        <h2>{t("admin.settings.data")}</h2>
        <p className="field-hint" style={{ marginBottom: "1rem" }}>{t("admin.settings.dataHint")}</p>
        <div className="row">
          <button className="btn btn--secondary" onClick={() => {
            const url = URL.createObjectURL(new Blob([db.exportJson()], { type: "application/json" }));
            Object.assign(document.createElement("a"), { href: url, download: "shine-data.json" }).click();
            URL.revokeObjectURL(url);
          }}>{t("admin.settings.export")}</button>
          <label className="btn btn--secondary">{t("admin.settings.import")}<input type="file" hidden accept="application/json" onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            try { db.importJson(await f.text()); toast(t("common.saved")); } catch { toast(t("admin.settings.importFailed"), "error"); }
          }} /></label>
          <button className="btn btn--danger" onClick={() => window.confirm(t("admin.settings.resetConfirm")) && (db.reset(), toast(t("admin.settings.resetDone")))}>{t("admin.settings.reset")}</button>
        </div>
      </div>
    </RequirePermission>
  );
}
