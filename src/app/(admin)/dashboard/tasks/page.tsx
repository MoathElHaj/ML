import Link from "next/link";
import { CalendarRange, Columns3, ListChecks } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { getBookingSettings } from "@/lib/settings";
import { getTeamOptions } from "@/lib/team";
import type { Task } from "@/lib/types";
import { addDays, cn, formatDay, todayIn } from "@/lib/utils";
import { QuickAdd, TaskBoard, TaskGroups, TaskWeek } from "@/components/dashboard/tasks";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("المهام", "Tasks") };
}

const views = ["today", "board", "week"] as const;

function daysAgo(n: number) {
  return new Date(Date.now() - n * 864e5).toISOString();
}

export default async function TasksPage(props: PageProps<"/dashboard/tasks">) {
  const admin = await requireSection();
  const { t, lang } = await getDashT();
  const sp = await props.searchParams;
  const view = views.find((v) => v === sp.view) ?? "today";
  const canAll = admin.can("tasks");
  const scope = canAll && typeof sp.who === "string" ? sp.who : "mine";
  const me = admin.user.id;
  const { time_zone } = await getBookingSettings();
  const today = todayIn(time_zone);
  const dayOf = (ts: string) => new Intl.DateTimeFormat("en-CA", { timeZone: time_zone }).format(new Date(ts));
  const members = await getTeamOptions(admin);

  const recentDone = daysAgo(view === "board" ? 7 : 2);
  let q = admin.supabase
    .from("tasks")
    .select("*, contact:contacts(id, full_name)")
    .or(`status.neq.done,completed_at.gte.${recentDone}`);
  if (scope === "mine") q = q.or(`assignee_id.eq.${me},and(assignee_id.is.null,created_by.eq.${me})`);
  else if (scope === "unassigned") q = q.is("assignee_id", null);
  else if (scope !== "all" && /^[0-9a-f-]{36}$/.test(scope)) q = q.eq("assignee_id", scope);
  if (view === "week") q = q.lte("due_date", addDays(today, 6));
  const { data } = await q.order("due_date", { ascending: true, nullsFirst: false }).order("due_time", { ascending: true, nullsFirst: false }).order("position").limit(500);
  const tasks = (data ?? []) as Task[];

  const open = tasks.filter((x) => x.status !== "done");
  const stats = [
    { label: t("متأخرة", "Overdue"), value: open.filter((x) => x.due_date && x.due_date < today).length, tone: "text-red-700" },
    { label: t("لليوم", "Due today"), value: open.filter((x) => x.due_date === today).length, tone: "text-violet" },
    { label: t("أُنجزت اليوم", "Done today"), value: tasks.filter((x) => x.status === "done" && x.completed_at && dayOf(x.completed_at) === today).length, tone: "text-emerald-700" },
  ];

  const ctx = { today, members, meId: me, canAssignAll: canAll };
  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(view !== "today" ? { view } : {}), ...(scope !== "mine" ? { who: scope } : {}), ...patch });
    for (const [k, v] of [...p.entries()]) if (!v || (k === "view" && v === "today") || (k === "who" && v === "mine")) p.delete(k);
    const s = p.toString();
    return `/dashboard/tasks${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-violet">{formatDay(today, lang)}</p>
          <h1 className="mt-1 text-[28px] font-bold text-night">{t("المهام", "Tasks")}</h1>
        </div>
        <dl className="flex gap-2">
          {stats.map((s) => (
            <div key={s.label} className="min-w-24 rounded-2xl border border-line bg-white px-4 py-2.5">
              <dt className="text-xs text-muted">{s.label}</dt>
              <dd className={cn("text-2xl font-bold", s.tone)}>{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mb-5">
        <QuickAdd {...ctx} />
      </div>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-full border-[1.5px] border-line bg-white p-1" role="group" aria-label={t("طريقة العرض", "View")}>
          {[
            { key: "today", label: t("يومي", "My day"), Icon: ListChecks },
            { key: "board", label: t("لوحة", "Board"), Icon: Columns3 },
            { key: "week", label: t("الأسبوع", "Week"), Icon: CalendarRange },
          ].map(({ key, label, Icon }) => (
            <Link
              key={key}
              href={href({ view: key })}
              aria-current={view === key ? "page" : undefined}
              className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold", view === key ? "bg-night text-white" : "text-night hover:text-violet")}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          ))}
        </div>
        {canAll && (
          <nav aria-label={t("مهام من", "Whose tasks")} className="-mx-1 flex gap-1.5 overflow-x-auto px-1">
            {[
              { key: "mine", label: t("مهامي", "Mine") },
              { key: "all", label: t("الفريق كله", "Whole team") },
              { key: "unassigned", label: t("غير مسندة", "Unassigned") },
              ...members.filter((m) => m.user_id !== me).map((m) => ({ key: m.user_id, label: m.name })),
            ].map((o) => (
              <Link
                key={o.key}
                href={href({ who: o.key })}
                aria-current={scope === o.key ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full border-[1.5px] px-3 py-1.5 text-sm font-semibold transition-colors",
                  scope === o.key ? "border-night bg-night text-white" : "border-line bg-white text-night hover:border-violet",
                )}
              >
                {o.label}
              </Link>
            ))}
          </nav>
        )}
      </div>

      {view === "today" && <TaskGroups tasks={tasks} ctx={ctx} showDone />}
      {view === "board" && <TaskBoard tasks={tasks} ctx={ctx} />}
      {view === "week" && <TaskWeek tasks={tasks} ctx={ctx} />}
      {view !== "today" && (
        <p className="mt-3 text-sm text-muted">{t("اسحب البطاقات بين الأعمدة لتغيير الحالة أو اليوم.", "Drag cards between columns to change status or day.")}</p>
      )}
    </>
  );
}
