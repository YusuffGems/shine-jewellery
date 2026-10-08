"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useHydrated } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useAdmin } from "@/admin/hooks/useAdmin";
import { loginAdmin, setAdminPassword } from "@/admin/services/auth";
import { db } from "@/lib/store/db";
import { TextInput } from "@/shared/components/Form";
import { AdminLangSwitch } from "@/admin/components/AdminSwitchers";
import { Modal } from "@/shared/components/Overlay";

function LoginInner() {
  const { t } = useI18n();
  const router = useRouter();
  const next = useSearchParams().get("next");
  const hydrated = useHydrated();
  const { user } = useAdmin();
  const [form, setForm] = useState({ email: "", password: "", remember: false });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [reset, setReset] = useState({ email: "", password: "", sent: false });

  useEffect(() => {
    if (hydrated && user) router.replace(next?.startsWith("/admin") ? next : "/admin");
  }, [hydrated, user, next, router]);

  const submit = async () => {
    setBusy(true);
    setError("");
    const res = await loginAdmin(form.email, form.password, form.remember);
    setBusy(false);
    if (!res.ok) setError(t(`admin.login.${res.error}`));
  };

  return (
    <div className="login-split">
      <div className="login-art">
        <div className="admin-brand" style={{ position: "relative", zIndex: 1 }}><b>SHINE</b><span>{t("admin.badge")}</span></div>
        <h2>{t("admin.login.tagline")}</h2>
        <p style={{ position: "relative", zIndex: 1, opacity: 0.6, fontSize: "0.8rem" }}>{t("admin.login.secure")}</p>
      </div>
      <div className="login-form-wrap">
        <form className="login-form" onSubmit={(e) => (e.preventDefault(), submit())}>
          <div className="row row--between"><span className="eyebrow" style={{ margin: 0 }}>{t("admin.login.eyebrow")}</span><AdminLangSwitch /></div>
          <h1>{t("admin.login.title")}</h1>
          <TextInput label={t("forms.email")} type="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <TextInput label={t("forms.password")} type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <div className="row row--between">
            <label className="check"><input type="checkbox" checked={form.remember} onChange={(e) => setForm({ ...form, remember: e.target.checked })} /> {t("admin.login.remember")}</label>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setForgot(true)}>{t("admin.login.forgot")}</button>
          </div>
          {error ? <p className="notice notice--error" role="alert">{error}</p> : null}
          <button className="btn btn--block" disabled={busy}>{busy ? t("common.loading") : t("admin.login.submit")}</button>
          <div className="demo-creds">
            {t("admin.login.demo")}<br />
            <code>admin@shine.demo</code> · <code>Admin@123</code><br />
            <code>content@shine.demo</code> · <code>branch@shine.demo</code>
          </div>
          <p className="field-hint">{t("admin.login.twoFactor")}</p>
        </form>
      </div>
      <Modal open={forgot} onClose={() => setForgot(false)} title={t("admin.login.forgot")} closeLabel={t("common.close")}>
        {reset.sent ? (
          <p className="notice">{t("admin.login.resetDone")}</p>
        ) : (
          <div className="stack">
            <p className="muted small">{t("admin.login.resetHint")}</p>
            <TextInput label={t("forms.email")} value={reset.email} onChange={(e) => setReset({ ...reset, email: e.target.value })} />
            <TextInput label={t("auth.newPassword")} type="password" hint={t("auth.passwordRule")} value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} />
            <button className="btn" onClick={async () => {
              const u = db.get().adminUsers.find((x) => x.email === reset.email.trim().toLowerCase());
              if (u) await setAdminPassword(u.id, reset.password);
              setReset({ ...reset, sent: true });
            }}>{t("admin.login.resetSubmit")}</button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AdminLoginPage() {
  return <Suspense><LoginInner /></Suspense>;
}
