"use client";
import { useDb, useHydrated } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { articleJsonLd, faqJsonLd } from "@/lib/seo/schema";

export function CmsPageView({ slug }: { slug: string }) {
  const d = useDb();
  const hydrated = useHydrated();
  const { t, L } = useI18n();
  const page = d.cms.pages.find((p) => p.slug === slug && p.active);
  if (!page) return hydrated ? <div className="container empty"><h3>{t("listing.notFound")}</h3></div> : <div className="container section" />;
  return (
    <div className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd(page.title.en, page.body.en, page.slug)) }} />
      <div className="section-head" style={{ paddingTop: "4rem" }}><h1 className="section-title">{L(page.title)}</h1><span className="ornament" /></div>
      <article className="prose">{L(page.body)}</article>
    </div>
  );
}

export function FaqView() {
  const d = useDb();
  const { t, L } = useI18n();
  const faqs = d.cms.faqs.filter((f) => f.active).sort((a, b) => a.sort - b.sort);
  return (
    <div className="container" style={{ maxWidth: 860, paddingBottom: "var(--section-space)" }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(faqs)) }} />
      <div className="section-head" style={{ paddingTop: "4rem" }}><span className="eyebrow">{t("footer.faq")}</span><h1 className="section-title">{t("faq.title")}</h1></div>
      <div className="accordion">
        {faqs.map((f) => (
          <details key={f.id}>
            <summary>{L(f.question)}</summary>
            <div className="acc-body">{L(f.answer)}</div>
          </details>
        ))}
      </div>
    </div>
  );
}
