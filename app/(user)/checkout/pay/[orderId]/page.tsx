"use client";
/* Mock hosted payment page. A real gateway redirects here back with a signed result;
   card details are entered on the provider's page, never on SHINE. */
import Link from "next/link";
import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { useDb, useHydrated } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { handlePaymentResult } from "@/shared/services/orderLifecycle";
import { Steps } from "@/user/components/checkout/CheckoutFlow";
import { Icon } from "@/shared/components/Icon";

export default function MockPaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = use(params);
  const d = useDb();
  const hydrated = useHydrated();
  const router = useRouter();
  const { t, money } = useI18n();
  const [busy, setBusy] = useState(false);
  const order = d.orders.find((o) => o.id === orderId);

  if (!hydrated) return <div className="container section" />;
  if (!order) return <div className="container empty"><h3>{t("order.notFound")}</h3></div>;

  const finish = (ok: boolean) => {
    setBusy(true);
    setTimeout(() => {
      handlePaymentResult(order.id, ok ? "succeeded" : "failed", order.payment.idempotencyKey);
      router.push(`/order/${order.id}`);
    }, 900);
  };

  return (
    <div className="container">
      <h1 className="page-title">{t("checkout.title")}</h1>
      <Steps current={3} />
      <div className="mock-gateway">
        <Icon name="lock" size={28} style={{ margin: "0 auto", color: "var(--color-gold)" }} />
        <span className="badge" style={{ justifySelf: "center" }}>{t("payment.mockBadge")}</span>
        <h2 className="section-title" style={{ fontSize: "1.8rem" }}>{t("payment.title")}</h2>
        <p className="muted">{t("payment.order", { number: order.number })}</p>
        <p className="price price--lg ltr">{money(order.total)}</p>
        <p className="small muted">{t("payment.mockNote")}</p>
        {order.payment.status === "pending" ? (
          <>
            <button className="btn btn--block" disabled={busy} onClick={() => finish(true)}>{busy ? t("common.loading") : t("payment.simulateSuccess")}</button>
            <button className="btn btn--danger btn--block" disabled={busy} onClick={() => finish(false)}>{t("payment.simulateFailure")}</button>
          </>
        ) : (
          <Link className="btn btn--block" href={`/order/${order.id}`}>{t("payment.viewOrder")}</Link>
        )}
      </div>
    </div>
  );
}
