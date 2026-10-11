import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { Sidebar } from "@/components/dashboard/Sidebar";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "لوحة التحكم", template: "%s | لوحة تحكم بريق" },
  robots: { index: false },
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return (
      <main className="hero-glow flex min-h-dvh items-center justify-center p-6">
        <div className="card max-w-lg p-8">
          <h1 className="text-2xl font-bold text-night">اربط Supabase أولاً</h1>
          <p className="mt-3 leading-8 text-muted">
            لوحة التحكم تحتاج قاعدة البيانات. أضف <code dir="ltr">NEXT_PUBLIC_SUPABASE_URL</code> و
            <code dir="ltr">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> إلى ملف <code dir="ltr">.env.local</code> ثم شغّل الخادم من جديد.
            التفاصيل في ملف README.
          </p>
          <Link href="/" className="btn btn-outline mt-6">
            العودة إلى الموقع
          </Link>
        </div>
      </main>
    );
  }

  const admin = await getAdmin();
  if (!admin) redirect("/login");

  const [{ count: pending }, { count: unread }] = await Promise.all([
    admin.supabase.from("consultations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    admin.supabase.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false),
  ]);

  return (
    <div className="min-h-dvh bg-[#f8f6fc] lg:flex">
      <Sidebar email={admin.user.email ?? ""} counts={{ consultations: pending ?? 0, messages: unread ?? 0 }} />
      <main id="main" className="min-w-0 flex-1 px-4 py-8 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
