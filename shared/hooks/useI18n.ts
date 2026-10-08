"use client";
import { useCallback } from "react";
import { useDb } from "@/shared/hooks/useDb";
import { dirOf, translate } from "@/lib/i18n";
import { formatDate, formatMoney, formatNumber, loc } from "@/lib/utils";
import type { Localized } from "@/types";

export function useI18n() {
  const d = useDb();
  const lang = d.session.lang;
  const overrides = d.translations;
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>, fallback?: string) => translate(lang, key, overrides, vars, fallback),
    [lang, overrides],
  );
  const L = useCallback((v: Localized | undefined) => loc(v, lang), [lang]);
  const money = useCallback((n: number) => formatMoney(n, lang), [lang]);
  const num = useCallback((n: number, digits = 2) => formatNumber(n, lang, digits), [lang]);
  const date = useCallback((iso: string, withTime = false) => formatDate(iso, lang, withTime), [lang]);
  return { lang, dir: dirOf(lang), t, L, money, num, date };
}
