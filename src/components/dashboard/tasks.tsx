"use client";

import Link from "next/link";
import { useActionState, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { CalendarClock, Check, ChevronDown, Flag, GripVertical, Plus, Repeat, Trash2, UserRound, Zap } from "lucide-react";
import { createTask, deleteTask, moveTask, toggleTask, updateTask } from "@/actions/tasks";
import type { FormState, Task, TaskPriority, TaskRecurrence, TaskStatus } from "@/lib/types";
import { addDays, cn, formatDay, formatShortWeekday, formatTime, dayOfMonth } from "@/lib/utils";
import { FormAlert } from "@/components/forms/Field";
import { ConfirmButton } from "./ConfirmButton";
import { useT } from "./DashLang";

export type TeamOption = { user_id: string; name: string };
type Ctx = { today: string; members: TeamOption[]; meId: string; canAssignAll: boolean };

const initial: FormState = { ok: false };

export const PRIORITY: Record<TaskPriority, { ar: string; en: string; dot: string; text: string }> = {
  urgent: { ar: "عاجل", en: "Urgent", dot: "bg-red-500", text: "text-red-700" },
  high: { ar: "مهم", en: "High", dot: "bg-amber-500", text: "text-amber-700" },
  normal: { ar: "عادي", en: "Normal", dot: "bg-violet", text: "text-violet" },
  low: { ar: "منخفض", en: "Low", dot: "bg-zinc-400", text: "text-zinc-600" },
};

const RECURRENCE: Record<TaskRecurrence, { ar: string; en: string }> = {
  none: { ar: "لا يتكرر", en: "Doesn't repeat" },
  daily: { ar: "يومياً", en: "Daily" },
  weekdays: { ar: "أيام العمل", en: "Workdays" },
  weekly: { ar: "أسبوعياً", en: "Weekly" },
  monthly: { ar: "شهرياً", en: "Monthly" },
};

export const STATUS: Record<TaskStatus, { ar: string; en: string }> = {
  todo: { ar: "للتنفيذ", en: "To do" },
  doing: { ar: "قيد التنفيذ", en: "In progress" },
  done: { ar: "تمت", en: "Done" },
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0)).join("").toUpperCase();
}

function useDueLabel(today: string) {
  const { t, lang } = useT();
  return (due: string | null) => {
    if (!due) return null;
    if (due === today) return { text: t("اليوم", "Today"), tone: "today" as const };
    if (due === addDays(today, 1)) return { text: t("غداً", "Tomorrow"), tone: "soon" as const };
    if (due === addDays(today, -1)) return { text: t("أمس", "Yesterday"), tone: "late" as const };
    if (due < today) return { text: formatDay(due, lang), tone: "late" as const };
    return { text: formatDay(due, lang), tone: "later" as const };
  };
}

// ---------------------------------------------------------------------------
// Quick add
// ---------------------------------------------------------------------------

