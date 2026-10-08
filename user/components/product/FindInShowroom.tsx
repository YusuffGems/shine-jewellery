"use client";
import Link from "next/link";
import { useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { stockOf } from "@/shared/services/catalog";
import { track } from "@/shared/services/core";
import { Modal } from "@/shared/components/Overlay";
import { Icon } from "@/shared/components/Icon";
import type { Product } from "@/types";

export function FindInShowroom({ product, open, onClose }: { product: Product; open: boolean; onClose: () => void }) {
  const d = useDb();
  const { t, L } = useI18n();
  const branches = d.branches.filter((b) => b.active).sort((a, b) => a.sort - b.sort);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const b = branches.find((x) => x.id === branchId);
  const qty = b ? stockOf(d, product.id, b.id) : 0;

  return (
    <Modal open={open} onClose={onClose} title={t("product.findInShowroom")} closeLabel={t("common.close")}>
      <div className="stack">
        <label className="field">
          <span className="label">{t("showroom.select")}</span>
          <select className="select" value={branchId} onChange={(e) => (setBranchId(e.target.value), track("showroom_click", { branchId: e.target.value, productId: product.id }))}>
            {branches.map((x) => <option key={x.id} value={x.id}>{L(x.name)}</option>)}
          </select>
        </label>
        {b ? (
          <div className="panel stack">
            <span className={`badge ${qty > 0 ? "badge--success" : "badge--error"}`}>{qty > 0 ? t("showroom.available", { count: qty }) : t("showroom.unavailable")}</span>
            <p><Icon name="pin" size={16} style={{ display: "inline", marginInlineEnd: 6 }} />{L(b.address)}</p>
            <p className="muted small">{[b.zone, b.area, b.city].filter(Boolean).join(" · ")}{b.landmark ? ` · ${b.landmark}` : ""}</p>
            <p className="muted small">{L(b.hours)}</p>
            <div className="row">
              {b.phone ? <a className="btn btn--secondary btn--sm" href={`tel:${b.phone}`}><Icon name="phone" size={14} /> {t("showroom.call")}</a> : null}
              {b.whatsapp ? <a className="btn btn--secondary btn--sm" target="_blank" rel="noopener noreferrer" href={`https://wa.me/${b.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(`${product.sku} — ${product.name.en}`)}`} onClick={() => track("whatsapp_click", { productId: product.id })}><Icon name="chat" size={14} /> WhatsApp</a> : null}
              {b.mapUrl ? <a className="btn btn--secondary btn--sm" target="_blank" rel="noopener noreferrer" href={b.mapUrl}><Icon name="pin" size={14} /> {t("showroom.map")}</a> : null}
              <Link className="btn btn--sm" href={`/appointment?branch=${b.id}&product=${product.id}`} onClick={onClose}>{t("nav.bookAppointment")}</Link>
            </div>
            {!b.phone && !b.mapUrl ? <p className="field-hint">{t("showroom.detailsPending")}</p> : null}
          </div>
        ) : <p className="muted">{t("showroom.none")}</p>}
      </div>
    </Modal>
  );
}
