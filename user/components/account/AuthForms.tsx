"use client";
import { useState } from "react";
import { useI18n } from "@/shared/hooks/useI18n";
import { loginCustomer, registerCustomer } from "@/user/services/account";
import { TextInput } from "@/shared/components/Form";

export function CustomerAuth({ onDone }: { onDone?: () => void }) {
  const { t } = useI18n();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    const res = mode === "login" ? await loginCustomer(form.email, form.password) : await registerCustomer(form.name, form.email, form.phone, form.password);
    setBusy(false);
    if (!res.ok) return setError(t(`auth.error.${res.error}`));
    onDone?.();
  };

  return (
    <form className="auth-card" onSubmit={(e) => (e.preventDefault(), submit())}>
      <span className="eyebrow" style={{ justifySelf: "center" }}>{t("account.welcome")}</span>
      <h1>{mode === "login" ? t("account.signIn") : t("account.create")}</h1>
      <div className="tabs" role="tablist" style={{ justifyContent: "center" }}>
        <button type="button" role="tab" className="tab" aria-selected={mode === "login"} onClick={() => setMode("login")}>{t("account.signIn")}</button>
        <button type="button" role="tab" className="tab" aria-selected={mode === "register"} onClick={() => setMode("register")}>{t("account.create")}</button>
      </div>
      {mode === "register" ? <TextInput label={t("forms.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoComplete="name" required /> : null}
      <TextInput label={t("forms.email")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" required />
      {mode === "register" ? <TextInput label={t("forms.phone")} type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} autoComplete="tel" /> : null}
      <TextInput label={t("forms.password")} type="password" value={form.password} hint={mode === "register" ? t("auth.passwordRule") : undefined} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
      {error ? <p className="field-error" role="alert">{error}</p> : null}
      <button className="btn btn--block" disabled={busy}>{busy ? t("common.loading") : mode === "login" ? t("account.signIn") : t("account.create")}</button>
      {mode === "login" ? <p className="field-hint" style={{ textAlign: "center" }}>{t("auth.demoCustomer")}</p> : null}
    </form>
  );
}
