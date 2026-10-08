"use client";
/* ADMIN APP — one replaceable visual slot: preview + Upload new + Replace file + Choose from library + Remove. */
import { useRef, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { uploadFiles } from "@/shared/services/media";
import { replaceFile } from "@/admin/services/media";
import { Media } from "@/shared/components/Media";
import { useToast } from "@/shared/components/Toast";
import { MediaPicker } from "./MediaPicker";
import type { MediaFolder, MediaType } from "@/types";

interface Props {
  label: string;
  hint?: string;
  mediaId?: string;
  type?: MediaType;
  folder: MediaFolder;
  ratio?: string;
  onChange: (id: string | undefined) => void;
  disabled?: boolean;
}

export function AssetSlot({ label, hint, mediaId, type = "image", folder, ratio = "16/10", onChange, disabled }: Props) {
  const d = useDb();
  const { t } = useI18n();
  const toast = useToast();
  const [picker, setPicker] = useState(false);
  const [busy, setBusy] = useState(false);
  const uploadRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const asset = mediaId ? d.media.find((m) => m.id === mediaId) : undefined;
  const accept = type === "video" ? "video/mp4,video/webm,video/quicktime" : "image/jpeg,image/png,image/webp,image/avif,image/svg+xml";

  const upload = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    const { ids, rejected } = await uploadFiles([file], folder);
    setBusy(false);
    if (ids[0]) {
      onChange(ids[0]);
      toast(t("admin.assets.uploaded"));
    } else toast(t("admin.media.rejected", { files: rejected.join(", ") }), "error");
  };

  const replace = async (file?: File) => {
    if (!file || !mediaId) return;
    setBusy(true);
    const ok = await replaceFile(mediaId, file);
    setBusy(false);
    toast(ok ? t("admin.media.replaced") : t("admin.media.wrongType"), ok ? "default" : "error");
  };

  return (
    <div className="asset-slot">
      <div className="asset-slot-preview">
        <Media mediaId={type === "image" ? mediaId : asset?.posterId} videoId={type === "video" ? mediaId : undefined} kind={type === "video" ? "video" : "campaign"} ratio={ratio} controls={type === "video"} />
        {asset?.generated ? <span className="badge badge--warning asset-slot-flag">{t("admin.assets.sample")}</span> : null}
        {!mediaId ? <span className="badge asset-slot-flag">{t("admin.assets.empty")}</span> : null}
      </div>
      <div className="asset-slot-info">
        <b>{label}</b>
        <small className="muted">{asset ? asset.title : t("admin.assets.none")}</small>
        {hint ? <small className="muted">{hint}</small> : null}
      </div>
      <div className="asset-slot-actions">
        <button type="button" className="btn btn--sm" disabled={disabled || busy} onClick={() => uploadRef.current?.click()}>{busy ? t("common.loading") : t("admin.assets.upload")}</button>
        {mediaId ? <button type="button" className="btn btn--secondary btn--sm" disabled={disabled || busy} onClick={() => replaceRef.current?.click()} title={t("admin.assets.replaceHint")}>{t("admin.media.replaceFile")}</button> : null}
        <button type="button" className="btn btn--secondary btn--sm" disabled={disabled} onClick={() => setPicker(true)}>{t("admin.assets.library")}</button>
        {mediaId ? <button type="button" className="btn btn--danger btn--sm" disabled={disabled} onClick={() => onChange(undefined)}>{t("common.remove")}</button> : null}
      </div>
      <input ref={uploadRef} type="file" hidden accept={accept} onChange={(e) => (upload(e.target.files?.[0]), (e.target.value = ""))} />
      <input ref={replaceRef} type="file" hidden accept={accept} onChange={(e) => (replace(e.target.files?.[0]), (e.target.value = ""))} />
      <MediaPicker open={picker} onClose={() => setPicker(false)} type={type} onPick={(ids) => onChange(ids[0])} />
    </div>
  );
}
