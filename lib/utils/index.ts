import type { Lang, Localized } from "@/types";

/** className joiner */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

let counter = 0;
/** Collision-resistant id for client-side records (server will use cuid). */
export function uid(prefix = "id"): string {
  counter = (counter + 1) % 1_000_000;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}${counter.toString(36)}${rand}`;
}

export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function formatMoney(value: number, lang: Lang = "en"): string {
  const n = new Intl.NumberFormat(lang === "ar" ? "ar-QA" : "en-QA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
  return lang === "ar" ? `${n} ر.ق` : `QAR ${n}`;
}

export function formatNumber(value: number, lang: Lang = "en", digits = 2): string {
  return new Intl.NumberFormat(lang === "ar" ? "ar-QA" : "en-QA", { maximumFractionDigits: digits }).format(value);
}

export function formatDate(iso: string, lang: Lang = "en", withTime = false): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-QA" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    timeZone: "Asia/Qatar",
  }).format(d);
}

export function loc(value: Localized | undefined, lang: Lang): string {
  if (!value) return "";
  return value[lang] || value.en || "";
}

export function L(en: string, ar = ""): Localized {
  return { en, ar };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Escape text for safe insertion where raw strings are rendered (defence in depth; React already escapes). */
export function sanitizeText(input: string, max = 2000): string {
  return input.replace(/[<>]/g, "").slice(0, max).trim();
}

export function isEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export function isQatarPhone(v: string): boolean {
  const digits = v.replace(/[^\d]/g, "");
  return digits.length === 8 || (digits.startsWith("974") && digits.length === 11);
}
