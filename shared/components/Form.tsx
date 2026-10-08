"use client";
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import type { Localized } from "@/types";

export function Field({ label, hint, error, children, className }: { label: ReactNode; hint?: ReactNode; error?: ReactNode; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={["field", className].filter(Boolean).join(" ")}>
      <label htmlFor={id}>{label}</label>
      {children(id)}
      {error ? <span className="field-error" role="alert">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </div>
  );
}

export function TextInput({ label, hint, error, className, ...rest }: { label: ReactNode; hint?: ReactNode; error?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint} error={error} className={className}>
      {(id) => <input id={id} className="input" aria-invalid={error ? true : undefined} {...rest} />}
    </Field>
  );
}

export function TextArea({ label, hint, className, ...rest }: { label: ReactNode; hint?: ReactNode } & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <Field label={label} hint={hint} className={className}>{(id) => <textarea id={id} className="textarea" {...rest} />}</Field>;
}

export function SelectInput({ label, hint, options, className, ...rest }: { label: ReactNode; hint?: ReactNode; options: { value: string; label: string }[] } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <select id={id} className="select" {...rest}>
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      )}
    </Field>
  );
}

export function Toggle({ checked, onChange, label, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: string; disabled?: boolean }) {
  return <button type="button" role="switch" className="toggle" aria-checked={checked} aria-label={label} disabled={disabled} onClick={() => onChange(!checked)} />;
}

export function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

/** English + Arabic side-by-side input (Arabic field is RTL). */
export function LocalizedInput({ label, value, onChange, multiline, className }: { label: ReactNode; value: Localized; onChange: (v: Localized) => void; multiline?: boolean; className?: string }) {
  const Tag = multiline ? "textarea" : "input";
  const cls = multiline ? "textarea" : "input";
  return (
    <div className={["field", className].filter(Boolean).join(" ")}>
      <span className="label">{label}</span>
      <div className="loc-pair">
        <Tag className={cls} dir="ltr" lang="en" placeholder="English" aria-label={`${label} — English`} value={value.en} onChange={(e) => onChange({ ...value, en: e.target.value })} />
        <Tag className={cls} dir="rtl" lang="ar" placeholder="العربية" aria-label={`${label} — Arabic`} value={value.ar} onChange={(e) => onChange({ ...value, ar: e.target.value })} />
      </div>
    </div>
  );
}

export function ColorInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="tb-swatch">
      {label}
      <span className="color-input">
        <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : "#000000"} onChange={(e) => onChange(e.target.value)} aria-label={label} />
        <input className="input" type="text" value={value} onChange={(e) => onChange(e.target.value)} maxLength={9} aria-label={`${label} hex`} />
      </span>
    </label>
  );
}
