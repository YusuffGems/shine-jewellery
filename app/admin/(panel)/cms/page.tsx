"use client";
import { useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { moveSection, saveCmsField, saveSection, toggleSection } from "@/admin/services/content";
import { uid } from "@/lib/utils";
import { FieldInput, getPath, setPath, type FieldDef } from "@/admin/components/CrudManager";
import { PageHead } from "@/admin/components/ui";
import { Modal } from "@/shared/components/Overlay";
import { LocalizedInput, Toggle } from "@/shared/components/Form";
import { Media } from "@/shared/components/Media";
import { useToast } from "@/shared/components/Toast";
import type { HomeSection, Testimonial } from "@/types";

const WITH_MEDIA = new Set(["hero", "featuredCollection", "diamondStory", "goldStory", "editorial", "videoStory", "personalisation", "craftsmanship"]);

export default function HomepageCmsPage() {
  const d = useDb();
  const { t, L } = useI18n();
  const { can } = useAdmin();
  const toast = useToast();
  const [edit, setEdit] = useState<HomeSection | null>(null);
  const [announcement, setAnnouncement] = useState(d.cms.announcement);
  const [footerAbout, setFooterAbout] = useState(d.cms.footerAbout);
  const [testimonials, setTestimonials] = useState<Testimonial[]>(d.cms.testimonials);
  const writable = can("cms.update");

  const fieldsFor = (s: HomeSection): FieldDef[] => [
    { key: "eyebrow", label: t("admin.cms.eyebrow"), type: "localized", span2: true },
    { key: "title", label: t("admin.cms.heading"), type: "localized", span2: true },
    { key: "body", label: t("admin.cms.body"), type: "localizedText" },
    { key: "ctaLabel", label: t("admin.cms.ctaLabel"), type: "localized", span2: true },
    { key: "ctaHref", label: t("admin.cms.ctaLink"), type: "text", span2: true, hint: t("admin.cms.ctaHint") },
    ...(WITH_MEDIA.has(s.type)
      ? ([
          { key: "mediaId", label: s.type === "hero" ? t("admin.cms.desktopImage") : t("admin.f.image"), type: "media" },
          ...(s.type === "hero" ? [{ key: "mobileMediaId", label: t("admin.cms.mobileImage"), type: "media" } as FieldDef] : []),
          { key: "videoId", label: t("admin.cms.video"), type: "video", hint: t("admin.cms.videoHint") },
        ] as FieldDef[])
      : []),
    ...(s.type === "featuredCollection" ? [{ key: "collectionId", label: t("admin.nav.collections"), type: "select", options: d.collections.map((c) => ({ value: c.id, label: c.name.en })) } as FieldDef] : []),
  ];

  return (
    <>
      <PageHead title={t("admin.nav.homepage")} sub={t("admin.cms.sub")} />
      <div className="a-grid-3">
        <div className="a-card">
          <h2>{t("admin.cms.sections")}</h2>
          {d.cms.sections.map((s, i) => (
            <div key={s.id} className="sortable-row" data-disabled={!s.enabled}>
              <div className="move-btns">
                <button disabled={!writable || i === 0} onClick={() => moveSection(s.id, -1)} aria-label={t("admin.moveUp")}>▲</button>
                <button disabled={!writable || i === d.cms.sections.length - 1} onClick={() => moveSection(s.id, 1)} aria-label={t("admin.moveDown")}>▼</button>
              </div>
              <div className="cell-main">
                <span className="thumb"><Media mediaId={s.mediaId} kind="campaign" /></span>
                <span><b>{t(`admin.section.${s.type}`)}</b><small>{L(s.title) || "—"}</small></span>
              </div>
              <div className="row">
                <Toggle checked={s.enabled} onChange={() => toggleSection(s.id)} label={t("admin.cms.enabled")} disabled={!writable} />
                <button className="btn btn--secondary btn--sm" onClick={() => setEdit(structuredClone(s))}>{writable ? t("common.edit") : t("common.view")}</button>
              </div>
            </div>
          ))}
        </div>
        <div className="stack">
          <div className="a-card stack">
            <h2>{t("admin.cms.announcement")}</h2>
            <LocalizedInput label={t("admin.cms.announcementText")} value={announcement} onChange={setAnnouncement} />
            <p className="field-hint">{t("admin.cms.announcementHint")}</p>
            {writable ? <button className="btn btn--sm" style={{ justifySelf: "start" }} onClick={() => (saveCmsField("announcement", announcement), toast(t("common.saved")))}>{t("common.save")}</button> : null}
          </div>
          <div className="a-card stack">
            <h2>{t("admin.cms.footer")}</h2>
            <LocalizedInput label={t("admin.cms.footerAbout")} value={footerAbout} onChange={setFooterAbout} multiline />
            {writable ? <button className="btn btn--sm" style={{ justifySelf: "start" }} onClick={() => (saveCmsField("footerAbout", footerAbout), toast(t("common.saved")))}>{t("common.save")}</button> : null}
          </div>
          <div className="a-card stack">
            <h2>{t("admin.cms.testimonials")}<button className="btn btn--secondary btn--sm" onClick={() => setTestimonials([...testimonials, { id: uid("ts"), name: "", text: { en: "", ar: "" }, sort: testimonials.length, active: true }])}>+</button></h2>
            {testimonials.map((x, i) => (
              <div key={x.id} className="stack" style={{ borderBottom: "1px solid var(--color-border)", paddingBottom: "0.75rem" }}>
                <div className="row"><input className="input grow" placeholder={t("forms.name")} value={x.name} onChange={(e) => setTestimonials(testimonials.map((y, j) => (j === i ? { ...y, name: e.target.value } : y)))} /><Toggle checked={x.active} label={t("admin.f.active")} onChange={(v) => setTestimonials(testimonials.map((y, j) => (j === i ? { ...y, active: v } : y)))} /><button className="btn btn--danger btn--sm" onClick={() => setTestimonials(testimonials.filter((_, j) => j !== i))}>×</button></div>
                <LocalizedInput label={t("admin.cms.quote")} multiline value={x.text} onChange={(v) => setTestimonials(testimonials.map((y, j) => (j === i ? { ...y, text: v } : y)))} />
              </div>
            ))}
            {writable ? <button className="btn btn--sm" style={{ justifySelf: "start" }} onClick={() => (saveCmsField("testimonials", testimonials), toast(t("common.saved")))}>{t("common.save")}</button> : null}
          </div>
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={edit ? t(`admin.section.${edit.type}`) : ""} closeLabel={t("common.close")} footer={<><button className="btn btn--secondary" onClick={() => setEdit(null)}>{t("common.cancel")}</button>{writable ? <button className="btn" onClick={() => (edit && saveSection(edit), setEdit(null), toast(t("common.saved")))}>{t("common.save")}</button> : null}</>}>
        {edit ? (
          <fieldset disabled={!writable} style={{ border: 0 }}>
            <div className="a-form">
              {fieldsFor(edit).map((f) => <FieldInput key={f.key} f={f} value={getPath(edit, f.key)} onChange={(v) => setEdit(setPath(edit, f.key, v))} />)}
            </div>
          </fieldset>
        ) : null}
      </Modal>
    </>
  );
}
