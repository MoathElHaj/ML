import "server-only";
import { cookies } from "next/headers";
import { DASH_LANG_COOKIE, dashLangFrom, translator } from "@/lib/dash-i18n";

/** The dashboard language for this request (cookie, synced from the member's saved preference). */
export async function getDashLang() {
  return dashLangFrom((await cookies()).get(DASH_LANG_COOKIE)?.value);
}

export async function getDashT() {
  const lang = await getDashLang();
  return { lang, t: translator(lang) };
}
