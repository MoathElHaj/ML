"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "lucide-react";
import { getDict, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "bariq-theme";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}
const isDark = () => document.documentElement.classList.contains("dark");

/** Light is the default; the choice is remembered on this device. */
export function ThemeToggle({ lang, className }: { lang: Lang; className?: string }) {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);
  const t = getDict(lang).nav;

  const toggle = () => {
    const next = !isDark();
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private mode: the choice just won't persist.
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={dark}
      aria-label={dark ? t.lightMode : t.darkMode}
      title={dark ? t.lightMode : t.darkMode}
      className={cn(
        "inline-flex size-11 items-center justify-center overflow-hidden rounded-full border border-line bg-card text-ink transition-colors hover:border-accent hover:text-accent",
        className,
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={dark ? "sun" : "moon"}
          className="flex"
          initial={{ rotate: -120, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 120, scale: 0.4, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 18 }}
        >
          {dark ? <Sun className="size-5" aria-hidden /> : <Moon className="size-5" aria-hidden />}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
