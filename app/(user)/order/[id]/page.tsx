"use client";
import Link from "next/link";
import { use } from "react";
import { useDb, useHydrated } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { Steps } from "@/user/components/checkout/CheckoutFlow";
import { Icon } from "@/shared/components/Icon";

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const d = useDb();
  const hydrated = useHydrated();
  const { t, L, money, date } = useI18n();
  const order = d.orders.find((o) => o.id === id);
  if (!hydrated) return <div className="container section" />;
  if (!order) return <div className="container empty"><h3>{t("order.notFound")}</h3></div>;
  const ok = order.payment.status === "succeeded";
  const branch = d.branches.find((b) => b.id === order.pickupBranchId);

  return (
    <div className="container" style={{ maxWidth: 860 }}>
      <div style={{ paddingTop: "3rem" }}><Steps current={ok ? 4 : 3} /></div>
      <div className="confirm-hero">
        <div className="check-mark" style={!ok ? { borderColor: "var(--color-error)", color: "var(--color-error)" } : undefined}>
          <Icon name={ok ? "check" : "close"} size={30} />
        </div>
        <h1 className="section-title">{ok ? t("order.thanks") : t("order.paymentFailed")}</h1>
        <p className="section-sub">{t("order.number", { number: order.number })} · {date(order.createdAt, true)}</p>
      </div>
      <div className="panel stack" style={{ marginBottom: "var(--section-space)" }}>
        <div className="row row--between"><h2 style={{ margin: 0 }}>{t("order.summary")}</h2><span className="badge">{t(`status.${order.status}`)}</span></div>
        <table className="table">
          <tbody>
            {order.items.map((it, i) => (
              <tr key={i}>
                <td>{L(it.name)}<br /><span className="muted small">{it.sku}{it.size ? ` · ${it.size}` : ""}</span></td>
                <td className="num">× {it.qty}</td>
                <td className="num">{money(it.unitPrice * it.qty)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="kv">
          <dt>{t("cart.subtotal")}</dt><dd className="ltr">{money(order.subtotal)}</dd>
          {order.couponDiscount ? (<><dt>{t("cart.discount")} ({order.couponCode})</dt><dd className="ltr">− {money(order.couponDiscount)}</dd></>) : null}
          <dt>{t("cart.delivery")}</dt><dd className="ltr">{money(order.deliveryFee)}</dd>
          <dt className="kv-total">{t("cart.total")}</dt><dd className="kv-total ltr">{money(order.total)}</dd>
        </dl>
        <p className="muted small">{order.fulfilment === "pickup" ? t("order.pickupAt", { branch: L(branch?.name) }) : t("order.deliverTo", { address: `${order.address?.building}, ${order.address?.street}, ${order.address?.zone}, ${order.address?.city}` })}</p>
        <div className="row">
          {!ok ? <Link className="btn" href="/cart">{t("order.tryAgain")}</Link> : <Link className="btn" href="/account">{t("order.viewAccount")}</Link>}
          <Link className="btn btn--ghost" href="/collections/all">{t("cart.continue")}</Link>
        </div>
      </div>
    </div>
  );
}