export function QuickAdd({ today, members, meId, canAssignAll, contactId, compact }: Ctx & { contactId?: string; compact?: boolean }) {
  const { t, lang } = useT();
  const [state, action, pending] = useActionState(createTask, initial);
  const [due, setDue] = useState<string>(today);
  const [more, setMore] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.ok) {
      formRef.current?.reset();
      titleRef.current?.focus();
    }
  }, [state]);

  const chips = [
    { v: today, ar: "اليوم", en: "Today" },
    { v: addDays(today, 1), ar: "غداً", en: "Tomorrow" },
    { v: addDays(today, 7), ar: "الأسبوع القادم", en: "Next week" },
    { v: "", ar: "بدون تاريخ", en: "No date" },
  ];

  return (
    <form ref={formRef} action={action} className={cn("rounded-[20px] border border-line bg-white p-3 shadow-[0_8px_30px_-18px_rgba(35,11,75,.35)]", compact && "shadow-none")}>
      {contactId && <input type="hidden" name="contact_id" value={contactId} />}
      <input type="hidden" name="due_date" value={due} />
      <div className="flex items-center gap-2">
        <Plus className="ms-2 size-5 shrink-0 text-violet" aria-hidden />
        <label htmlFor="quick-title" className="sr-only">
          {t("مهمة جديدة", "New task")}
        </label>
        <input
          ref={titleRef}
          id="quick-title"
          name="title"
          required
          maxLength={200}
          autoComplete="off"
          placeholder={t("أضف مهمة… مثلاً: الاتصال بالعميل لتأكيد العرض", "Add a task… e.g. Call the client to confirm the proposal")}
          className="min-h-11 min-w-0 flex-1 bg-transparent px-1 text-[15px] text-night outline-none placeholder:text-[#9c90b5]"
        />
        <button type="submit" className="btn btn-primary btn-sm shrink-0" disabled={pending}>
          {pending ? t("…", "…") : t("إضافة", "Add")}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 border-t border-line pt-2.5">
        {chips.map((c) => (
          <button
            key={c.v || "none"}
            type="button"
            onClick={() => setDue(c.v)}
            aria-pressed={due === c.v}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-semibold transition-colors",
              due === c.v ? "bg-night text-white" : "bg-[#f3f0f9] text-night hover:bg-lilac-100",
            )}
          >
            {lang === "en" ? c.en : c.ar}
          </button>
        ))}
        <label className="relative">
          <span className="sr-only">{t("تاريخ آخر", "Pick a date")}</span>
          <input
            type="date"
            value={chips.some((c) => c.v === due) ? "" : due}
            onChange={(e) => setDue(e.target.value)}
            dir="ltr"
            className={cn("h-8 rounded-full border px-2 text-sm", chips.some((c) => c.v === due) ? "border-line text-muted" : "border-night text-night")}
          />
        </label>
        <button type="button" onClick={() => setMore((m) => !m)} aria-expanded={more} className="ms-auto inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold text-violet hover:bg-lilac-50">
          {t("خيارات", "Options")}
          <ChevronDown className={cn("size-4 transition-transform", more && "rotate-180")} aria-hidden />
        </button>
      </div>
      <div className={cn("mt-2 grid gap-2 sm:grid-cols-4", !more && "hidden")}>
        <SmallSelect name="priority" label={t("الأولوية", "Priority")} defaultValue="normal">
          {(Object.keys(PRIORITY) as TaskPriority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY[p][lang]}
            </option>
          ))}
        </SmallSelect>
        <SmallInput name="due_time" type="time" label={t("الوقت", "Time")} />
        <SmallSelect name="assignee_id" label={t("المسؤول", "Assignee")} defaultValue={meId}>
          {canAssignAll && <option value="">{t("غير محدد", "Unassigned")}</option>}
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.user_id === meId ? t(`أنا (${m.name})`, `Me (${m.name})`) : m.name}
            </option>
          ))}
        </SmallSelect>
        <SmallSelect name="recurrence" label={t("التكرار", "Repeat")} defaultValue="none">
          {(Object.keys(RECURRENCE) as TaskRecurrence[]).map((r) => (
            <option key={r} value={r}>
              {RECURRENCE[r][lang]}
            </option>
          ))}
        </SmallSelect>
      </div>
      {!state.ok && state.message && (
        <div className="mt-2">
          <FormAlert ok={false} message={state.message} />
        </div>
      )}
    </form>
  );
}

function SmallSelect({ name, label, children, defaultValue }: { name: string; label: string; children: React.ReactNode; defaultValue?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      <select name={name} defaultValue={defaultValue} className="field !min-h-10 !py-1.5 text-sm">
        {children}
      </select>
    </label>
  );
}

function SmallInput({ name, label, ...rest }: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-muted">{label}</span>
      <input name={name} dir="ltr" className="field !min-h-10 !py-1.5 text-sm" {...rest} />
    </label>
  );
}

// ---------------------------------------------------------------------------
// List ("My day")
// ---------------------------------------------------------------------------

