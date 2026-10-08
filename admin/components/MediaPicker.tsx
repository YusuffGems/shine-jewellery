"use client";
import { useMemo, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { FOLDERS, uploadFiles } from "@/shared/services/media";
import { Modal } from "@/shared/components/Overlay";
import { Media } from "@/shared/components/Media";
import { useToast } from "@/shared/components/Toast";
import type { MediaFolder, MediaType } from "@/types";

export function MediaPicker({ open, onClose, onPick, type, multiple }: { open: boolean; onClose: () => void; onPick: (ids: string[]) => void; type?: MediaType; multiple?: boolean }) {
  const d = useDb();
  const { t } = useI18n();
  const toast = useToast();
  const [folder, setFolder] = useState<MediaFolder | "all">("all");
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<string[]>([]);
  const list = useMemo(
    () => d.media.filter((m) => (!type || m.type === type) && (folder === "all" || m.folder === folder) && (!q || `${m.title} ${m.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase()))),
    [d.media, type, folder, q],
  );
  const toggle = (id: string) => setSel((s) => (multiple ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id]));

  return (
    <Modal
      open={open}
      onClose={onClose}
      wide
      title={t("admin.media.choose")}
      closeLabel={t("common.close")}
      footer={
        <>
          <label className="btn btn--secondary" style={{ marginInlineEnd: "auto" }}>
            {t("admin.media.upload")}
            <input type="file" hidden multiple accept={type === "video" ? "video/mp4,video/webm,video/quicktime" : type === "image" ? "image/*" : "image/*,video/*"} onChange={async (e) => {
              if (!e.target.files?.length) return;
              const { ids, rejected } = await uploadFiles(e.target.files, folder === "all" ? (type === "video" ? "Videos" : "Products") : folder);
              if (rejected.length) toast(t("admin.media.rejected", { files: rejected.join(", ") }), "error");
              setSel((s) => (multiple ? [...s, ...ids] : ids.slice(0, 1)));
            }} />
          </label>
          <button className="btn btn--secondary" onClick={onClose}>{t("common.cancel")}</button>
          <button className="btn" disabled={!sel.length} onClick={() => (onPick(sel), setSel([]), onClose())}>{t("admin.media.use", { count: sel.length })}</button>
        </>
      }
    >
      <div className="a-toolbar">
        <input className="input" placeholder={t("admin.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={folder} onChange={(e) => setFolder(e.target.value as MediaFolder | "all")}>
          <option value="all">{t("admin.media.allFolders")}</option>
          {FOLDERS.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      <div className="media-grid">
        {list.slice(0, 120).map((m) => (
          <button key={m.id} type="button" className="media-tile" aria-pressed={sel.includes(m.id)} onClick={() => toggle(m.id)}>
            <span className="media-type badge">{m.type}</span>
            <Media mediaId={m.type === "image" ? m.id : m.posterId} videoId={m.type === "video" ? m.id : undefined} kind={m.placeholder} playInView />
            <span className="media-tile-info"><b>{m.title}</b><small>{m.folder}{m.url ? "" : ` · ${t("admin.media.placeholder")}`}</small></span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

/** Media reference field: shows selected assets, pick from library, remove, reorder. */
export function MediaField({ value, onChange, type = "image", multiple, folder }: { value: string[]; onChange: (ids: string[]) => void; type?: MediaType; multiple?: boolean; folder?: MediaFolder }) {
  const { t } = useI18n();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const directUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    const { ids, rejected } = await uploadFiles(multiple ? files : [files[0]], folder ?? (type === "video" ? "Videos" : "Products"));
    setBusy(false);
    if (rejected.length) toast(t("admin.media.rejected", { files: rejected.join(", ") }), "error");
    if (ids.length) onChange(multiple ? [...value, ...ids] : ids.slice(0, 1));
  };
  const move = (i: number, dir: number) => {
    const next = [...value];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  return (
    <div className="media-field">
      {value.map((id, i) => (
        <div key={id + i} className="slot" title={multiple ? t("admin.media.dragHint") : undefined} onDoubleClick={() => move(i, -1)}>
          <Media mediaId={type === "image" ? id : undefined} videoId={type === "video" ? id : undefined} kind={type === "video" ? "video" : "product"} />
          <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} aria-label={t("common.remove")}>×</button>
        </div>
      ))}
      {multiple || !value.length ? <button type="button" className="add" onClick={() => setOpen(true)} aria-label={t("admin.media.choose")} title={t("admin.assets.library")}>+</button> : <button type="button" className="btn btn--secondary btn--sm" onClick={() => setOpen(true)}>{t("admin.assets.library")}</button>}
      <label className="btn btn--secondary btn--sm" aria-disabled={busy}>
        {busy ? t("common.loading") : t("admin.assets.upload")}
        <input type="file" hidden multiple={multiple} accept={type === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/avif,image/svg+xml"} onChange={(e) => (directUpload(e.target.files), (e.target.value = ""))} />
      </label>
      <MediaPicker open={open} onClose={() => setOpen(false)} type={type} multiple={multiple} onPick={(ids) => onChange(multiple ? [...value, ...ids.filter((x) => !value.includes(x))] : ids.slice(0, 1))} />
    </div>
  );
}
