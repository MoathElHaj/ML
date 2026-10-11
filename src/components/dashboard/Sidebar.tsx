"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BriefcaseBusiness,
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  Layers,
  ListTodo,
  LogOut,
  Mail,
  Megaphone,
  Menu,
  Settings,
  Tags,
  Newspaper,
  UserRoundSearch,
  UsersRound,
  X,
} from "lucide-react";
import { signOut } from "@/actions/auth";
import type { Section } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { LangSwitch } from "./LangSwitch";
import { useT } from "./DashLang";

type Counts = { consultations: number; messages: number; tasks: number; clients: number };

type Item = {
  href: string;
  ar: string;
  en: string;
  Icon: typeof LayoutDashboard;
  exact?: boolean;
  count?: keyof Counts;
  /** Who sees it: a section permission, "users" for managers, or everyone. */
  access?: Section | "users";
};

const items: Item[] = [
  { href: "/dashboard", ar: "نظرة عامة", en: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/dashboard/tasks", ar: "المهام", en: "Tasks", Icon: ListTodo, count: "tasks" },
  { href: "/dashboard/clients", ar: "العملاء", en: "Clients", Icon: UserRoundSearch, count: "clients", access: "clients" },
  { href: "/dashboard/consultations", ar: "الاستشارات", en: "Bookings", Icon: CalendarDays, count: "consultations", access: "bookings" },
  { href: "/dashboard/messages", ar: "الرسائل", en: "Messages", Icon: Mail, count: "messages", access: "messages" },
  { href: "/dashboard/services", ar: "الخدمات", en: "Services", Icon: Layers, access: "content" },
  { href: "/dashboard/projects", ar: "الأعمال", en: "Portfolio", Icon: BriefcaseBusiness, access: "content" },
  { href: "/dashboard/posts", ar: "المدونة", en: "Blog", Icon: Newspaper, access: "content" },
  { href: "/dashboard/pricing", ar: "الأسعار والباقات", en: "Pricing", Icon: Tags, access: "pricing" },
  { href: "/dashboard/marketing", ar: "الحملات الإعلانية", en: "Campaigns", Icon: Megaphone, access: "marketing" },
  { href: "/dashboard/team", ar: "المستخدمون والصلاحيات", en: "Users & roles", Icon: UsersRound, access: "users" },
  { href: "/dashboard/settings", ar: "الإعدادات", en: "Settings", Icon: Settings, access: "settings" },
];

export function Sidebar({
  name,
  email,
  roleLabel,
  allowed,
  counts,
}: {
  name: string;
  email: string;
  roleLabel: string;
  /** Sections this member may open ("users" when they manage the team). */
  allowed: (Section | "users")[];
  counts: Counts;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { t, lang } = useT();
  const visible = items.filter((i) => !i.access || allowed.includes(i.access));

  const nav = (
    <nav aria-label={t("قائمة لوحة التحكم", "Dashboard menu")} className="flex min-h-0 flex-1 flex-col">
      <ul className="-me-2 space-y-0.5 overflow-y-auto pe-2">
        {visible.map(({ href, ar, en, Icon, exact, count }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const n = count ? counts[count] : 0;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2 text-[15px] font-medium transition-colors",
                  active ? "bg-white text-night shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="flex-1">{lang === "en" ? en : ar}</span>
                {n > 0 && (
                  <span
                    className={cn(
                      "min-w-6 rounded-full px-1.5 text-center text-xs font-bold leading-6",
                      active ? "bg-violet text-white" : "bg-lilac text-night",
                    )}
                    aria-label={t(`${n} جديد`, `${n} new`)}
                  >
                    {n}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      <div className="mt-auto space-y-1 border-t border-white/10 pt-4">
        <div className="flex gap-1">
          <LangSwitch className="flex-1 justify-center px-3 py-2 text-sm font-normal text-white/80 hover:bg-white/10 hover:text-white" />
          <Link href="/" target="_blank" className="flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white">
            <ExternalLink className="size-4" aria-hidden />
            {t("الموقع", "Website")}
          </Link>
        </div>
        <form action={signOut}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2 text-[15px] text-white/80 hover:bg-white/10 hover:text-white">
            <LogOut className="size-5 rtl:-scale-x-100" aria-hidden />
            {t("تسجيل الخروج", "Sign out")}
          </button>
        </form>
        <Link href="/dashboard/account" onClick={() => setOpen(false)} className="block rounded-xl px-3.5 py-2 hover:bg-white/10" title={t("حسابي", "My account")}>
          <p className="truncate text-sm font-semibold text-white/90">{name}</p>
          <p className="truncate text-xs text-white/50">
            {roleLabel} ·{" "}
            <span dir="ltr" title={email}>
              {email}
            </span>
          </p>
        </Link>
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <Image src="/images/logo.png" alt={t("بريق", "Bariq")} width={1136} height={476} className="h-8 w-auto" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex size-11 items-center justify-center rounded-xl border border-line"
          aria-label={t("فتح القائمة", "Open menu")}
          aria-expanded={open}
        >
          <Menu className="size-5" />
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-night/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-72 flex-col bg-night p-5 text-white transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/images/logo-white.png" alt={t("بريق", "Bariq")} width={1136} height={476} className="h-9 w-auto" />
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-lilac">{t("لوحة التحكم", "Dashboard")}</span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-xl hover:bg-white/10 lg:hidden" aria-label={t("إغلاق القائمة", "Close menu")}>
            <X className="size-5" />
          </button>
        </div>
        {nav}
      </aside>
    </>
  );
}
