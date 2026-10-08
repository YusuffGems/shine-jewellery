"use client";
import { useMemo, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { DICTIONARIES, allKeys } from "@/lib/i18n";
import { setTranslation } from "@/admin/services/content";
import { PageHead } from "@/admin/components/ui";
import { useToast } from "@/shared/components/Toast";

/** Edit any interface string in English and Arabic. Overrides are stored; files in /locales remain the defaults. */
export default function LanguagesPage() {
  const d = useDb();
  const { t } = useI18n();
  const { can } = useAdmin();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [area, setArea] = useState<"all" | "store" | "admin">("store");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [limit, setLimit] = useState(80);
  const keys = useMemo(
    () => allKeys().filter((k) => (area === "all" || (area === "admin" ? k.startsWith("admin.") : !k.startsWith("admin."))) && (!onlyMissing || !(d.translations.ar[k] || DICTIONARIES.ar[k])) && (!q || `${k} ${DICTIONARIES.en[k] ?? ""} ${DICTIONARIES.ar[k] ?? ""} ${d.translations.en[k] ?? ""}`.toLowerCase().includes(q.toLowerCase()))),
    [q, area, onlyMissing, d.translations],
  );
  const editable = can("languages.update");

  return (
    <>
      <PageHead title={t("admin.nav.languages")} sub={t("admin.languages.sub")} />
      <div className="a-toolbar">
        <input className="input" type="search" placeholder={t("admin.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={area} onChange={(e) => setArea(e.target.value as typeof area)}>
          <option value="store">{t("admin.languages.storefront")}</option>
          <option value="admin">{t("admin.languages.admin")}</option>
          <option value="all">{t("admin.languages.all")}</option>
        </select>
        <label className="check"><input type="checkbox" checked={onlyMissing} onChange={(e) => setOnlyMissing(e.target.checked)} /> {t("admin.languages.missing")}</label>
        <span className="muted small" style={{ marginInlineStart: "auto" }}>{t("admin.results", { count: keys.length })}</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th style={{ width: "22%" }}>{t("admin.languages.key")}</th><th>English</th><th>العربية</th></tr></thead>
          <tbody>
            {keys.slice(0, limit).map((k) => (
              <tr key={k}>
                <td><code style={{ fontSize: 11 }}>{k}</code></td>
                {(["en", "ar"] as const).map((lang) => (
                  <td key={lang}>
                    <input
                      className="input"
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      disabled={!editable}
                      defaultValue={d.translations[lang][k] ?? DICTIONARIES[lang][k] ?? ""}
                      onBlur={(e) => {
                        const v = e.target.value;
                        if (v === (d.translations[lang][k] ?? DICTIONARIES[lang][k] ?? "")) return;
                        setTranslation(lang, k, v === DICTIONARIES[lang][k] ? "" : v);
                        toast(t("common.saved"));
                      }}
                      style={d.translations[lang][k] ? { borderColor: "var(--color-gold)" } : undefined}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {limit < keys.length ? <div style={{ textAlign: "center", marginTop: "1rem" }}><button className="btn btn--secondary" onClick={() => setLimit(limit + 120)}>{t("listing.loadMore")}</button></div> : null}
    </>
  );
}
