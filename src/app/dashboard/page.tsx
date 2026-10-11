import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, CalendarClock, CalendarDays, Mail, Newspaper, Plus } from "lucide-react";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/server";
import type { Consultation, Message } from "@/lib/types";
import { formatDate, formatDay, formatTime, todayIn } from "@/lib/utils";
import { booking } from "@/lib/site";
import { EmptyRow, Panel, StatusBadge } from "@/components/dashboard/ui";

export const metadata = { title: "نظرة عامة" };

export default async function DashboardHome() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const db = admin.supabase;
  const today = todayIn(booking.timeZone);

  const [pending, todayCount, unread, posts, projects, upcoming, messages] = await Promise.all([
    db.from("consultations").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("consultations").select("id", { count: "exact", head: true }).eq("scheduled_date", today).in("status", ["pending", "confirmed"]),
    db.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false),
    db.from("posts").select("id", { count: "exact", head: true }).eq("is_published", true),
    db.from("projects").select("id", { count: "exact", head: true }).eq("is_published", true),
    db
      .from("consultations")
      .select("*")
      .gte("scheduled_date", today)
      .in("status", ["pending", "confirmed"])
      .order("scheduled_date")
      .order("scheduled_time")
      .limit(6),
    db.from("messages").select("*").order("created_at", { ascending: false }).limit(5),
  ]);

  const stats = [
    { label: "استشارات بانتظار التأكيد", value: pending.count ?? 0, Icon: CalendarClock, href: "/dashboard/consultations?status=pending", accent: true },
    { label: "مواعيد اليوم", value: todayCount.count ?? 0, Icon: CalendarDays, href: "/dashboard/consultations" },
    { label: "رسائل غير مقروءة", value: unread.count ?? 0, Icon: Mail, href: "/dashboard/messages" },
    { label: "مقالات منشورة", value: posts.count ?? 0, Icon: Newspaper, href: "/dashboard/posts" },
    { label: "أعمال منشورة", value: projects.count ?? 0, Icon: BriefcaseBusiness, href: "/dashboard/projects" },
  ];

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-night">أهلاً بك</h1>
          <p className="mt-1 text-muted">هذه نظرة سريعة على نشاط موقع بريق اليوم، {formatDate(new Date())}.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/posts/new" className="btn btn-primary btn-sm">
            <Plus className="size-4" aria-hidden /> مقال جديد
          </Link>
          <Link href="/dashboard/projects/new" className="btn btn-outline btn-sm">
            <Plus className="size-4" aria-hidden /> عمل جديد
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map(({ label, value, Icon, href, accent }) => (
          <Link
            key={label}
            href={href}
            className={
              accent
                ? "rounded-[20px] bg-violet p-5 text-white transition-colors hover:bg-deep"
                : "rounded-[20px] border border-line bg-white p-5 transition-colors hover:border-violet"
            }
          >
            <Icon className={accent ? "size-6 text-lilac" : "size-6 text-violet"} aria-hidden />
            <p className="mt-4 text-3xl font-bold">{value}</p>
            <p className={accent ? "text-sm text-white/80" : "text-sm text-muted"}>{label}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel
          title="المواعيد القادمة"
          action={
            <Link href="/dashboard/consultations" className="inline-flex items-center gap-1 text-sm font-semibold text-violet">
              الكل <ArrowLeft className="size-4" aria-hidden />
            </Link>
          }
        >
          {(upcoming.data as Consultation[] | null)?.length ? (
            <ul className="divide-y divide-line">
              {(upcoming.data as Consultation[]).map((c) => (
                <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="w-16 shrink-0 rounded-xl bg-lilac-50 py-2 text-center">
                    <p className="text-xs text-muted">{formatDay(c.scheduled_date).split("،")[0]}</p>
                    <p className="text-sm font-bold text-night">{formatTime(c.scheduled_time)}</p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-night">{c.full_name}</p>
                    <p className="truncate text-sm text-muted">{formatDay(c.scheduled_date)}</p>
                  </div>
                  <StatusBadge status={c.status} />
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow>لا توجد مواعيد قادمة.</EmptyRow>
          )}
        </Panel>

        <Panel
          title="أحدث الرسائل"
          action={
            <Link href="/dashboard/messages" className="inline-flex items-center gap-1 text-sm font-semibold text-violet">
              الكل <ArrowLeft className="size-4" aria-hidden />
            </Link>
          }
        >
          {(messages.data as Message[] | null)?.length ? (
            <ul className="divide-y divide-line">
              {(messages.data as Message[]).map((m) => (
                <li key={m.id} className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    {!m.is_read && <span className="size-2 rounded-full bg-violet" aria-label="غير مقروءة" />}
                    <p className="truncate font-semibold text-night">{m.full_name}</p>
                    <span className="ms-auto shrink-0 text-xs text-muted">{formatDate(m.created_at)}</span>
                  </div>
                  <p className="mt-1 line-clamp-1 text-sm text-muted">{m.subject || m.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow>لا توجد رسائل بعد.</EmptyRow>
          )}
        </Panel>
      </div>
    </>
  );
}
