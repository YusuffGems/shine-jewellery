import en from "@/locales/en.json";
import ar from "@/locales/ar.json";
import type { Lang, Translations } from "@/types";

type Dict = { [k: string]: string | Dict };

function flatten(obj: Dict, prefix = "", out: Record<string, string> = {}): Record<string, string> {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "string") out[key] = v;
    else flatten(v, key, out);
  }
  return out;
}

export const DICTIONARIES: Record<Lang, Record<string, string>> = {
  en: flatten(en as Dict),
  ar: flatten(ar as Dict),
};

export function translate(
  lang: Lang,
  key: string,
  overrides?: Translations,
  vars?: Record<string, string | number>,
  fallback?: string,
): string {
  let text = overrides?.[lang]?.[key] || DICTIONARIES[lang][key] || DICTIONARIES.en[key] || fallback || key;
  if (vars) for (const [k, v] of Object.entries(vars)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

export function dirOf(lang: Lang): "ltr" | "rtl" {
  return lang === "ar" ? "rtl" : "ltr";
}

export function allKeys(): string[] {
  return Array.from(new Set([...Object.keys(DICTIONARIES.en), ...Object.keys(DICTIONARIES.ar)])).sort();
}
