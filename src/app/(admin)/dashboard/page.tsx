import Link from "next/link";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, CalendarClock, CalendarDays, ListTodo, Mail, Newspaper, Plus, ShieldAlert, UserRoundSearch } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { getTeamOptions } from "@/lib/team";
import { SECTION_LABELS, type Section } from "@/lib/permissions";
import type { Consultation, Contact, Message, Task } from "@/lib/types";
import { formatDate, formatShortWeekday, formatTime, formatDay, todayIn } from "@/lib/utils";
import { getBookingSettings } from "@/lib/settings";
import { EmptyRow, Panel, StatusBadge } from "@/components/dashboard/ui";
import { SourceBadge } from "@/components/dashboard/clients";
import { TaskGroups } from "@/components/dashboard/tasks";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("نظرة عامة", "Overview") };
}

const none = Promise.resolve({ data: null, count: 0 });

export default async function DashboardHome(props: PageProps<"/dashboard">) {
  const admin = await requireSection();
  const { t, lang } = await getDashT();
  const { denied } = await props.searchParams;
  const db = admin.supabase;
  const booking = await getBookingSettings();
  const today = todayIn(booking.time_zone);
  const me = admin.user.id;
  const can = admin.can;
  const Arrow = lang === "en" ? ArrowRight : ArrowLeft;

  const [pending, todayCount, unread, posts, projects, upcoming, messages, myTasks, newClients, members] = await Promise.all([
    can("bookings") ? db.from("consultations").select("id", { count: "exact", head: true }).eq("status", "pending") : none,
    can("bookings") ? db.from("consultations").select("id", { count: "exact", head: true }).eq("scheduled_date", today).in("status", ["pending", "confirmed"]) : none,
    can("messages") ? db.from("messages").select("id", { count: "exact", head: true }).eq("is_read", false) : none,
    can("content") ? db.from("posts").select("id", { count: "exact", head: true }).eq("is_published", true) : none,
    can("content") ? db.from("projects").select("id", { count: "exact", head: true }).eq("is_published", true) : none,
    can("bookings")
      ? db.from("consultations").select("*").gte("scheduled_date", today).in("status", ["pending", "confirmed"]).order("scheduled_date").order("scheduled_time").limit(6)
      : none,
    can("messages") ? db.from("messages").select("*").order("created_at", { ascending: false }).limit(5) : none,
    db
      .from("tasks")
      .select("*, contact:contacts(id, full_name)")
      .neq("status", "done")
      .lte("due_date", today)
      .or(`assignee_id.eq.${me},and(assignee_id.is.null,created_by.eq.${me})`)
      .order("due_date")
      .order("due_time", { nullsFirst: false })
      .limit(12),
    can("clients") ? db.from("contacts").select("*").eq("stage", "new").order("created_at", { ascending: false }).limit(5) : none,
    getTeamOptions(admin),
  ]);

  const stats = [
    can("bookings") && { label: t("استشارات بانتظار التأكيد", "Bookings to confirm"), value: pending.count ?? 0, Icon: CalendarClock, href: "/dashboard/consultations?status=pending", accent: true },
    can("bookings") && { label: t("مواعيد اليوم", "Today's bookings"), value: todayCount.count ?? 0, Icon: CalendarDays, href: "/dashboard/consultations" },
    { label: t("مهامي لليوم", "My tasks today"), value: (myTasks.data ?? []).length, Icon: ListTodo, href: "/dashboard/tasks", accent: !can("bookings") },
    can("clients") && { label: t("عملاء جدد", "New clients"), value: (newClients.data ?? []).length, Icon: UserRoundSearch, href: "/dashboard/clients" },
    can("messages") && { label: t("رسائل غير مقروءة", "Unread messages"), value: unread.count ?? 0, Icon: Mail, href: "/dashboard/messages" },
    can("content") && { label: t("مقالات منشورة", "Published articles"), value: posts.count ?? 0, Icon: Newspaper, href: "/dashboard/posts" },
    can("content") && { label: t("أعمال منشورة", "Published projects"), value: projects.count ?? 0, Icon: BriefcaseBusiness, href: "/dashboard/projects" },
  ].filter(Boolean) as { label: string; value: number; Icon: typeof Mail; href: string; accent?: boolean }[];

  const deniedSection = typeof denied === "string" ? denied : null;
  const ctx = { today, members, meId: me, canAssignAll: can("tasks") };
  const firstName = (admin.member.full_name || "").split(" ")[0];

  return (
    <>
      {deniedSection && (
        <p role="alert" className="mb-6 flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          <ShieldAlert className="size-5 shrink-0" aria-hidden />
          {t("لا تملك صلاحية الوصول إلى", "You don't have access to")}{" "}
          «{deniedSection === "users" ? t("المستخدمين والصلاحيات", "Users & roles") : (SECTION_LABELS[deniedSection as Section]?.[lang] ?? deniedSection)}».{" "}
          {t("اطلبها من مالك الحساب.", "Ask the account owner.")}
        </p>
      )}

      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-night">{firstName ? t(`أهلاً ${firstName}`, `Hello ${firstName}`) : t("أهلاً بك", "Welcome")}</h1>
          <p className="mt-1 text-muted">
            {t("هذه نظرة سريعة على نشاط اليوم،", "Here's today at a glance,")} {formatDate(new Date(), lang)}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard/tasks" className="btn btn-primary btn-sm">
            <Plus className="size-4" aria-hidden /> {t("مهمة جديدة", "New task")}
          </Link>
          {can("clients") && (
            <Link href="/dashboard/clients/new" className="btn btn-outline btn-sm">
              <Plus className="size-4" aria-hidden /> {t("عميل جديد", "New client")}
            </Link>
          )}
          {can("content") && (
            <Link href="/dashboard/posts/new" className="btn btn-outline btn-sm">
              <Plus className="size-4" aria-hidden /> {t("مقال جديد", "New article")}
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.slice(0, 8).map(({ label, value, Icon, href, accent }) => (
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
          title={t("مهامي لليوم", "My tasks for today")}
          action={
            <Link href="/dashboard/tasks" className="inline-flex items-center gap-1 text-sm font-semibold text-violet">
              {t("الكل", "All")} <Arrow className="size-4" aria-hidden />
            </Link>
          }
        >
          <div className="p-4">
            <TaskGroups tasks={(myTasks.data ?? []) as Task[]} ctx={ctx} showDone={false} />
          </div>
        </Panel>

        {can("clients") ? (
          <Panel
            title={t("عملاء جدد", "New clients")}
            action={
              <Link href="/dashboard/clients" className="inline-flex items-center gap-1 text-sm font-semibold text-violet">
                {t("الكل", "All")} <Arrow className="size-4" aria-hidden />
              </Link>
            }
          >
            {(newClients.data as Contact[] | null)?.length ? (
              <ul className="divide-y divide-line">
                {(newClients.data as Contact[]).map((c) => (
                  <li key={c.id}>
                    <Link href={`/dashboard/clients/${c.id}`} className="block px-5 py-3.5 hover:bg-lilac-50/50">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-semibold text-night">{c.full_name}</p>
                        <span className="shrink-0 text-xs text-muted">{formatDate(c.created_at, lang)}</span>
                      </div>
                      <div className="mt-1">
                        <SourceBadge source={c.source} campaign={c.campaign} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyRow>{t("لا يوجد عملاء جدد.", "No new clients.")}</EmptyRow>
            )}
          </Panel>
        ) : (
          <span />
        )}
      </div>

      {(can("bookings") || can("messages")) && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          {can("bookings") && (
            <Panel
              title={t("المواعيد القادمة", "Upcoming bookings")}
              action={
                <Link href="/dashboard/consultations" className="inline-flex items-center gap-1 text-sm font-semibold text-violet">
                  {t("الكل", "All")} <Arrow className="size-4" aria-hidden />
                </Link>
              }
            >
              {(upcoming.data as Consultation[] | null)?.length ? (
                <ul className="divide-y divide-line">
                  {(upcoming.data as Consultation[]).map((c) => (
                    <li key={c.id} className="flex items-center gap-4 px-5 py-4">
                      <div className="w-16 shrink-0 rounded-xl bg-lilac-50 py-2 text-center">
                        <p className="text-xs text-muted">{c.scheduled_date === today ? t("اليوم", "Today") : formatShortWeekday(c.scheduled_date, lang)}</p>
                        <p className="text-sm font-bold text-night">{formatTime(c.scheduled_time, lang)}</p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-night">{c.full_name}</p>
                        <p className="truncate text-sm text-muted">{formatDay(c.scheduled_date, lang)}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyRow>{t("لا توجد مواعيد قادمة.", "No upcoming bookings.")}</EmptyRow>
              )}
            </Panel>
          )}

          {can("messages") && (
            <Panel
              title={t("أحدث الرسائل", "Latest messages")}
              action={
                <Link href="/dashboard/messages" className="inline-flex items-center gap-1 text-sm font-semibold text-violet">
                  {t("الكل", "All")} <Arrow className="size-4" aria-hidden />
                </Link>
              }
            >
              {(messages.data as Message[] | null)?.length ? (
                <ul className="divide-y divide-line">
                  {(messages.data as Message[]).map((m) => (
                    <li key={m.id} className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {!m.is_read && <span className="size-2 rounded-full bg-violet" aria-label={t("غير مقروءة", "Unread")} />}
                        <p className="truncate font-semibold text-night">{m.full_name}</p>
                        <span className="ms-auto shrink-0 text-xs text-muted">{formatDate(m.created_at, lang)}</span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-sm text-muted">{m.subject || m.body}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyRow>{t("لا توجد رسائل بعد.", "No messages yet.")}</EmptyRow>
              )}
            </Panel>
          )}
        </div>
      )}
    </>
  );
}
