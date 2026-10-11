/** Dashboard language: Arabic by default, English on request. Each string is written as an (ar, en) pair. */
export type DashLang = "ar" | "en";
export const DASH_LANG_COOKIE = "bariq_dash_lang";

export function translator(lang: DashLang) {
  return (ar: string, en: string) => (lang === "en" ? en : ar);
}
export type T = ReturnType<typeof translator>;

export function dashLangFrom(value: string | undefined | null): DashLang {
  return value === "en" ? "en" : "ar";
}
