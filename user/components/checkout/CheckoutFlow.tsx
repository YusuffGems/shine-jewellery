"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useDb, useHydrated } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useCart, useCustomer } from "@/user/hooks/useShopper";
import { placeOrder } from "@/user/services/shopping";
import { saveAddress } from "@/user/services/account";
import { track } from "@/shared/services/core";
import { isEmail, isQatarPhone, uid } from "@/lib/utils";
import { TextInput } from "@/shared/components/Form";
import { Media } from "@/shared/components/Media";
import { useToast } from "@/shared/components/Toast";
import type { Address } from "@/types";

const STEPS = ["customer", "delivery", "review", "payment", "confirmation"] as const;

export function Steps({ current }: { current: number }) {
  const { t } = useI18n();
  return (
    <ol className="steps" aria-label={t("checkout.progress")}>
      {STEPS.map((s, i) => (
        <li key={s} className="step" data-state={i < current ? "done" : i === current ? "current" : "todo"} aria-current={i === current ? "step" : undefined}>
          <b>{i < current ? "✓" : i + 1}</b> {t(`checkout.step.${s}`)}
        </li>
      ))}
    </ol>
  );
}

const emptyAddress = (): Address => ({ id: uid("adr"), label: "Home", fullName: "", phone: "", building: "", street: "", zone: "", area: "", city: "Doha", landmark: "", directions: "", country: "Qatar" });

