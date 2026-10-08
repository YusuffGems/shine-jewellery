"use client";
/* ──────────────────────────────────────────────────────────────
   Generic list + edit-form manager used by most admin modules.
   A module declares columns + fields; this handles search, table,
   the editor modal, validation hooks, save/delete and permissions.
   ────────────────────────────────────────────────────────────── */
import { useMemo, useState, type ReactNode } from "react";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import type { Permission } from "@/lib/auth/rbac";
import { Modal } from "@/shared/components/Overlay";
import { LocalizedInput, Toggle } from "@/shared/components/Form";
import { useToast } from "@/shared/components/Toast";
import { Icon } from "@/shared/components/Icon";
import { MediaField } from "./MediaPicker";
import { EmptyState, PageHead } from "./ui";
import type { Localized } from "@/types";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = { id: string } & Record<string, any>;

export type FieldType = "text" | "number" | "textarea" | "localized" | "localizedText" | "select" | "multiselect" | "toggle" | "media" | "mediaList" | "video" | "videoList" | "tags" | "color" | "section" | "date";

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  span2?: boolean;
  hint?: string;
  step?: number;
  readOnly?: boolean;
}

export interface Column<T> { label: string; render: (row: T) => ReactNode; num?: boolean }

export function getPath(obj: any, path: string): any {
  return path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);
}
export function setPath<T>(obj: T, path: string, value: any): T {
  const copy: any = structuredClone(obj);
  const keys = path.split(".");
  let cur = copy;
  keys.slice(0, -1).forEach((k) => {
    if (cur[k] == null) cur[k] = {};
    cur = cur[k];
  });
  cur[keys[keys.length - 1]] = value;
  return copy;
}

export function FieldInput({ f, value, onChange }: { f: FieldDef; value: any; onChange: (v: any) => void }) {
  const { t } = useI18n();
  const id = `f-${f.key}`;
  const wrap = (child: ReactNode) => (
    <div className={`field${f.span2 ? " span-2" : ""}`}>
      <label htmlFor={id}>{f.label}</label>
      {child}
      {f.hint ? <span className="field-hint">{f.hint}</span> : null}
    </div>
  );
  switch (f.type) {
    case "section":
      return <div className="a-form-section">{f.label}</div>;
    case "localized":
    case "localizedText":
      return <LocalizedInput className={f.span2 || f.type === "localizedText" ? "span-2" : undefined} label={f.label} multiline={f.type === "localizedText"} value={(value as Localized) ?? { en: "", ar: "" }} onChange={onChange} />;
    case "textarea":
      return wrap(<textarea id={id} className="textarea" value={value ?? ""} onChange={(e) => onChange(e.target.value)} readOnly={f.readOnly} />);
    case "number":
      return wrap(<input id={id} className="input" type="number" step={f.step ?? "any"} value={value ?? 0} onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))} readOnly={f.readOnly} />);
    case "date":
      return wrap(<input id={id} className="input" type="date" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />);
    case "color":
      return wrap(<span className="color-input"><input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} /><input id={id} className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} /></span>);
    case "select":
      return wrap(
        <select id={id} className="select" value={value ?? ""} onChange={(e) => onChange(e.target.value)} disabled={f.readOnly}>
          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>,
      );
    case "multiselect": {
      const arr: string[] = value ?? [];
      return wrap(
        <div className="multi-check">
          {f.options?.map((o) => (
            <button type="button" key={o.value} className="chip" aria-pressed={arr.includes(o.value)} onClick={() => onChange(arr.includes(o.value) ? arr.filter((x) => x !== o.value) : [...arr, o.value])}>{o.label}</button>
          ))}
        </div>,
      );
    }
    case "tags":
      return wrap(<input id={id} className="input" value={(value ?? []).join(", ")} onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))} placeholder={t("admin.commaSeparated")} />);
    case "toggle":
      return (
        <div className={`field${f.span2 ? " span-2" : ""}`}>
          <span className="label">{f.label}</span>
          <Toggle checked={!!value} onChange={onChange} label={f.label} />
        </div>
      );
    case "media":
      return wrap(<MediaField value={value ? [value] : []} onChange={(ids) => onChange(ids[0])} />);
    case "video":
      return wrap(<MediaField type="video" value={value ? [value] : []} onChange={(ids) => onChange(ids[0])} />);
    case "mediaList":
      return wrap(<MediaField multiple value={value ?? []} onChange={onChange} />);
    case "videoList":
      return wrap(<MediaField type="video" multiple value={value ?? []} onChange={onChange} />);
    default:
      return wrap(<input id={id} className="input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} readOnly={f.readOnly} />);
  }
}

