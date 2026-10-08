"use client";
import { useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { saveCmsField } from "@/admin/services/content";
import { slugify, uid } from "@/lib/utils";
import { CrudManager } from "@/admin/components/CrudManager";
import { StatusBadge } from "@/admin/components/ui";
import type { CmsPage, Faq } from "@/types";

export default function PagesCmsPage() {
  const d = useDb();
  const { t, L } = useI18n();
  const [tab, setTab] = useState<"pages" | "faq">("pages");
  return (
    <>
      <div className="tabs" role="tablist" style={{ marginBottom: "1.25rem" }}>
        <button role="tab" className="tab" aria-selected={tab === "pages"} onClick={() => setTab("pages")}>{t("admin.nav.pages")}</button>
        <button role="tab" className="tab" aria-selected={tab === "faq"} onClick={() => setTab("faq")}>{t("footer.faq")}</button>
      </div>
      {tab === "pages" ? (
        <CrudManager<CmsPage>
          title={t("admin.nav.pages")}
          sub={t("admin.pages.sub")}
          items={d.cms.pages}
          search={(p) => `${p.title.en} ${p.slug}`}
          readPerm="cms.read"
          writePerm="cms.update"
          newItem={() => ({ id: uid("pg"), slug: "", title: { en: "", ar: "" }, body: { en: "", ar: "" }, seo: { title: "", description: "" }, active: true })}
          validate={(p) => (!p.title.en.trim() ? t("admin.required") : null)}
          onSave={(p) => {
            const page = { ...p, slug: slugify(p.slug || p.title.en) };
            const list = d.cms.pages.some((x) => x.id === p.id) ? d.cms.pages.map((x) => (x.id === p.id ? page : x)) : [...d.cms.pages, page];
            saveCmsField("pages", list);
          }}
          onDelete={(p) => saveCmsField("pages", d.cms.pages.filter((x) => x.id !== p.id))}
          fields={[
            { key: "title", label: t("admin.f.name"), type: "localized", span2: true },
            { key: "slug", label: t("admin.f.slug"), type: "text", hint: "/pages/{slug}" },
            { key: "active", label: t("admin.f.active"), type: "toggle" },
            { key: "body", label: t("admin.cms.body"), type: "localizedText" },
            { key: "seo.title", label: t("admin.f.seoTitle"), type: "text", span2: true },
            { key: "seo.description", label: t("admin.f.seoDescription"), type: "textarea", span2: true },
          ]}
          columns={[
            { label: t("admin.f.name"), render: (p) => <span><b style={{ fontWeight: 500 }}>{L(p.title)}</b><br /><small className="muted">/pages/{p.slug}</small></span> },
            { label: t("admin.f.status"), render: (p) => <StatusBadge value={p.active ? "active" : "inactive"} /> },
          ]}
        />
      ) : (
        <CrudManager<Faq>
          title={t("footer.faq")}
          items={[...d.cms.faqs].sort((a, b) => a.sort - b.sort)}
          search={(f) => `${f.question.en} ${f.question.ar}`}
          readPerm="cms.read"
          writePerm="cms.update"
          newItem={() => ({ id: uid("fq"), question: { en: "", ar: "" }, answer: { en: "", ar: "" }, sort: d.cms.faqs.length, active: true })}
          onSave={(f) => saveCmsField("faqs", d.cms.faqs.some((x) => x.id === f.id) ? d.cms.faqs.map((x) => (x.id === f.id ? f : x)) : [...d.cms.faqs, f])}
          onDelete={(f) => saveCmsField("faqs", d.cms.faqs.filter((x) => x.id !== f.id))}
          fields={[
            { key: "question", label: t("admin.faq.question"), type: "localized", span2: true },
            { key: "answer", label: t("admin.faq.answer"), type: "localizedText" },
            { key: "sort", label: t("admin.f.sort"), type: "number" },
            { key: "active", label: t("admin.f.active"), type: "toggle" },
          ]}
          columns={[
            { label: t("admin.faq.question"), render: (f) => L(f.question) },
            { label: t("admin.f.status"), render: (f) => <StatusBadge value={f.active ? "active" : "inactive"} /> },
          ]}
        />
      )}
    </>
  );
}
