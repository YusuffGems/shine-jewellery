"use client";
import Link from "next/link";
import { useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { storefrontTokens } from "@/lib/theme/resolve";
import { subscribeNewsletter } from "@/user/services/engagement";
import { isEmail } from "@/lib/utils";
import { useToast } from "@/shared/components/Toast";
import { SocialLinks } from "@/user/components/common/SocialLinks";
import { Brand } from "@/user/components/header/Brand";

export function Footer() {
  const d = useDb();
  const { t, L } = useI18n();
  const toast = useToast();
  const { tokens } = storefrontTokens(d);
  const [email, setEmail] = useState("");
  const shopCats = d.categories.filter((c) => c.active).slice(8, 14);
  const pages = d.cms.pages.filter((p) => p.active);

  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <Brand background={tokens.footerBackground} />
          <p>{L(d.cms.footerAbout)}</p>
          <SocialLinks className="footer-social" />
        </div>
        <div>
          <h4>{t("footer.shop")}</h4>
          <ul>
            {shopCats.map((c) => <li key={c.id}><Link href={`/collections/${c.slug}`}>{L(c.name)}</Link></li>)}
            <li><Link href="/gold-rate">{t("footer.goldRate")}</Link></li>
          </ul>
        </div>
        <div>
          <h4>{t("footer.client")}</h4>
          <ul>
            <li><Link href="/account">{t("header.account")}</Link></li>
            <li><Link href="/appointment">{t("nav.bookAppointment")}</Link></li>
            <li><Link href="/personalise">{t("nav.personalise")}</Link></li>
            <li><Link href="/showrooms">{t("nav.showrooms")}</Link></li>
            <li><Link href="/faq">{t("footer.faq")}</Link></li>
          </ul>
        </div>
        {tokens.footerColumns === 4 ? (
          <div>
            <h4>{t("footer.about")}</h4>
            <ul>
              {pages.map((p) => <li key={p.id}><Link href={`/pages/${p.slug}`}>{L(p.title)}</Link></li>)}
            </ul>
            {tokens.footerNewsletter ? (
              <form
                className="footer-news"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!isEmail(email)) return toast(t("forms.invalidEmail"), "error");
                  subscribeNewsletter(email);
                  setEmail("");
                  toast(t("newsletter.thanks"));
                }}
              >
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("newsletter.placeholder")} aria-label={t("newsletter.placeholder")} />
                <button type="submit">{t("newsletter.join")}</button>
              </form>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} {d.settings.storeName} · {t("footer.qatar")}</span>
        <span>{t("footer.currencyNote")}</span>
      </div>
    </footer>
  );
}