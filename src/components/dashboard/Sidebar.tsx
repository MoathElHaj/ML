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
  LogOut,
  Mail,
  Menu,
  Newspaper,
  X,
} from "lucide-react";
import { signOut } from "@/actions/auth";
import { cn } from "@/lib/utils";

type Counts = { consultations: number; messages: number };

const items = [
  { href: "/dashboard", label: "نظرة عامة", Icon: LayoutDashboard, exact: true },
  { href: "/dashboard/consultations", label: "الاستشارات", Icon: CalendarDays, count: "consultations" as const },
  { href: "/dashboard/messages", label: "الرسائل", Icon: Mail, count: "messages" as const },
  { href: "/dashboard/services", label: "الخدمات", Icon: Layers },
  { href: "/dashboard/projects", label: "الأعمال", Icon: BriefcaseBusiness },
  { href: "/dashboard/posts", label: "المدونة", Icon: Newspaper },
];

export function Sidebar({ email, counts }: { email: string; counts: Counts }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const nav = (
    <nav aria-label="قائمة لوحة التحكم" className="flex flex-1 flex-col">
      <ul className="space-y-1">
        {items.map(({ href, label, Icon, exact, count }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          const n = count ? counts[count] : 0;
          return (
            <li key={href}>
              <Link
                href={href}
                onClick={() => setOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] font-medium transition-colors",
                  active ? "bg-white text-night shadow-sm" : "text-white/80 hover:bg-white/10 hover:text-white",
                )}
              >
                <Icon className="size-5 shrink-0" aria-hidden />
                <span className="flex-1">{label}</span>
                {n > 0 && (
                  <span
                    className={cn(
                      "min-w-6 rounded-full px-1.5 text-center text-xs font-bold leading-6",
                      active ? "bg-violet text-white" : "bg-lilac text-night",
                    )}
                    aria-label={`${n} جديد`}
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
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] text-white/80 hover:bg-white/10 hover:text-white">
          <ExternalLink className="size-5" aria-hidden />
          عرض الموقع
        </Link>
        <form action={signOut}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-[15px] text-white/80 hover:bg-white/10 hover:text-white">
            <LogOut className="size-5 -scale-x-100" aria-hidden />
            تسجيل الخروج
          </button>
        </form>
        <p className="truncate px-3.5 pt-2 text-xs text-white/50" dir="ltr" title={email}>
          {email}
        </p>
      </div>
    </nav>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white px-4 lg:hidden">
        <Image src="/images/logo.png" alt="بريق" width={1136} height={476} className="h-8 w-auto" />
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex size-11 items-center justify-center rounded-xl border border-line"
          aria-label="فتح القائمة"
          aria-expanded={open}
        >
          <Menu className="size-5" />
        </button>
      </div>

      {open && <div className="fixed inset-0 z-40 bg-night/50 lg:hidden" onClick={() => setOpen(false)} aria-hidden />}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex w-72 flex-col bg-night p-5 text-white transition-transform lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="mb-8 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3">
            <Image src="/images/logo-white.png" alt="بريق" width={1136} height={476} className="h-9 w-auto" />
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-lilac">لوحة التحكم</span>
          </Link>
          <button type="button" onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-xl hover:bg-white/10 lg:hidden" aria-label="إغلاق القائمة">
            <X className="size-5" />
          </button>
        </div>
        {nav}
      </aside>
    </>
  );
}
