"use client";
import type { ReactNode } from "react";
import { useI18n } from "@/shared/hooks/useI18n";

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h1>{title}</h1>
        {sub ? <p>{sub}</p> : null}
      </div>
      {actions ? <div className="row">{actions}</div> : null}
    </div>
  );
}

export function Stat({ label, value, note, alert }: { label: string; value: ReactNode; note?: string; alert?: boolean }) {
  return (
    <div className={`stat${alert ? " stat--alert" : ""}`}>
      <span>{label}</span>
      <b>{value}</b>
      {note ? <small>{note}</small> : null}
    </div>
  );
}

export function BarChart({ data, format }: { data: { label: string; value: number }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="chart" role="img" aria-label={data.map((d) => `${d.label}: ${format ? format(d.value) : d.value}`).join(", ")}>
      <div className="chart-bars">
        {data.map((d) => (
          <div key={d.label} className="chart-bar" style={{ height: `${(d.value / max) * 100}%` }}>
            <span>{format ? format(d.value) : d.value}</span>
          </div>
        ))}
      </div>
      <div className="chart-labels">{data.map((d) => <span key={d.label}>{d.label}</span>)}</div>
    </div>
  );
}

export function HBars({ data, format }: { data: { label: string; value: number }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div>
      {data.map((d) => (
        <div key={d.label} className="hbar">
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.label}</span>
          <span className="hbar-track"><span className="hbar-fill" style={{ display: "block", width: `${(d.value / max) * 100}%` }} /></span>
          <span className="num">{format ? format(d.value) : d.value}</span>
        </div>
      ))}
    </div>
  );
}

const TONE: Record<string, string> = {
  active: "success", live: "success", succeeded: "success", delivered: "success", confirmed: "success", paid: "success", completed: "success", in: "success",
  pending: "warning", pending_payment: "warning", requested: "warning", new: "warning", draft: "warning", demo: "warning", manual: "warning", low: "warning", processing: "warning", in_review: "warning",
  failed: "error", payment_failed: "error", cancelled: "error", refunded: "error", out: "error", inactive: "error", stale: "error",
};

export function StatusBadge({ value, label }: { value: string; label?: string }) {
  const { t } = useI18n();
  const tone = TONE[value];
  return <span className={`badge${tone ? ` badge--${tone}` : ""}`}>{label ?? t(`status.${value}`, undefined, value.replace(/_/g, " "))}</span>;
}

export function EmptyState({ text }: { text: string }) {
  return <div className="empty" style={{ padding: "2.5rem 1rem" }}>{text}</div>;
}
