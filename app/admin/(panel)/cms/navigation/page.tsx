"use client";
import { useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { deleteNavItem, saveNavItem } from "@/admin/services/content";
import { uid } from "@/lib/utils";
import { PageHead } from "@/admin/components/ui";
import { Modal } from "@/shared/components/Overlay";
import { LocalizedInput, Toggle } from "@/shared/components/Form";
import { MediaField } from "@/admin/components/MediaPicker";
import { useToast } from "@/shared/components/Toast";
import type { NavColumn, NavItem } from "@/types";

/** One line per link: "English | العربية | /path" */
function columnToText(c: NavColumn) {
  return c.links.map((l) => `${l.label.en} | ${l.label.ar} | ${l.href}`).join("\n");
}
function textToLinks(text: string) {
  return text.split("\n").map((line) => line.split("|").map((s) => s.trim())).filter((p) => p[0] && p[2]).map(([en, ar, href]) => ({ label: { en, ar: ar ?? "" }, href }));
}

export default function NavigationCmsPage() {
  const d = useDb();
  const { t, L } = useI18n();
  const { can } = useAdmin();
  const toast = useToast();
  const [edit, setEdit] = useState<NavItem | null>(null);
  const [colText, setColText] = useState<string[]>([]);
  const writable = can("cms.update");
  const items = [...d.cms.navigation].sort((a, b) => a.sort - b.sort);

  const open = (n: NavItem) => {
    setEdit(structuredClone(n));
    setColText(n.columns.map(columnToText));
  };
  const move = (n: NavItem, dir: number) => {
    const i = items.findIndex((x) => x.id === n.id);
    const other = items[i + dir];
    if (!other) return;
    saveNavItem({ ...n, sort: other.sort });
    saveNavItem({ ...other, sort: n.sort });
  };

  return (
    <>
      <PageHead title={t("admin.nav.navigation")} sub={t("admin.navigation.sub")} actions={writable ? <button className="btn" onClick={() => open({ id: uid("nav"), label: { en: "", ar: "" }, href: "/", columns: [], sort: items.length, active: true })}>+ {t("admin.addNew")}</button> : null} />
      <div className="a-card">
        {items.map((n, i) => (
          <div key={n.id} className="sortable-row" data-disabled={!n.active}>
            <div className="move-btns">
              <button disabled={!writable || i === 0} onClick={() => move(n, -1)} aria-label={t("admin.moveUp")}>▲</button>
              <button disabled={!writable || i === items.length - 1} onClick={() => move(n, 1)} aria-label={t("admin.moveDown")}>▼</button>
            </div>
            <span><b style={{ fontWeight: 500 }}>{L(n.label)}</b> <small className="muted">{n.href}{n.columns.length ? ` · ${t("admin.navigation.mega", { count: n.columns.length })}` : ""}</small></span>
            <div className="row">
              <Toggle checked={n.active} disabled={!writable} label={t("admin.f.active")} onChange={(v) => saveNavItem({ ...n, active: v })} />
              <button className="btn btn--secondary btn--sm" onClick={() => open(n)}>{t("common.edit")}</button>
              {writable ? <button className="btn btn--danger btn--sm" onClick={() => window.confirm(t("admin.confirmDelete")) && deleteNavItem(n.id)}>×</button> : null}
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={t("admin.navigation.edit")} closeLabel={t("common.close")} footer={<><button className="btn btn--secondary" onClick={() => setEdit(null)}>{t("common.cancel")}</button>{writable ? <button className="btn" onClick={() => {
        if (!edit) return;
        saveNavItem({ ...edit, columns: edit.columns.map((c, i) => ({ ...c, links: textToLinks(colText[i] ?? "") })) });
        setEdit(null);
        toast(t("common.saved"));
      }}>{t("common.save")}</button> : null}</>}>
        {edit ? (
          <div className="a-form">
            <LocalizedInput className="span-2" label={t("admin.navigation.label")} value={edit.label} onChange={(v) => setEdit({ ...edit, label: v })} />
            <label className="field span-2"><span className="label">{t("admin.cms.ctaLink")}</span><input className="input" value={edit.href} onChange={(e) => setEdit({ ...edit, href: e.target.value })} /></label>
            <div className="a-form-section">{t("admin.navigation.megaMenu")}</div>
            {edit.columns.map((c, i) => (
              <div key={i} className="span-2 stack" style={{ gap: "0.5rem" }}>
                <div className="row">
                  <LocalizedInput className="grow" label={t("admin.navigation.columnTitle", { n: i + 1 })} value={c.title} onChange={(v) => setEdit({ ...edit, columns: edit.columns.map((x, j) => (j === i ? { ...x, title: v } : x)) })} />
                  <button className="btn btn--danger btn--sm" onClick={() => (setEdit({ ...edit, columns: edit.columns.filter((_, j) => j !== i) }), setColText(colText.filter((_, j) => j !== i)))}>×</button>
                </div>
                <textarea className="textarea" style={{ fontFamily: "ui-monospace, monospace", fontSize: 12 }} value={colText[i] ?? ""} onChange={(e) => setColText(colText.map((x, j) => (j === i ? e.target.value : x)))} />
              </div>
            ))}
            <p className="field-hint span-2">{t("admin.navigation.linkFormat")}</p>
            <button className="btn btn--secondary btn--sm" style={{ justifySelf: "start" }} onClick={() => (setEdit({ ...edit, columns: [...edit.columns, { title: { en: "", ar: "" }, links: [] }] }), setColText([...colText, ""]))}>+ {t("admin.navigation.addColumn")}</button>
            <div className="a-form-section">{t("admin.navigation.feature")}</div>
            <div className="field"><span className="label">{t("admin.f.image")}</span><MediaField value={edit.featuredMediaId ? [edit.featuredMediaId] : []} onChange={(ids) => setEdit({ ...edit, featuredMediaId: ids[0] })} /></div>
            <label className="field"><span className="label">{t("admin.cms.ctaLink")}</span><input className="input" value={edit.featuredHref ?? ""} onChange={(e) => setEdit({ ...edit, featuredHref: e.target.value })} /></label>
            <LocalizedInput className="span-2" label={t("admin.navigation.featureTitle")} value={edit.featuredTitle ?? { en: "", ar: "" }} onChange={(v) => setEdit({ ...edit, featuredTitle: v })} />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
