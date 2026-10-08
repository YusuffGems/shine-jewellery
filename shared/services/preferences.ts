/* Per-browser preferences shared by both apps (language, theme preview). */
import { db } from "@/lib/store/db";
import type { Lang } from "@/types";

export function setLang(lang: Lang) {
  db.update((d) => {
    d.session.lang = lang;
  });
}

export function setPreviewTheme(themeId: string | undefined) {
  db.update((d) => {
    d.session.previewThemeId = themeId;
  });
}
