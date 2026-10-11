"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarCheck, Menu, X } from "lucide-react";
import { nav } from "@/lib/site";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
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

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-300",
        scrolled || open
          ? "border-b border-line bg-white/90 shadow-[0_6px_24px_-18px_rgb(35_11_75/.35)] backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2"
      >
        تخطَّ إلى المحتوى
      </a>
      <div className="container-x flex h-[72px] items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label="بريق — الصفحة الرئيسية" onClick={() => setOpen(false)}>
          <Image src="/images/logo.png" alt="بريق" width={1136} height={476} priority className="h-10 w-auto" />
        </Link>

        <nav aria-label="القائمة الرئيسية" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={cn(
                    "rounded-full px-4 py-2 text-[15px] font-medium transition-colors",
                    isActive(item.href) ? "bg-lilac-50 text-violet" : "text-night hover:text-violet",
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <Link href="/booking" className="btn btn-primary btn-sm hidden sm:inline-flex">
            <CalendarCheck className="size-4" aria-hidden />
            احجز استشارة مجانية
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center rounded-full border border-line bg-white text-night lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div id="mobile-menu" className="h-[calc(100dvh-72px)] overflow-y-auto border-t border-line bg-white lg:hidden">
          <nav aria-label="قائمة الجوال" className="container-x py-6">
            <ul className="flex flex-col gap-1">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={cn(
                      "block rounded-2xl px-4 py-3.5 text-lg font-semibold",
                      isActive(item.href) ? "bg-lilac-50 text-violet" : "text-night",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/booking" onClick={() => setOpen(false)} className="btn btn-primary mt-6 w-full">
              <CalendarCheck className="size-5" aria-hidden />
              احجز استشارة مجانية
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