export function TaskGroups({ tasks, ctx, showDone }: { tasks: Task[]; ctx: Ctx; showDone: boolean }) {
  const { t } = useT();
  const [optimistic, setDone] = useOptimistic(tasks, (state, { id, done }: { id: string; done: boolean }) =>
    state.map((x) => (x.id === id ? { ...x, status: (done ? "done" : "todo") as TaskStatus } : x)),
  );
  const [, start] = useTransition();
  const onToggle = (id: string, done: boolean) =>
    start(async () => {
      setDone({ id, done });
      await toggleTask(id, done);
    });

  const { today } = ctx;
  const weekEnd = addDays(today, 7);
  const open = optimistic.filter((x) => x.status !== "done");
  const groups: { key: string; title: string; items: Task[]; tone?: string }[] = [
    { key: "late", title: t("متأخرة", "Overdue"), items: open.filter((x) => x.due_date && x.due_date < today), tone: "text-red-700" },
    { key: "today", title: t("اليوم", "Today"), items: open.filter((x) => x.due_date === today) },
    { key: "tomorrow", title: t("غداً", "Tomorrow"), items: open.filter((x) => x.due_date === addDays(today, 1)) },
    { key: "week", title: t("هذا الأسبوع", "This week"), items: open.filter((x) => x.due_date && x.due_date > addDays(today, 1) && x.due_date <= weekEnd) },
    { key: "later", title: t("لاحقاً", "Later"), items: open.filter((x) => x.due_date && x.due_date > weekEnd) },
    { key: "none", title: t("بدون تاريخ", "No date"), items: open.filter((x) => !x.due_date) },
  ];
  if (showDone) groups.push({ key: "done", title: t("أُنجزت مؤخراً", "Recently done"), items: optimistic.filter((x) => x.status === "done") });

  const visible = groups.filter((g) => g.items.length);
  if (!visible.length)
    return (
      <div className="rounded-[20px] border border-dashed border-line bg-white px-6 py-14 text-center">
        <Check className="mx-auto size-10 rounded-full bg-emerald-50 p-2 text-emerald-700" aria-hidden />
        <p className="mt-3 font-bold text-night">{t("لا توجد مهام مفتوحة", "No open tasks")}</p>
        <p className="mt-1 text-sm text-muted">{t("أضف مهمة من الشريط بالأعلى.", "Add one from the bar above.")}</p>
      </div>
    );

  return (
    <div className="space-y-7">
      {visible.map((g) => (
        <section key={g.key} aria-labelledby={`g-${g.key}`}>
          <h2 id={`g-${g.key}`} className={cn("mb-2 flex items-center gap-2 text-sm font-bold text-night", g.tone)}>
            {g.title}
            <span className="rounded-full bg-[#f3f0f9] px-2 text-xs font-semibold text-muted">{g.items.length}</span>
          </h2>
          <ul className="divide-y divide-line overflow-hidden rounded-[20px] border border-line bg-white">
            {g.items.map((task) => (
              <TaskRow key={task.id} task={task} ctx={ctx} onToggle={onToggle} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TaskRow({ task, ctx, onToggle }: { task: Task; ctx: Ctx; onToggle: (id: string, done: boolean) => void }) {
  const { t, lang } = useT();
  const [open, setOpen] = useState(false);
  const due = useDueLabel(ctx.today)(task.due_date);
  const done = task.status === "done";
  const assignee = ctx.members.find((m) => m.user_id === task.assignee_id);
  const p = PRIORITY[task.priority];

  return (
    <li className={cn("group", open && "bg-lilac-50/40")}>
      <div className="flex items-start gap-3 px-4 py-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={done ? t(`إعادة فتح: ${task.title}`, `Reopen: ${task.title}`) : t(`إنجاز: ${task.title}`, `Complete: ${task.title}`)}
          onClick={() => onToggle(task.id, !done)}
          className={cn(
            "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
            done ? "border-emerald-600 bg-emerald-600 text-white" : task.priority === "urgent" ? "border-red-400 hover:bg-red-50" : "border-[#bcaedb] hover:border-violet hover:bg-lilac-50",
          )}
        >
          {done && <Check className="size-4" aria-hidden />}
        </button>
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="min-w-0 flex-1 text-start">
          <span className={cn("block text-[15px] font-semibold text-night", done && "text-muted line-through")}>{task.title}</span>
          <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {due && (
              <span className={cn("inline-flex items-center gap-1 font-semibold", due.tone === "late" && !done ? "text-red-700" : due.tone === "today" ? "text-violet" : "")}>
                <CalendarClock className="size-3.5" aria-hidden />
                {due.text}
                {task.due_time && ` · ${formatTime(task.due_time, lang)}`}
              </span>
            )}
            {task.priority !== "normal" && (
              <span className={cn("inline-flex items-center gap-1 font-semibold", p.text)}>
                <Flag className="size-3.5" aria-hidden />
                {p[lang]}
              </span>
            )}
            {task.recurrence !== "none" && (
              <span className="inline-flex items-center gap-1">
                <Repeat className="size-3.5" aria-hidden />
                {RECURRENCE[task.recurrence][lang]}
              </span>
            )}
            {task.source === "auto" && (
              <span className="inline-flex items-center gap-1" title={t("أنشئت تلقائياً لعميل جديد", "Created automatically for a new client")}>
                <Zap className="size-3.5" aria-hidden />
                {t("تلقائية", "Auto")}
              </span>
            )}
            {task.notes && <span className="max-w-[18rem] truncate">{task.notes}</span>}
          </span>
        </button>
        {task.contact && (
          <Link href={`/dashboard/clients/${task.contact.id}`} className="hidden shrink-0 rounded-full bg-[#f3f0f9] px-2.5 py-1 text-xs font-semibold text-night hover:bg-lilac-100 sm:inline">
            {task.contact.full_name}
          </Link>
        )}
        <span
          className={cn("flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold", assignee ? "bg-night text-white" : "border border-dashed border-line text-muted")}
          title={assignee ? assignee.name : t("غير مسندة", "Unassigned")}
        >
          {assignee ? initials(assignee.name) : <UserRound className="size-3.5" aria-hidden />}
        </span>
      </div>
      {open && <TaskEditor task={task} ctx={ctx} onDone={() => setOpen(false)} />}
    </li>
  );
}

function TaskEditor({ task, ctx, onDone }: { task: Task; ctx: Ctx; onDone: () => void }) {
  const { t, lang } = useT();
  const [state, action, pending] = useActionState(updateTask, initial);
  useEffect(() => {
    if (state.ok) onDone();
  }, [state, onDone]);

  return (
    <div className="border-t border-line px-4 py-4">
      <form action={action} className="space-y-3">
        <input type="hidden" name="id" value={task.id} />
        {task.contact_id && <input type="hidden" name="contact_id" value={task.contact_id} />}
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{t("العنوان", "Title")}</span>
          <input name="title" defaultValue={task.title} required maxLength={200} className="field !min-h-10 !py-1.5" />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-muted">{t("ملاحظات", "Notes")}</span>
          <textarea name="notes" defaultValue={task.notes ?? ""} rows={2} className="field !min-h-0 text-sm" />
        </label>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <SmallInput name="due_date" type="date" label={t("التاريخ", "Date")} defaultValue={task.due_date ?? ""} />
          <SmallInput name="due_time" type="time" label={t("الوقت", "Time")} defaultValue={task.due_time?.slice(0, 5) ?? ""} />
          <SmallSelect name="priority" label={t("الأولوية", "Priority")} defaultValue={task.priority}>
            {(Object.keys(PRIORITY) as TaskPriority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY[p][lang]}
              </option>
            ))}
          </SmallSelect>
          <SmallSelect name="status" label={t("الحالة", "Status")} defaultValue={task.status}>
            {(Object.keys(STATUS) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS[s][lang]}
              </option>
            ))}
          </SmallSelect>
          <SmallSelect name="assignee_id" label={t("المسؤول", "Assignee")} defaultValue={task.assignee_id ?? ""}>
            <option value="">{t("غير محدد", "Unassigned")}</option>
            {ctx.members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.name}
              </option>
            ))}
          </SmallSelect>
          <SmallSelect name="recurrence" label={t("التكرار", "Repeat")} defaultValue={task.recurrence}>
            {(Object.keys(RECURRENCE) as TaskRecurrence[]).map((r) => (
              <option key={r} value={r}>
                {RECURRENCE[r][lang]}
              </option>
            ))}
          </SmallSelect>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
            {pending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ", "Save")}
          </button>
          <button type="button" onClick={onDone} className="btn btn-outline btn-sm">
            {t("إلغاء", "Cancel")}
          </button>
          {state.message && !state.ok && <FormAlert ok={false} message={state.message} />}
        </div>
      </form>
      <form action={deleteTask} className="mt-3">
        <input type="hidden" name="id" value={task.id} />
        <ConfirmButton className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-700 hover:underline" message={t("حذف هذه المهمة؟", "Delete this task?")}>
          <Trash2 className="size-4" aria-hidden />
          {t("حذف المهمة", "Delete task")}
        </ConfirmButton>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Board (by status) and week (by day), both drag-and-drop
// ---------------------------------------------------------------------------

type Column = { key: string; title: string; sub?: string; highlight?: boolean; patch: { status?: TaskStatus; due_date?: string | null }; match: (t: Task) => boolean };

function DragColumns({ tasks, columns, ctx, compact }: { tasks: Task[]; columns: Column[]; ctx: Ctx; compact?: boolean }) {
  const { t, lang } = useT();
  const [items, apply] = useOptimistic(tasks, (state, { id, patch }: { id: string; patch: Column["patch"] }) =>
    state.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  );
  const [, start] = useTransition();
  const [over, setOver] = useState<string | null>(null);
  const drop = (id: string, col: Column) =>
    start(async () => {
      apply({ id, patch: col.patch });
      await moveTask(id, col.patch);
    });

  return (
    <div className={cn("-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0", !compact && "lg:grid lg:grid-cols-3 lg:overflow-visible")}>
      {columns.map((col) => {
        const list = items.filter(col.match);
        return (
          <section
            key={col.key}
            aria-label={col.title}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(col.key);
            }}
            onDragLeave={() => setOver((o) => (o === col.key ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/task");
              if (id) drop(id, col);
            }}
            className={cn(
              "flex min-h-64 w-72 shrink-0 flex-col rounded-[20px] border bg-[#f3f0f9]/70 p-2.5 transition-colors lg:w-auto",
              over === col.key ? "border-violet bg-lilac-50" : "border-transparent",
              col.highlight && "ring-2 ring-violet/30",
            )}
          >
            <header className="mb-2 flex items-baseline justify-between px-1.5">
              <h3 className="font-bold text-night">
                {col.title}
                {col.sub && <span className="ms-1.5 text-xs font-normal text-muted">{col.sub}</span>}
              </h3>
              <span className="text-xs font-semibold text-muted">{list.length}</span>
            </header>
            <ul className="flex-1 space-y-2">
              {list.map((task) => {
                const assignee = ctx.members.find((m) => m.user_id === task.assignee_id);
                const p = PRIORITY[task.priority];
                return (
                  <li
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/task", task.id);
                      e.dataTransfer.effectAllowed = "move";
                    }}
                    className="group cursor-grab rounded-2xl border border-line bg-white p-3 shadow-sm active:cursor-grabbing"
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical className="mt-0.5 size-4 shrink-0 text-[#bcaedb]" aria-hidden />
                      <p className={cn("min-w-0 flex-1 text-sm font-semibold text-night", task.status === "done" && "text-muted line-through")}>{task.title}</p>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 ps-6 text-xs text-muted">
                      <span className={cn("size-2 rounded-full", p.dot)} title={p[lang]} />
                      {task.due_date && (
                        <span className={cn(task.due_date < ctx.today && task.status !== "done" && "font-semibold text-red-700")}>
                          {task.due_date === ctx.today ? t("اليوم", "Today") : formatDay(task.due_date, lang)}
                        </span>
                      )}
                      {task.due_time && <span>{formatTime(task.due_time, lang)}</span>}
                      {task.contact && <span className="truncate">· {task.contact.full_name}</span>}
                      {assignee && (
                        <span className="ms-auto flex size-6 items-center justify-center rounded-full bg-night text-[10px] font-bold text-white" title={assignee.name}>
                          {initials(assignee.name)}
                        </span>
                      )}
                    </div>
                    {/* Keyboard / touch alternative to dragging */}
                    <label className="sr-only" htmlFor={`mv-${col.key}-${task.id}`}>
                      {t("نقل إلى", "Move to")}
                    </label>
                    <select
                      id={`mv-${col.key}-${task.id}`}
                      value={col.key}
                      onChange={(e) => {
                        const target = columns.find((c) => c.key === e.target.value);
                        if (target) drop(task.id, target);
                      }}
                      className="mt-2 w-full rounded-lg border border-line bg-white px-2 py-1 text-xs text-muted opacity-100 focus:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                    >
                      {columns.map((c) => (
                        <option key={c.key} value={c.key}>
                          {t("نقل إلى: ", "Move to: ")}
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function TaskBoard({ tasks, ctx }: { tasks: Task[]; ctx: Ctx }) {
  const { lang } = useT();
  const columns: Column[] = (Object.keys(STATUS) as TaskStatus[]).map((s) => ({
    key: s,
    title: STATUS[s][lang],
    patch: { status: s },
    match: (x) => x.status === s,
  }));
  return <DragColumns tasks={tasks} columns={columns} ctx={ctx} />;
}

export function TaskWeek({ tasks, ctx }: { tasks: Task[]; ctx: Ctx }) {
  const { t, lang } = useT();
  const days = Array.from({ length: 7 }, (_, i) => addDays(ctx.today, i));
  const columns: Column[] = [
    {
      key: "late",
      title: t("متأخرة", "Overdue"),
      patch: { due_date: ctx.today },
      match: (x) => Boolean(x.due_date && x.due_date < ctx.today && x.status !== "done"),
    },
    ...days.map((d) => ({
      key: d,
      title: d === ctx.today ? t("اليوم", "Today") : formatShortWeekday(d, lang),
      sub: String(dayOfMonth(d)),
      highlight: d === ctx.today,
      patch: { due_date: d },
      match: (x: Task) => x.due_date === d,
    })),
  ];
  return <DragColumns tasks={tasks} columns={columns} ctx={ctx} compact />;
}
