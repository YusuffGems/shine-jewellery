"use client";
import { useMemo, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { available, stockStatus } from "@/lib/inventory/stock";
import { adjustStock, markDamaged, transferStock } from "@/admin/services/inventory";
import { PageHead, StatusBadge } from "@/admin/components/ui";
import { Modal } from "@/shared/components/Overlay";
import { useToast } from "@/shared/components/Toast";

type Action = { kind: "adjust" | "transfer" | "damage"; productId: string; branchId: string };

export default function InventoryPage() {
  const d = useDb();
  const { t, L, date } = useI18n();
  const { user, can } = useAdmin();
  const toast = useToast();
  const [tab, setTab] = useState<"stock" | "reservations" | "transactions">("stock");
  const [q, setQ] = useState("");
  const [onlyLow, setOnlyLow] = useState(false);
  const [action, setAction] = useState<Action | null>(null);
  const [form, setForm] = useState({ qty: 1, note: "", to: "" });
  // Branch managers see only their branch.
  const branches = d.branches.filter((b) => !user?.branchId || b.id === user.branchId);
  const editable = can("inventory.update");

  const rows = useMemo(
    () =>
      d.products
        .filter((p) => !q || `${p.name.en} ${p.sku}`.toLowerCase().includes(q.toLowerCase()))
        .map((p) => {
          const recs = branches.map((b) => d.inventory.find((r) => r.productId === p.id && r.branchId === b.id));
          const totalAvail = recs.reduce((s, r) => s + (r ? available(r) : 0), 0);
          return { p, recs, totalAvail };
        })
        .filter((r) => !onlyLow || r.totalAvail <= d.settings.lowStockThreshold),
    [d, q, onlyLow, branches],
  );

  const run = () => {
    if (!action) return;
    try {
      if (action.kind === "adjust") adjustStock(action.productId, action.branchId, form.qty, form.note || "Manual adjustment");
      if (action.kind === "damage") markDamaged(action.productId, action.branchId, form.qty, form.note || "Damaged");
      if (action.kind === "transfer") transferStock(action.productId, action.branchId, form.to, form.qty);
      toast(t("common.saved"));
      setAction(null);
    } catch (e) {
      toast(t(`admin.inventory.error.${(e as Error).message}`, undefined, (e as Error).message), "error");
    }
  };

  return (
    <>
      <PageHead title={t("admin.nav.inventory")} sub={t("admin.inventory.sub")} />
      <div className="tabs" role="tablist" style={{ marginBottom: "1rem" }}>
        {(["stock", "reservations", "transactions"] as const).map((x) => <button key={x} role="tab" className="tab" aria-selected={tab === x} onClick={() => setTab(x)}>{t(`admin.inventory.tab.${x}`)}</button>)}
      </div>

      {tab === "stock" ? (
        <>
          <div className="a-toolbar">
            <input className="input" type="search" placeholder={t("admin.search")} value={q} onChange={(e) => setQ(e.target.value)} />
            <label className="check"><input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} /> {t("admin.inventory.onlyLow")}</label>
          </div>
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>{t("admin.f.product")}</th>{branches.map((b) => <th key={b.id} className="num">{L(b.name)}</th>)}<th className="num">{t("admin.inventory.available")}</th><th>{t("admin.f.status")}</th></tr></thead>
              <tbody>
                {rows.map(({ p, recs, totalAvail }) => (
                  <tr key={p.id}>
                    <td><b style={{ fontWeight: 500 }}>{L(p.name)}</b><br /><small className="muted ltr">{p.sku}</small></td>
                    {branches.map((b, i) => {
                      const r = recs[i];
                      return (
                        <td key={b.id} className="num">
                          <span title={r ? `${t("admin.inventory.total")} ${r.total} · ${t("admin.inventory.reserved")} ${r.reserved} · ${t("admin.inventory.sold")} ${r.sold} · ${t("admin.inventory.damaged")} ${r.damaged} · ${t("admin.inventory.returned")} ${r.returned} · ${t("admin.inventory.transferred")} ${r.transferred}` : ""}>
                            {r ? available(r) : 0}
                            {r?.reserved ? <small className="muted"> ({r.reserved}R)</small> : null}
                          </span>
                          {editable ? (
                            <span className="row" style={{ justifyContent: "flex-end", gap: 2, marginTop: 4 }}>
                              <button className="btn btn--secondary btn--sm" style={{ minHeight: 24, padding: "0 6px" }} onClick={() => (setAction({ kind: "adjust", productId: p.id, branchId: b.id }), setForm({ qty: 1, note: "", to: "" }))}>±</button>
                              <button className="btn btn--secondary btn--sm" style={{ minHeight: 24, padding: "0 6px" }} onClick={() => (setAction({ kind: "transfer", productId: p.id, branchId: b.id }), setForm({ qty: 1, note: "", to: d.branches.find((x) => x.id !== b.id)?.id ?? "" }))} title={t("admin.inventory.transfer")}>⇄</button>
                              <button className="btn btn--secondary btn--sm" style={{ minHeight: 24, padding: "0 6px" }} onClick={() => (setAction({ kind: "damage", productId: p.id, branchId: b.id }), setForm({ qty: 1, note: "", to: "" }))} title={t("admin.inventory.damage")}>✕</button>
                            </span>
                          ) : null}
                        </td>
                      );
                    })}
                    <td className="num"><b>{totalAvail}</b></td>
                    <td><StatusBadge value={stockStatus(totalAvail, d.settings.lowStockThreshold)} label={t(`admin.inventory.level.${stockStatus(totalAvail, d.settings.lowStockThreshold)}`)} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}

      {tab === "reservations" ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t("order.col.number")}</th><th>{t("admin.f.product")}</th><th>{t("admin.nav.showrooms")}</th><th className="num">{t("admin.inventory.qty")}</th><th>{t("order.col.date")}</th></tr></thead>
            <tbody>
              {d.orders.filter((o) => o.payment.status === "pending").flatMap((o) => o.items.map((it, i) => (
                <tr key={o.id + i}><td className="ltr">{o.number}</td><td>{L(it.name)}</td><td>{L(d.branches.find((b) => b.id === it.branchId)?.name)}</td><td className="num">{it.qty}</td><td>{date(o.createdAt, true)}</td></tr>
              )))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "transactions" ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>{t("order.col.date")}</th><th>{t("admin.f.product")}</th><th>{t("admin.nav.showrooms")}</th><th>{t("admin.inventory.kind")}</th><th className="num">{t("admin.inventory.qty")}</th><th>{t("admin.inventory.note")}</th><th>{t("admin.audit.user")}</th></tr></thead>
            <tbody>
              {d.inventoryTx.slice(0, 200).map((x) => (
                <tr key={x.id}><td>{date(x.at, true)}</td><td>{L(d.products.find((p) => p.id === x.productId)?.name)}</td><td>{L(d.branches.find((b) => b.id === x.branchId)?.name)}</td><td><span className="badge">{x.kind}</span></td><td className="num">{x.qty}</td><td>{x.note}</td><td className="muted">{x.by}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <Modal open={!!action} onClose={() => setAction(null)} title={action ? t(`admin.inventory.${action.kind}`) : ""} closeLabel={t("common.close")} footer={<><button className="btn btn--secondary" onClick={() => setAction(null)}>{t("common.cancel")}</button><button className="btn" onClick={run}>{t("common.save")}</button></>}>
        {action ? (
          <div className="a-form">
            <p className="span-2 muted">{L(d.products.find((p) => p.id === action.productId)?.name)} · {L(d.branches.find((b) => b.id === action.branchId)?.name)}</p>
            <label className="field"><span className="label">{action.kind === "adjust" ? t("admin.inventory.delta") : t("admin.inventory.qty")}</span><input className="input" type="number" value={form.qty} onChange={(e) => setForm({ ...form, qty: Number(e.target.value) })} /></label>
            {action.kind === "transfer" ? (
              <label className="field"><span className="label">{t("admin.inventory.to")}</span><select className="select" value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })}>{d.branches.filter((b) => b.id !== action.branchId).map((b) => <option key={b.id} value={b.id}>{L(b.name)}</option>)}</select></label>
            ) : (
              <label className="field"><span className="label">{t("admin.inventory.note")}</span><input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></label>
            )}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
