"use client";

import { createContext, useContext, useMemo } from "react";
import { translator, type DashLang } from "@/lib/dash-i18n";

const Ctx = createContext<DashLang>("ar");

export function DashLangProvider({ lang, children }: { lang: DashLang; children: React.ReactNode }) {
  return <Ctx.Provider value={lang}>{children}</Ctx.Provider>;
}

/** `t("عربي", "English")` in client components of the dashboard. */
export function useT() {
  const lang = useContext(Ctx);
  return useMemo(() => ({ lang, t: translator(lang) }), [lang]);
}