export interface CrudProps<T extends Row> {
  title: string;
  sub?: string;
  items: T[];
  columns: Column<T>[];
  fields: FieldDef[];
  newItem?: () => T;
  onSave: (item: T) => void;
  onDelete?: (item: T) => boolean | void;
  validate?: (item: T) => string | null;
  search: (item: T) => string;
  readPerm: Permission;
  writePerm: Permission;
  deletePerm?: Permission;
  toolbar?: ReactNode;
  filter?: (item: T) => boolean;
  /** Extra panel in the editor (e.g. live price preview) */
  editorExtra?: (draft: T) => ReactNode;
  headerActions?: ReactNode;
  rowActions?: (item: T) => ReactNode;
}

export function CrudManager<T extends Row>(p: CrudProps<T>) {
  const { t } = useI18n();
  const { can } = useAdmin();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState<T | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState("");
  const writable = can(p.writePerm);
  const rows = useMemo(() => p.items.filter((i) => (!p.filter || p.filter(i)) && (!q || p.search(i).toLowerCase().includes(q.toLowerCase()))), [p, q]);

  if (!can(p.readPerm)) return <EmptyState text={t("admin.noAccess")} />;

  const save = () => {
    if (!draft) return;
    const err = p.validate?.(draft);
    if (err) return setError(err);
    p.onSave(draft);
    toast(t("common.saved"));
    setDraft(null);
  };

  return (
    <>
      <PageHead
        title={p.title}
        sub={p.sub}
        actions={
          <>
            {p.headerActions}
            {p.newItem && writable ? <button className="btn" onClick={() => (setDraft(p.newItem!()), setIsNew(true), setError(""))}><Icon name="plus" size={16} /> {t("admin.addNew")}</button> : null}
          </>
        }
      />
      <div className="a-toolbar">
        <input className="input" type="search" placeholder={t("admin.search")} value={q} onChange={(e) => setQ(e.target.value)} aria-label={t("admin.search")} />
        {p.toolbar}
        <span className="muted small" style={{ marginInlineStart: "auto" }}>{t("admin.results", { count: rows.length })}</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {p.columns.map((c) => <th key={c.label} className={c.num ? "num" : undefined}>{c.label}</th>)}
              <th className="num">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {p.columns.map((c) => <td key={c.label} className={c.num ? "num" : undefined}>{c.render(r)}</td>)}
                <td>
                  <div className="row-actions">
                    {p.rowActions?.(r)}
                    <button className="btn btn--secondary btn--sm" onClick={() => (setDraft(structuredClone(r)), setIsNew(false), setError(""))}>{writable ? t("common.edit") : t("common.view")}</button>
                    {p.onDelete && can(p.deletePerm ?? p.writePerm) ? (
                      <button className="btn btn--danger btn--sm" onClick={() => {
                        if (!window.confirm(t("admin.confirmDelete"))) return;
                        const res = p.onDelete!(r);
                        if (res === false) toast(t("admin.cannotDelete"), "error");
                        else toast(t("common.deleted"));
                      }} aria-label={t("common.delete")}><Icon name="trash" size={14} /></button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!rows.length ? <EmptyState text={t("admin.noResults")} /> : null}
      </div>

      <Modal
        open={!!draft}
        onClose={() => setDraft(null)}
        wide
        title={isNew ? `${t("admin.addNew")} · ${p.title}` : `${t("common.edit")} · ${p.title}`}
        closeLabel={t("common.close")}
        footer={
          <>
            {error ? <span className="field-error" style={{ marginInlineEnd: "auto" }}>{error}</span> : null}
            <button className="btn btn--secondary" onClick={() => setDraft(null)}>{t("common.cancel")}</button>
            {writable ? <button className="btn" onClick={save}>{t("common.save")}</button> : null}
          </>
        }
      >
        {draft ? (
          <div style={{ display: "grid", gap: "1.25rem" }}>
            {p.editorExtra?.(draft)}
            <fieldset disabled={!writable} style={{ border: 0 }}>
              <div className="a-form">
                {p.fields.map((f) => <FieldInput key={f.key + f.label} f={f} value={getPath(draft, f.key)} onChange={(v) => setDraft(setPath(draft, f.key, v))} />)}
              </div>
            </fieldset>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
