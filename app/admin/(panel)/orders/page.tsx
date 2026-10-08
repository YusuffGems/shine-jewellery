"use client";
import { useMemo, useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { ORDER_FLOW, refundOrder, updateOrderStatus } from "@/admin/services/orders";
import { PageHead, StatusBadge, EmptyState } from "@/admin/components/ui";
import { Modal } from "@/shared/components/Overlay";
import { useToast } from "@/shared/components/Toast";
import type { Order, OrderStatus } from "@/types";

export default function OrdersAdminPage() {
  const d = useDb();
  const { t, L, money, date } = useI18n();
  const { user, can } = useAdmin();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<OrderStatus | "all">("all");
  const [openId, setOpenId] = useState<string | null>(null);
  const [next, setNext] = useState<OrderStatus>("processing");
  const [note, setNote] = useState("");
  const orders = useMemo(
    () => d.orders.filter((o) => (status === "all" || o.status === status) && (!user?.branchId || o.items.some((i) => i.branchId === user.branchId) || o.pickupBranchId === user.branchId) && (!q || `${o.number} ${o.customerName} ${o.email}`.toLowerCase().includes(q.toLowerCase()))),
    [d.orders, status, q, user?.branchId],
  );
  const order: Order | undefined = d.orders.find((o) => o.id === openId);

  return (
    <>
      <PageHead title={t("admin.nav.orders")} sub={t("admin.orders.sub")} />
      <div className="a-toolbar">
        <input className="input" type="search" placeholder={t("admin.orders.search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="select" value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | "all")}>
          <option value="all">{t("admin.allStatuses")}</option>
          {(["pending_payment", "paid", "confirmed", "processing", "shipped", "ready_for_pickup", "delivered", "cancelled", "refunded", "payment_failed"] as OrderStatus[]).map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
        </select>
        <span className="muted small" style={{ marginInlineStart: "auto" }}>{t("admin.results", { count: orders.length })}</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>{t("order.col.number")}</th><th>{t("order.col.date")}</th><th>{t("admin.orders.customer")}</th><th>{t("checkout.method")}</th><th>{t("admin.orders.payment")}</th><th>{t("order.col.status")}</th><th className="num">{t("cart.total")}</th><th /></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="ltr">{o.number}{o.isDemo ? <span className="badge" style={{ marginInlineStart: 6 }}>demo</span> : null}</td>
                <td>{date(o.createdAt, true)}</td>
                <td>{o.customerName}<br /><small className="muted">{o.email}</small></td>
                <td>{t(o.fulfilment === "pickup" ? "checkout.pickup" : "checkout.homeDelivery")}</td>
                <td><StatusBadge value={o.payment.status} /></td>
                <td><StatusBadge value={o.status} /></td>
                <td className="num">{money(o.total)}</td>
                <td><button className="btn btn--secondary btn--sm" onClick={() => (setOpenId(o.id), setNote(""))}>{t("common.view")}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        {!orders.length ? <EmptyState text={t("admin.noResults")} /> : null}
      </div>

      <Modal open={!!order} onClose={() => setOpenId(null)} wide title={order ? `${t("admin.orders.order")} ${order.number}` : ""} closeLabel={t("common.close")}>
        {order ? (
          <div className="a-grid-3">
            <div>
              <table className="table">
                <thead><tr><th>{t("admin.f.product")}</th><th>{t("admin.nav.showrooms")}</th><th className="num">{t("admin.inventory.qty")}</th><th className="num">{t("admin.pricing.rateAtOrder")}</th><th className="num">{t("price.total")}</th></tr></thead>
                <tbody>
                  {order.items.map((it, i) => (
                    <tr key={i}>
                      <td>{L(it.name)}<br /><small className="muted">{it.sku}{it.size ? ` · ${it.size}` : ""}{it.engraving ? ` · “${it.engraving}”` : ""}</small></td>
                      <td>{L(d.branches.find((b) => b.id === it.branchId)?.name)}</td>
                      <td className="num">{it.qty}</td>
                      <td className="num">{money(it.rateSnapshot.ratePerGram)}</td>
                      <td className="num">{money(it.unitPrice * it.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <dl className="kv" style={{ marginTop: "1rem" }}>
                <dt>{t("cart.subtotal")}</dt><dd>{money(order.subtotal)}</dd>
                <dt>{t("cart.discount")} {order.couponCode ? `(${order.couponCode})` : ""}</dt><dd>− {money(order.couponDiscount)}</dd>
                <dt>{t("cart.delivery")}</dt><dd>{money(order.deliveryFee)}</dd>
                <dt>{t("price.tax", { rate: d.settings.taxRate })}</dt><dd>{money(order.tax)}</dd>
                <dt className="kv-total">{t("cart.total")}</dt><dd className="kv-total">{money(order.total)}</dd>
              </dl>
              <h3 style={{ margin: "1.5rem 0 0.5rem", fontSize: "0.9rem" }}>{t("admin.orders.history")}</h3>
              <table className="table"><tbody>{[...order.history].reverse().map((h, i) => <tr key={i}><td>{date(h.at, true)}</td><td><StatusBadge value={h.status} /></td><td className="muted">{h.note}</td></tr>)}</tbody></table>
            </div>
            <div className="stack">
              <div className="a-card">
                <h2>{t("admin.orders.customer")}</h2>
                <p>{order.customerName}<br /><span className="muted small">{order.email}<br /><span className="ltr">{order.phone}</span></span></p>
                <p className="small" style={{ marginTop: "0.75rem" }}>
                  {order.fulfilment === "pickup" ? `${t("checkout.pickup")}: ${L(d.branches.find((b) => b.id === order.pickupBranchId)?.name)}` : `${order.address?.building}, ${order.address?.street}, ${t("address.zone")} ${order.address?.zone}, ${order.address?.area}, ${order.address?.city}${order.address?.landmark ? ` · ${order.address.landmark}` : ""}`}
                </p>
              </div>
              <div className="a-card">
                <h2>{t("admin.orders.payment")}</h2>
                <p className="small">{order.payment.provider} · <span className="ltr">{order.payment.reference || "—"}</span></p>
                <StatusBadge value={order.payment.status} />
              </div>
              {can("orders.update") ? (
                <div className="a-card stack">
                  <h2>{t("admin.orders.updateStatus")}</h2>
                  <select className="select" value={next} onChange={(e) => setNext(e.target.value as OrderStatus)}>{ORDER_FLOW.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}</select>
                  <input className="input" placeholder={t("admin.inventory.note")} value={note} onChange={(e) => setNote(e.target.value)} />
                  <button className="btn" onClick={() => (updateOrderStatus(order.id, next, note), toast(t("common.saved")))}>{t("common.save")}</button>
                </div>
              ) : null}
              {can("orders.refund") && order.payment.status === "succeeded" ? (
                <button className="btn btn--danger" onClick={async () => {
                  if (!window.confirm(t("admin.orders.confirmRefund"))) return;
                  try { await refundOrder(order.id, true); toast(t("admin.orders.refunded")); } catch { toast(t("admin.orders.refundFailed"), "error"); }
                }}>{t("admin.orders.refund")}</button>
              ) : null}
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
