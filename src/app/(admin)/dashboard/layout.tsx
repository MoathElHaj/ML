import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { getDashT } from "@/lib/dash";
import { getBookingSettings } from "@/lib/settings";
import { ROLE_LABELS, SECTIONS } from "@/lib/permissions";
import { todayIn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDashT();
  return { title: { default: t("لوحة التحكم", "Dashboard"), template: t("%s | لوحة تحكم بريق", "%s | Bariq Dashboard") }, robots: { index: false } };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    const { t } = await getDashT();
    return (
      <main className="hero-glow flex min-h-dvh items-center justify-center p-6">
        <div className="card max-w-lg p-8">
          <h1 className="text-2xl font-bold text-night">{t("اربط Supabase أولاً", "Connect Supabase first")}</h1>
          <p className="mt-3 leading-8 text-muted">
            {t("لوحة التحكم تحتاج قاعدة البيانات. أضف", "The dashboard needs the database. Add")} <code dir="ltr">NEXT_PUBLIC_SUPABASE_URL</code> {t("و", "and")}{" "}
            <code dir="ltr">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> {t("إلى ملف", "to")} <code dir="ltr">.env.local</code>{" "}
            {t("ثم شغّل الخادم من جديد. التفاصيل في ملف README.", "and restart the server. Details are in the README.")}
          </p>
          <Link href="/" className="btn btn-outline mt-6">
            {t("العودة إلى الموقع", "Back to website")}
          </Link>
        </div>
      </main>
    );
  }

  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const { lang } = await getDashT();
  const db = admin.supabase;
  const today = todayIn((await getBookingSettings()).time_zone);
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const zero = Promise.resolve(0);

  const [consultations, messages, tasks, clients] = await Promise.all([
    admin.can("bookings") ? count(db.from("consultations").select("id", { count: "exact", head: true }).eq("status", "pending")) : zero,
    admin.can("messages") ? count(db.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false)) : zero,
    // My open tasks that are due today or overdue.
    count(db.from("tasks").select("id", { count: "exact", head: true }).neq("status", "done").lte("due_date", today).or(`assignee_id.eq.${admin.user.id},assignee_id.is.null`)),
    admin.can("clients") ? count(db.from("contacts").select("id", { count: "exact", head: true }).eq("stage", "new")) : zero,
  ]);

  const allowed = [...SECTIONS.filter((s) => admin.can(s)), ...(admin.isManager ? (["users"] as const) : [])];

  return (
    <div className="min-h-dvh bg-[#f8f6fc] lg:flex">
      <Sidebar
        name={admin.member.full_name || admin.user.email || ""}
        email={admin.user.email ?? ""}
        roleLabel={ROLE_LABELS[admin.member.role][lang]}
        allowed={allowed}
        counts={{ consultations, messages, tasks, clients }}
      />
      <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
