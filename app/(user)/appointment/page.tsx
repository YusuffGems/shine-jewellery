"use client";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDb, useHydrated } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useCustomer } from "@/user/hooks/useShopper";
import { bookAppointment, bookedSlots, timeSlots } from "@/user/services/engagement";
import { APPOINTMENT_SERVICES } from "@/config/site";
import { isEmail, isQatarPhone, sanitizeText } from "@/lib/utils";
import { TextArea, TextInput } from "@/shared/components/Form";
import { Icon } from "@/shared/components/Icon";

const STEPS = ["showroom", "service", "date", "time", "details", "confirmation"] as const;

function todayPlus(days: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + days);
  return dt.toISOString().slice(0, 10);
}

function AppointmentInner() {
  const d = useDb();
  const hydrated = useHydrated();
  const params = useSearchParams();
  const customer = useCustomer();
  const { t, L, date: fmt } = useI18n();
  const branches = d.branches.filter((b) => b.active);
  const [step, setStep] = useState(params.get("branch") ? 1 : 0);
  const [branchId, setBranchId] = useState(params.get("branch") ?? "");
  const [service, setService] = useState("");
  const [date, setDate] = useState(todayPlus(1));
  const [time, setTime] = useState("");
  const [form, setForm] = useState({ name: customer?.name ?? "", phone: customer?.phone ?? "", email: customer?.email ?? "", notes: "" });
  const [error, setError] = useState("");
  const productId = params.get("product") ?? undefined;
  const product = d.products.find((p) => p.id === productId);
  const slots = useMemo(() => timeSlots(date), [date]);
  const taken = useMemo(() => (branchId ? bookedSlots(branchId, date) : []), [branchId, date, d.appointments]); // eslint-disable-line react-hooks/exhaustive-deps
  const days = Array.from({ length: 14 }, (_, i) => todayPlus(i + 1));

  const confirm = () => {
    if (!form.name.trim() || !isQatarPhone(form.phone) || !isEmail(form.email)) return setError(t("appointment.fillDetails"));
    bookAppointment({ branchId, service, date, time, name: sanitizeText(form.name, 80), phone: form.phone.trim(), email: form.email.trim(), notes: sanitizeText(form.notes, 600), productId, customerId: customer?.id });
    setStep(5);
  };

  if (!hydrated) return <div className="container section" />;
  return (
    <div className="container wizard">
      <div className="section-head" style={{ paddingTop: "4rem" }}>
        <span className="eyebrow">{t("appointment.eyebrow")}</span>
        <h1 className="section-title">{t("nav.bookAppointment")}</h1>
        {product ? <p className="section-sub">{t("appointment.forProduct", { name: L(product.name) })}</p> : null}
      </div>
      <ol className="steps" style={{ justifyContent: "center" }}>
        {STEPS.map((s, i) => <li key={s} className="step" data-state={i < step ? "done" : i === step ? "current" : "todo"}><b>{i < step ? "✓" : i + 1}</b> {t(`appointment.step.${s}`)}</li>)}
      </ol>

      {step === 0 ? (
        <div className="choice-grid">
          {branches.map((b) => (
            <button key={b.id} className="choice" aria-pressed={branchId === b.id} onClick={() => (setBranchId(b.id), setStep(1))}>
              <strong>{L(b.name)}</strong><small>{L(b.address)}</small>
            </button>
          ))}
        </div>
      ) : null}
      {step === 1 ? (
        <div className="choice-grid">
          {APPOINTMENT_SERVICES.map((s) => (
            <button key={s} className="choice" aria-pressed={service === s} onClick={() => (setService(s), setStep(2))}>{t(`service.${s}`, undefined, s)}</button>
          ))}
        </div>
      ) : null}
      {step === 2 ? (
        <div className="slot-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))" }}>
          {days.map((x) => <button key={x} aria-pressed={date === x} onClick={() => (setDate(x), setTime(""), setStep(3))} style={{ height: 64 }}>{fmt(`${x}T12:00:00Z`)}</button>)}
        </div>
      ) : null}
      {step === 3 ? (
        <div className="slot-grid">
          {slots.map((s) => <button key={s} className="ltr" disabled={taken.includes(s)} aria-pressed={time === s} onClick={() => (setTime(s), setStep(4))}>{s}</button>)}
        </div>
      ) : null}
      {step === 4 ? (
        <div className="panel stack">
          <p className="notice">{L(branches.find((b) => b.id === branchId)?.name)} · {t(`service.${service}`, undefined, service)} · <span className="ltr">{fmt(`${date}T12:00:00Z`)} {time}</span></p>
          <div className="form-grid">
            <TextInput label={t("forms.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <TextInput label={t("forms.phone")} hint={t("forms.phoneHint")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <TextInput className="span-2" label={t("forms.email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <TextArea className="span-2" label={t("forms.notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          {error ? <p className="field-error">{error}</p> : null}
          <button className="btn" style={{ justifySelf: "start" }} onClick={confirm}>{t("appointment.confirm")}</button>
        </div>
      ) : null}
      {step === 5 ? (
        <div className="confirm-hero">
          <div className="check-mark"><Icon name="check" size={30} /></div>
          <h2 className="section-title">{t("appointment.requested")}</h2>
          <p className="section-sub">{t("appointment.requestedHint")}</p>
        </div>
      ) : null}
      {step > 0 && step < 5 ? <button className="btn btn--ghost" style={{ marginTop: "2rem" }} onClick={() => setStep(step - 1)}>{t("checkout.back")}</button> : null}
    </div>
  );
}

export default function AppointmentPage() {
  return <Suspense><AppointmentInner /></Suspense>;
}
