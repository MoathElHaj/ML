"use client";

import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";
import type { ConsultationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useT } from "./DashLang";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-[28px] font-bold text-night">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {action && (
        <Link href={action.href} className="btn btn-primary btn-sm self-start sm:self-auto">
          <Plus className="size-4" aria-hidden />
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function SavedNotice({ show, text }: { show: boolean; text?: string }) {
  const { t } = useT();
  if (!show) return null;
  return (
    <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[15px] font-medium text-emerald-900">
      <CheckCircle2 className="size-5 shrink-0" aria-hidden />
      {text ?? t("تم الحفظ بنجاح، والتغييرات ظاهرة الآن على الموقع.", "Saved. The changes are live on the website.")}
    </div>
  );
}

export const statusMeta: Record<ConsultationStatus, { ar: string; en: string; className: string }> = {
  pending: { ar: "بانتظار التأكيد", en: "Pending", className: "bg-amber-50 text-amber-900 border-amber-200" },
  confirmed: { ar: "مؤكد", en: "Confirmed", className: "bg-violet/10 text-violet border-violet/25" },
  completed: { ar: "مكتمل", en: "Completed", className: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  cancelled: { ar: "ملغي", en: "Cancelled", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

export function StatusBadge({ status }: { status: ConsultationStatus }) {
  const { lang } = useT();
  const meta = statusMeta[status];
  return <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold", meta.className)}>{meta[lang]}</span>;
}

export function PublishedBadge({ published, draftLabel }: { published: boolean; draftLabel?: string }) {
  const { t } = useT();
  return published ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
      <span className="size-1.5 rounded-full bg-emerald-600" />
      {t("منشور", "Published")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
      <span className="size-1.5 rounded-full bg-zinc-500" />
      {draftLabel ?? t("مسودة", "Draft")}
    </span>
  );
}

export function Panel({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[20px] border border-line bg-white", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 className="font-bold text-night">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function EmptyRow({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-12 text-center text-muted">{children}</p>;
}
