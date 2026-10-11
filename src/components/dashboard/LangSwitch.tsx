"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import { setDashLang } from "@/actions/auth";
import { cn } from "@/lib/utils";
import { useT } from "./DashLang";

/** Toggles the dashboard between Arabic (default) and English. */
export function LangSwitch({ className }: { className?: string }) {
  const { lang } = useT();
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = lang === "en" ? "ar" : "en";
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const fd = new FormData();
          fd.set("lang", next);
          await setDashLang(fd);
          router.refresh();
        })
      }
      className={cn("inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition-colors disabled:opacity-60", className)}
      lang={next}
      aria-label={next === "en" ? "Switch dashboard to English" : "التبديل إلى العربية"}
    >
      <Languages className="size-4" aria-hidden />
      {next === "en" ? "English" : "العربية"}
    </button>
  );
}
