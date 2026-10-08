"use client";
import { db } from "@/lib/store/db";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { setLang } from "@/shared/services/preferences";
import { Icon } from "@/shared/components/Icon";

/** EN | العربية — flips the entire site (and admin) between LTR and RTL. */
export function LangSwitch() {
  const { lang, t } = useI18n();
  return (
    <button className="lang-switch" onClick={() => setLang(lang === "en" ? "ar" : "en")} aria-label={t("header.switchLanguage")}>
      <span className={lang === "en" ? "on" : ""}>EN</span>
      <span className="sep">|</span>
      <span className={`ar${lang === "ar" ? " on" : ""}`} lang="ar">العربية</span>
    </button>
  );
}

/** Light / dark appearance toggle switch for the storefront. */
export function AppearanceToggle() {
  const d = useDb();
  const { t } = useI18n();
  const dark = d.session.appearance === "dark";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      className="appearance-toggle"
      aria-label={t("header.darkMode")}
      title={t(dark ? "header.lightMode" : "header.darkMode")}
      onClick={() =>
        db.update((x) => {
          x.session.appearance = dark ? "light" : "dark";
        })
      }
    >
      <Icon name="sun" className="sun" />
      <Icon name="moon" className="moon" />
    </button>
  );
}
