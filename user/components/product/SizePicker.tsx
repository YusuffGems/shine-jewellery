"use client";
import { useI18n } from "@/shared/hooks/useI18n";

export function SizePicker({ sizes, value, onChange }: { sizes: string[]; value?: string; onChange: (s: string) => void }) {
  const { t } = useI18n();
  if (!sizes.length) return null;
  return (
    <div className="stack" style={{ gap: "0.6rem" }}>
      <span className="label">{t("product.size")}</span>
      <div className="size-list" role="group" aria-label={t("product.size")}>
        {sizes.map((s) => (
          <button key={s} type="button" aria-pressed={value === s} onClick={() => onChange(s)}>{s}</button>
        ))}
      </div>
    </div>
  );
}
