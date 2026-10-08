"use client";
import { useState } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { useI18n } from "@/shared/hooks/useI18n";
import { useCustomer } from "@/user/hooks/useShopper";
import { submitPersonalisation } from "@/user/services/engagement";
import { uploadFiles } from "@/shared/services/media";
import { PERSONALISATION_TYPES } from "@/config/site";
import { isEmail, isQatarPhone, sanitizeText } from "@/lib/utils";
import { SelectInput, TextArea, TextInput } from "@/shared/components/Form";
import { Media } from "@/shared/components/Media";
import { Icon } from "@/shared/components/Icon";
import type { PersonalisationRequest } from "@/types";

export default function PersonalisePage() {
  const d = useDb();
  const customer = useCustomer();
  const { t, L } = useI18n();
  const section = d.cms.sections.find((s) => s.type === "personalisation");
  const [type, setType] = useState<PersonalisationRequest["type"]>("Engraving");
  const [form, setForm] = useState({ text: "", notes: "", name: "", phone: "", email: "" });
  const [refId, setRefId] = useState<string>();
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    const name = form.name || customer?.name || "";
    const email = form.email || customer?.email || "";
    const phone = form.phone || customer?.phone || "";
    if (!name.trim() || !isEmail(email) || !isQatarPhone(phone)) return setError(t("appointment.fillDetails"));
    submitPersonalisation({ type, text: sanitizeText(form.text, 120), notes: sanitizeText(form.notes, 1000), referenceMediaId: refId, name, phone, email, customerId: customer?.id });
    setDone(true);
  };

  return (
    <div className="container" style={{ paddingBottom: "var(--section-space)" }}>
      <div className="feature" style={{ paddingTop: "3rem", alignItems: "start" }}>
        <Media mediaId={section?.mediaId} videoId={section?.videoId} ratio="4/5" kind="campaign" />
        <div className="stack" style={{ gap: "1.25rem" }}>
          <span className="eyebrow" style={{ justifyContent: "flex-start" }}>{L(section?.eyebrow)}</span>
          <h1 className="section-title">{L(section?.title) || t("nav.personalise")}</h1>
          <p className="muted">{L(section?.body)}</p>
          {done ? (
            <div className="notice"><Icon name="check" size={18} /> {t("personalise.thanks")}</div>
          ) : (
            <>
              <div className="row">
                {PERSONALISATION_TYPES.map((x) => <button key={x} className="chip" aria-pressed={type === x} onClick={() => setType(x)}>{t(`personalise.type.${x}`, undefined, x)}</button>)}
              </div>
              <TextInput label={type === "Engraving" || type === "Name Jewellery" ? t("personalise.textToEngrave") : t("personalise.idea")} value={form.text} maxLength={120} onChange={(e) => setForm({ ...form, text: e.target.value })} />
              <TextArea label={t("forms.notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <div className="field">
                <span className="label">{t("personalise.reference")}</span>
                <input type="file" accept="image/*" className="input" onChange={async (e) => {
                  if (!e.target.files?.length) return;
                  const { ids } = await uploadFiles(e.target.files, "Products");
                  setRefId(ids[0]);
                }} />
                {refId ? <div style={{ width: 120 }}><Media mediaId={refId} ratio="1" /></div> : null}
              </div>
              {!customer ? (
                <div className="form-grid">
                  <TextInput label={t("forms.name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <TextInput label={t("forms.phone")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                  <TextInput className="span-2" label={t("forms.email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              ) : null}
              <SelectInput label={t("personalise.contactVia")} options={[{ value: "whatsapp", label: "WhatsApp" }, { value: "email", label: t("forms.email") }, { value: "phone", label: t("forms.phone") }]} />
              {error ? <p className="field-error">{error}</p> : null}
              <button className="btn" style={{ justifySelf: "start" }} onClick={submit}>{t("personalise.submit")}</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
