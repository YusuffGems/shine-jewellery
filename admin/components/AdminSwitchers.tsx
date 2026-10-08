"use client";
/* Admin-only language and appearance switchers (styled by admin/styles, independent of the user site). */
import { db } from "@/lib/store/db";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { setLang } from "@/shared/services/preferences";
import { Icon } from "@/shared/components/Icon";

export function AdminLangSwitch() {
  const { lang, t } = useI18n();
  return (
    <button className="a-lang" onClick={() => setLang(lang === "en" ? "ar" : "en")} aria-label={t("header.switchLanguage")}>
      <span aria-current={lang === "en"}>EN</span>
      <span aria-current={lang === "ar"} lang="ar">ع</span>
    </button>
  );
}

export function AdminAppearanceToggle() {
  const d = useDb();
  const { t } = useI18n();
  const dark = d.session.adminAppearance === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      className="a-icon-btn"
      title={t(dark ? "header.lightMode" : "header.darkMode")}
      aria-label={t("header.darkMode")}
      onClick={() => db.update((x) => void (x.session.adminAppearance = dark ? "light" : "dark"))}
    >
      <Icon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}