export function CheckoutFlow() {
  const d = useDb();
  const hydrated = useHydrated();
  const router = useRouter();
  const toast = useToast();
  const { t, L, money } = useI18n();
  const customer = useCustomer();
  const [step, setStep] = useState(0);
  const [info, setInfo] = useState({ name: "", email: "", phone: "" });
  const [fulfilment, setFulfilment] = useState<"delivery" | "pickup">("delivery");
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [saveAddr, setSaveAddr] = useState(true);
  const branches = d.branches.filter((b) => b.active);
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const { items, summary } = useCart(fulfilment, fulfilment === "pickup" ? branchId : undefined);

  useEffect(() => {
    if (customer) {
      setInfo((i) => ({ name: i.name || customer.name, email: i.email || customer.email, phone: i.phone || customer.phone }));
      if (customer.addresses[0]) setAddress(customer.addresses[0]);
    }
  }, [customer]);
  useEffect(() => {
    if (hydrated) track("checkout_start", { items: items.length });
  }, [hydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  if (hydrated && !items.length) {
    return <div className="container empty" style={{ paddingBlock: "6rem" }}><h3>{t("cart.empty")}</h3><Link className="btn" href="/collections/all">{t("cart.continue")}</Link></div>;
  }

  const validateCustomer = () => {
    const e: Record<string, string> = {};
    if (!info.name.trim()) e.name = t("forms.required");
    if (!isEmail(info.email)) e.email = t("forms.invalidEmail");
    if (!isQatarPhone(info.phone)) e.phone = t("forms.invalidPhone");
    setErrors(e);
    return !Object.keys(e).length;
  };
  const validateDelivery = () => {
    const e: Record<string, string> = {};
    if (fulfilment === "delivery") {
      for (const k of ["building", "street", "zone", "area", "city"] as const) if (!address[k].trim()) e[k] = t("forms.required");
    } else if (!branchId) e.branch = t("forms.required");
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    setSubmitting(true);
    if (customer && fulfilment === "delivery" && saveAddr && !customer.addresses.some((a) => a.id === address.id)) saveAddress(customer.id, { ...address, fullName: address.fullName || info.name, phone: address.phone || info.phone });
    const res = await placeOrder({
      customerId: customer?.id ?? "guest",
      name: info.name.trim(),
      email: info.email.trim().toLowerCase(),
      phone: info.phone.trim(),
      fulfilment,
      address: fulfilment === "delivery" ? { ...address, fullName: address.fullName || info.name, phone: address.phone || info.phone } : undefined,
      pickupBranchId: fulfilment === "pickup" ? branchId : undefined,
      couponCode: d.session.couponCode,
    });
    setSubmitting(false);
    if (!res.ok) return toast(t(`checkout.error.${res.error}`), "error");
    router.push(res.redirectUrl);
  };

  const A = (k: keyof Address, required = false) => (
    <TextInput label={`${t(`address.${k}`)}${required ? " *" : ""}`} value={address[k]} error={errors[k]} onChange={(e) => setAddress({ ...address, [k]: e.target.value })} />
  );

  return (
    <div className="container">
      <h1 className="page-title">{t("checkout.title")}</h1>
      <Steps current={step} />
      <div className="checkout-layout">
        <div className="stack" style={{ gap: "1.5rem" }}>
          {step === 0 ? (
            <section className="panel">
              <h2>{t("checkout.step.customer")}</h2>
              {!customer ? <p className="notice" style={{ marginBottom: "1.25rem" }}>{t("checkout.guestNote")} <Link href="/account?next=/checkout" className="btn btn--ghost btn--sm">{t("account.signIn")}</Link></p> : null}
              <div className="form-grid">
                <TextInput className="span-2" label={`${t("forms.name")} *`} value={info.name} error={errors.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} autoComplete="name" />
                <TextInput label={`${t("forms.email")} *`} type="email" value={info.email} error={errors.email} onChange={(e) => setInfo({ ...info, email: e.target.value })} autoComplete="email" />
                <TextInput label={`${t("forms.phone")} *`} type="tel" value={info.phone} error={errors.phone} hint={t("forms.phoneHint")} onChange={(e) => setInfo({ ...info, phone: e.target.value })} autoComplete="tel" />
              </div>
              <div className="row" style={{ marginTop: "1.5rem", justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => validateCustomer() && setStep(1)}>{t("checkout.continue")}</button>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className="panel stack">
              <h2>{t("checkout.step.delivery")}</h2>
              <div className="form-grid">
                <label className="option-card">
                  <input type="radio" name="ful" checked={fulfilment === "delivery"} onChange={() => setFulfilment("delivery")} />
                  <span><strong>{t("checkout.homeDelivery")}</strong><br /><span className="muted small">{t("checkout.homeDeliveryHint")}</span></span>
                </label>
                <label className="option-card">
                  <input type="radio" name="ful" checked={fulfilment === "pickup"} onChange={() => setFulfilment("pickup")} />
                  <span><strong>{t("checkout.pickup")}</strong><br /><span className="muted small">{t("checkout.pickupHint")}</span></span>
                </label>
              </div>
              {fulfilment === "delivery" ? (
                <>
                  {customer?.addresses.length ? (
                    <div className="row">
                      {customer.addresses.map((a) => (
                        <button key={a.id} className="chip" aria-pressed={address.id === a.id} onClick={() => setAddress(a)}>{a.label} · {a.zone}</button>
                      ))}
                      <button className="chip" onClick={() => setAddress(emptyAddress())}>+ {t("address.new")}</button>
                    </div>
                  ) : null}
                  <div className="form-grid">
                    {A("building", true)}{A("street", true)}{A("zone", true)}{A("area", true)}{A("city", true)}{A("landmark")}
                    <TextInput className="span-2" label={t("address.directions")} value={address.directions} onChange={(e) => setAddress({ ...address, directions: e.target.value })} />
                    <TextInput label={t("address.country")} value="Qatar" readOnly />
                  </div>
                  {customer ? <label className="check"><input type="checkbox" checked={saveAddr} onChange={(e) => setSaveAddr(e.target.checked)} /> {t("address.save")}</label> : null}
                </>
              ) : (
                <div className="stack">
                  {branches.map((b) => (
                    <label key={b.id} className="option-card">
                      <input type="radio" name="branch" checked={branchId === b.id} onChange={() => setBranchId(b.id)} />
                      <span><strong>{L(b.name)}</strong><br /><span className="muted small">{L(b.address)} · {L(b.hours)}</span></span>
                    </label>
                  ))}
                </div>
              )}
              {summary.hasIssues ? <p className="notice notice--error">{t("checkout.stockIssue")}</p> : null}
              <div className="row row--between">
                <button className="btn btn--secondary" onClick={() => setStep(0)}>{t("checkout.back")}</button>
                <button className="btn" disabled={summary.hasIssues} onClick={() => validateDelivery() && setStep(2)}>{t("checkout.continue")}</button>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className="panel stack">
              <h2>{t("checkout.step.review")}</h2>
              <dl className="kv">
                <dt>{t("forms.name")}</dt><dd>{info.name}</dd>
                <dt>{t("forms.email")}</dt><dd>{info.email}</dd>
                <dt>{t("forms.phone")}</dt><dd className="ltr">{info.phone}</dd>
                <dt>{t("checkout.method")}</dt>
                <dd>{fulfilment === "delivery" ? `${address.building}, ${address.street}, ${t("address.zone")} ${address.zone}, ${address.area}, ${address.city}` : L(branches.find((b) => b.id === branchId)?.name)}</dd>
              </dl>
              <p className="notice">{t("checkout.priceLock", { minutes: d.settings.priceLockMinutes })}</p>
              <div className="row row--between">
                <button className="btn btn--secondary" onClick={() => setStep(1)}>{t("checkout.back")}</button>
                <button className="btn" disabled={submitting || summary.hasIssues} onClick={submit}>{submitting ? t("common.loading") : t("checkout.placeOrder")}</button>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="summary">
          <h2>{t("cart.summary")}</h2>
          {summary.lines.map((l) => {
            const p = d.products.find((x) => x.id === l.productId)!;
            return (
              <div key={l.item.key} className="row" style={{ flexWrap: "nowrap", alignItems: "flex-start" }}>
                <div style={{ width: 64, flex: "none" }}><Media mediaId={p.imageIds[0]} ratio="4/5" kind="product" /></div>
                <div className="grow small">{L(p.name)}<br /><span className="muted">× {l.item.qty}{l.item.size ? ` · ${l.item.size}` : ""}</span></div>
                <span className="small ltr">{money(l.lineTotal)}</span>
              </div>
            );
          })}
          <dl className="kv">
            <dt>{t("cart.subtotal")}</dt><dd className="ltr">{money(summary.subtotal)}</dd>
            {summary.couponDiscount ? (<><dt>{t("cart.discount")}</dt><dd className="ltr">− {money(summary.couponDiscount)}</dd></>) : null}
            <dt>{t("cart.delivery")}</dt><dd>{summary.deliveryFee ? <span className="ltr">{money(summary.deliveryFee)}</span> : t("cart.free")}</dd>
            <dt className="kv-total">{t("cart.total")}</dt><dd className="kv-total ltr">{money(summary.total)}</dd>
          </dl>
        </aside>
      </div>
    </div>
  );
}
