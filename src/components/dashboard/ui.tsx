import Link from "next/link";
import { CheckCircle2, Plus } from "lucide-react";
import type { ConsultationStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

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

export function SavedNotice({ show, text = "تم الحفظ بنجاح، والتغييرات ظاهرة الآن على الموقع." }: { show: boolean; text?: string }) {
  if (!show) return null;
  return (
    <div role="status" className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[15px] font-medium text-emerald-900">
      <CheckCircle2 className="size-5 shrink-0" aria-hidden />
      {text}
    </div>
  );
}

export const statusMeta: Record<ConsultationStatus, { label: string; className: string }> = {
  pending: { label: "بانتظار التأكيد", className: "bg-amber-50 text-amber-900 border-amber-200" },
  confirmed: { label: "مؤكد", className: "bg-violet/10 text-violet border-violet/25" },
  completed: { label: "مكتمل", className: "bg-emerald-50 text-emerald-900 border-emerald-200" },
  cancelled: { label: "ملغي", className: "bg-zinc-100 text-zinc-700 border-zinc-200" },
};

export function StatusBadge({ status }: { status: ConsultationStatus }) {
  const meta = statusMeta[status];
  return <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold", meta.className)}>{meta.label}</span>;
}

export function PublishedBadge({ published, draftLabel = "مسودة" }: { published: boolean; draftLabel?: string }) {
  return published ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-900">
      <span className="size-1.5 rounded-full bg-emerald-600" />
      منشور
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">
      <span className="size-1.5 rounded-full bg-zinc-500" />
      {draftLabel}
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
