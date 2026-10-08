"use client";
import { useMemo, useState, type MouseEvent } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { FOLDERS, uploadFiles } from "@/shared/services/media";
import { deleteAsset, duplicateAsset, replaceFile, updateAsset, usagesOf } from "@/admin/services/media";
import { PageHead } from "@/admin/components/ui";
import { Media } from "@/shared/components/Media";
import { Modal } from "@/shared/components/Overlay";
import { LocalizedInput, Toggle } from "@/shared/components/Form";
import { MediaField } from "@/admin/components/MediaPicker";
import { useToast } from "@/shared/components/Toast";
import type { MediaAsset, MediaFolder, MediaType } from "@/types";

export default function MediaLibraryPage() {
  const d = useDb();
  const { t, date } = useI18n();
  const { can } = useAdmin();
  const toast = useToast();
  const [folder, setFolder] = useState<MediaFolder | "all">("all");
  const [type, setType] = useState<MediaType | "all">("all");
  const [onlyPlaceholders, setOnlyPlaceholders] = useState(false);
  const [q, setQ] = useState("");
  const [edit, setEdit] = useState<MediaAsset | null>(null);
  const [over, setOver] = useState(false);

  const list = useMemo(
    () => d.media.filter((m) => (folder === "all" || m.folder === folder) && (type === "all" || m.type === type) && (!onlyPlaceholders || !m.url) && (!q || `${m.title} ${m.tags.join(" ")} ${m.alt.en}`.toLowerCase().includes(q.toLowerCase()))),
    [d.media, folder, type, q, onlyPlaceholders],
  );
  const counts = useMemo(() => Object.fromEntries(FOLDERS.map((f) => [f, d.media.filter((m) => m.folder === f).length])), [d.media]);
  const placeholderCount = d.media.filter((m) => !m.url).length;

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const { ids, rejected } = await uploadFiles(files, folder === "all" ? "Homepage" : folder);
    if (ids.length) toast(t("admin.media.uploaded", { count: ids.length }));
    if (rejected.length) toast(t("admin.media.rejected", { files: rejected.join(", ") }), "error");
  };

  const setFocal = (e: MouseEvent<HTMLDivElement>) => {
    if (!edit) return;
    const r = e.currentTarget.getBoundingClientRect();
    setEdit({ ...edit, focalX: Math.round(((e.clientX - r.left) / r.width) * 100), focalY: Math.round(((e.clientY - r.top) / r.height) * 100) });
  };

  return (
    <>
      <PageHead
        title={t("admin.nav.media")}
        sub={t("admin.media.sub", { placeholders: placeholderCount })}
        actions={can("media.upload") ? (
          <label className="btn">{t("admin.media.upload")}<input type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,video/mp4,video/webm,video/quicktime" onChange={(e) => upload(e.target.files)} /></label>
        ) : null}
      />
      <div className="media-layout">
        <nav className="folder-list" aria-label={t("admin.media.folders")}>
          <button aria-current={folder === "all"} onClick={() => setFolder("all")}>{t("admin.media.allFolders")} <span>{d.media.length}</span></button>
          {FOLDERS.map((f) => <button key={f} aria-current={folder === f} onClick={() => setFolder(f)}>{f} <span>{counts[f]}</span></button>)}
        </nav>
        <div>
          <div className="a-toolbar">
            <input className="input" type="search" placeholder={t("admin.search")} value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="select" value={type} onChange={(e) => setType(e.target.value as MediaType | "all")}>
              <option value="all">{t("admin.media.allTypes")}</option>
              <option value="image">{t("admin.media.images")}</option>
              <option value="video">{t("admin.media.videos")}</option>
            </select>
            <label className="check"><input type="checkbox" checked={onlyPlaceholders} onChange={(e) => setOnlyPlaceholders(e.target.checked)} /> {t("admin.media.onlyPlaceholders")}</label>
          </div>
          {can("media.upload") ? (
            <div className={`dropzone${over ? " is-over" : ""}`} style={{ marginBottom: "1rem" }} onDragOver={(e) => (e.preventDefault(), setOver(true))} onDragLeave={() => setOver(false)} onDrop={(e) => (e.preventDefault(), setOver(false), upload(e.dataTransfer.files))}>
              {t("admin.media.drop")}
            </div>
          ) : null}
          <div className="media-grid">
            {list.map((m) => (
              <button key={m.id} className="media-tile" onClick={() => setEdit(structuredClone(m))}>
                <span className="media-type badge">{m.type === "video" ? "▶ " : ""}{m.type}</span>
                <Media mediaId={m.type === "image" ? m.id : m.posterId} videoId={m.type === "video" ? m.id : undefined} kind={m.placeholder} />
                <span className="media-tile-info"><b>{m.title}</b><small>{m.folder} · {m.url ? (m.size ? `${Math.round(m.size / 1024)} KB` : t("admin.media.uploaded1")) : t("admin.media.placeholder")}</small></span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Modal open={!!edit} onClose={() => setEdit(null)} wide title={edit?.title ?? ""} closeLabel={t("common.close")} footer={edit ? (
        <>
          {can("media.delete") ? <button className="btn btn--danger" style={{ marginInlineEnd: "auto" }} onClick={() => {
            const usages = usagesOf(d, edit.id);
            if (usages.length && !window.confirm(t("admin.media.inUse", { list: usages.slice(0, 5).join(", ") }))) return;
            deleteAsset(edit.id, true);
            setEdit(null);
            toast(t("common.deleted"));
          }}>{t("common.delete")}</button> : null}
          {can("media.upload") ? <button className="btn btn--secondary" onClick={async () => { await duplicateAsset(edit.id); toast(t("admin.media.copied")); }}>{t("admin.media.copy")}</button> : null}
          {can("media.update") ? (
            <label className="btn btn--secondary">{t("admin.media.replaceFile")}<input type="file" hidden accept={edit.type === "image" ? "image/*" : "video/*"} onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const ok = await replaceFile(edit.id, f);
              toast(ok ? t("admin.media.replaced") : t("admin.media.wrongType"), ok ? "default" : "error");
              if (ok) setEdit(null);
            }} /></label>
          ) : null}
          {can("media.update") ? <button className="btn" onClick={() => (updateAsset(edit), setEdit(null), toast(t("common.saved")))}>{t("common.save")}</button> : null}
        </>
      ) : null}>
        {edit ? (
          <div className="a-grid-2">
            <div className="stack">
              {edit.type === "image" ? (
                <div className="focal-picker" onClick={setFocal} title={t("admin.media.focalHint")}>
                  <Media mediaId={edit.id} ratio="4/3" kind={edit.placeholder} />
                  {edit.focalX !== undefined ? <span className="focal-dot" style={{ left: `${edit.focalX}%`, top: `${edit.focalY}%` }} /> : null}
                </div>
              ) : (
                <Media videoId={edit.id} mediaId={edit.posterId} ratio="16/9" kind="video" controls />
              )}
              <p className="field-hint">{edit.type === "image" ? t("admin.media.focalHint") : t("admin.media.videoHint")}</p>
              <p className="small muted">{t("admin.media.usedIn")}: {usagesOf(d, edit.id).join(" · ") || "—"}</p>
              <p className="small muted">{t("admin.media.created")}: {date(edit.createdAt, true)} · ID <code>{edit.id}</code></p>
            </div>
            <fieldset disabled={!can("media.update")} style={{ border: 0 }} className="stack">
              <label className="field"><span className="label">{t("admin.media.title")}</span><input className="input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} /></label>
              <LocalizedInput label={t("admin.media.alt")} value={edit.alt} onChange={(v) => setEdit({ ...edit, alt: v })} />
              <label className="field"><span className="label">{t("admin.media.caption")}</span><input className="input" value={edit.caption ?? ""} onChange={(e) => setEdit({ ...edit, caption: e.target.value })} /></label>
              <label className="field"><span className="label">{t("admin.f.description")}</span><textarea className="textarea" value={edit.description ?? ""} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></label>
              <div className="a-form">
                <label className="field"><span className="label">{t("admin.media.folder")}</span><select className="select" value={edit.folder} onChange={(e) => setEdit({ ...edit, folder: e.target.value as MediaFolder })}>{FOLDERS.map((f) => <option key={f}>{f}</option>)}</select></label>
                <label className="field"><span className="label">{t("admin.media.tags")}</span><input className="input" value={edit.tags.join(", ")} onChange={(e) => setEdit({ ...edit, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} /></label>
              </div>
              <label className="field"><span className="label">{t("admin.media.externalUrl")}</span><input className="input" placeholder="https://cdn…" value={edit.url.startsWith("data:") || edit.url.startsWith("blob:") || edit.url.startsWith("idb:") ? "" : edit.url} onChange={(e) => setEdit({ ...edit, url: e.target.value })} /><span className="field-hint">{t("admin.media.externalHint")}</span></label>
              {edit.type === "video" ? (
                <>
                  <div className="field"><span className="label">{t("admin.media.poster")}</span><MediaField value={edit.posterId ? [edit.posterId] : []} onChange={(ids) => setEdit({ ...edit, posterId: ids[0] })} /></div>
                  <div className="a-form">
                    {(["autoplay", "muted", "loop", "controls"] as const).map((k) => <div key={k} className="toggle-row"><span>{t(`admin.media.${k}`)}</span><Toggle checked={!!edit[k]} label={k} onChange={(v) => setEdit({ ...edit, [k]: v })} /></div>)}
                  </div>
                  <label className="field"><span className="label">{t("admin.media.videoType")}</span><select className="select" value={edit.videoType ?? "Product"} onChange={(e) => setEdit({ ...edit, videoType: e.target.value as MediaAsset["videoType"] })}>{["Hero", "Product", "Collection", "Campaign", "Editorial", "Showroom", "Craftsmanship", "Social"].map((v) => <option key={v}>{v}</option>)}</select></label>
                </>
              ) : null}
              <div className="toggle-row"><span>{t("admin.f.active")}</span><Toggle checked={edit.status === "active"} label={t("admin.f.active")} onChange={(v) => setEdit({ ...edit, status: v ? "active" : "archived" })} /></div>
            </fieldset>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
