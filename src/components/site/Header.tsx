"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarCheck, Languages, Menu, X } from "lucide-react";
import { nav } from "@/lib/site";
import { basePath, getDict, href, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

function Logo({ className }: { className?: string }) {
  return (
    <>
      <Image src="/images/logo.png" alt="Bariq — بريق" width={1136} height={476} priority className={cn("w-auto dark:hidden", className)} />
      <Image src="/images/logo-white.png" alt="Bariq — بريق" width={1136} height={476} priority className={cn("hidden w-auto dark:block", className)} />
    </>
  );
}

export function Header({ lang }: { lang: Lang }) {
  const t = getDict(lang).nav;
  // Normalized so the server (rewritten /ar/...) and the browser URL agree.
  const path = basePath(usePathname());
  const other: Lang = lang === "ar" ? "en" : "ar";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (p: string) => (p === "/" ? path === "/" : path.startsWith(p));

  const langSwitch = (
    // A full page load, so the document's lang and dir switch cleanly.
    <a
      href={href(other, path)}
      hrefLang={other}
      lang={other}
      aria-label={t.switchLangAria}
      className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-card px-3.5 text-sm font-semibold text-ink transition-colors hover:border-accent hover:text-accent"
    >
      <Languages className="size-4" aria-hidden />
      {t.switchLang}
    </a>
  );

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300",
        scrolled || open
          ? "border-b border-line bg-surface/90 shadow-[0_6px_24px_-18px_rgb(35_11_75/.35)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:rounded-lg focus:bg-card focus:px-4 focus:py-2"
      >
        {t.skip}
      </a>
      <div className="container-x flex h-[72px] items-center justify-between gap-3">
        <Link href={href(lang, "/")} className="shrink-0" aria-label={t.homeAria} onClick={() => setOpen(false)}>
          <Logo className="h-10" />
        </Link>

        <nav aria-label={t.mainNav} className="hidden xl:block">
          <ul className="relative isolate flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={href(lang, item.href)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "relative block rounded-full px-3.5 py-2 text-[15px] font-medium transition-colors",
                    isActive(item.href) ? "text-accent" : "text-ink hover:text-accent",
                  )}
                >
                  {/* The active pill slides between tabs. */}
                  {isActive(item.href) && (
                    <motion.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full bg-tint" transition={{ type: "spring", stiffness: 380, damping: 32 }} />
                  )}
                  {t[item.key]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 sm:flex">
            {langSwitch}
            <ThemeToggle lang={lang} />
          </div>
          <Link href={href(lang, "/booking")} className="btn btn-primary btn-sm hidden md:inline-flex">
            <CalendarCheck className="size-4" aria-hidden />
            {t.book}
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-card text-ink xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? t.closeMenu : t.openMenu}
            onClick={() => setOpen((v) => !v)}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={open ? "close" : "menu"}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex"
              >
                {open ? <X className="size-5" /> : <Menu className="size-5" />}
              </motion.span>
            </AnimatePresence>
          </button>
        </div>
      </div>

      <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          className="h-[calc(100dvh-72px)] overflow-y-auto border-t border-line bg-surface xl:hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          <nav aria-label={t.mobileNav} className="container-x py-6">
            <ul className="flex flex-col gap-1">
              {nav.map((item, i) => (
                <motion.li key={item.href} initial={{ opacity: 0, x: lang === "ar" ? 16 : -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.04 * i }}>
                  <Link
                    href={href(lang, item.href)}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "block rounded-2xl px-4 py-3.5 text-lg font-semibold",
                      isActive(item.href) ? "bg-tint text-accent" : "text-ink",
                    )}
                  >
                    {t[item.key]}
                  </Link>
                </motion.li>
              ))}
            </ul>
            <div className="mt-6 flex items-center gap-2 sm:hidden">
              {langSwitch}
              <ThemeToggle lang={lang} />
            </div>
            <Link href={href(lang, "/booking")} onClick={() => setOpen(false)} className="btn btn-primary mt-6 w-full">
              <CalendarCheck className="size-5" aria-hidden />
              {t.book}
            </Link>
          </nav>
        </motion.div>
      )}
      </AnimatePresence>
    </header>
  );
}
