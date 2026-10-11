"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { getBookingSettings } from "@/lib/settings";
import { fieldErrors, formObject } from "@/lib/validation";
import { addDays, weekdayOf } from "@/lib/utils";
import type { FormState, Task, TaskRecurrence } from "@/lib/types";

const empty = (v: unknown) => (v === "" || v === undefined ? null : v);

async function taskSchema() {
  const { t } = await getDashT();
  return z.object({
    title: z.string().trim().min(1, t("اكتب عنوان المهمة.", "Enter a task title.")).max(200),
    notes: z.preprocess(empty, z.string().trim().max(4000).nullable()),
    status: z.enum(["todo", "doing", "done"]).default("todo"),
    priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
    due_date: z.preprocess(empty, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
    due_time: z.preprocess(empty, z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable()),
    recurrence: z.enum(["none", "daily", "weekdays", "weekly", "monthly"]).default("none"),
    assignee_id: z.preprocess(empty, z.string().uuid().nullable()),
    contact_id: z.preprocess(empty, z.string().uuid().nullable()),
  });
}

function refresh() {
  revalidatePath("/dashboard", "layout");
}

export async function createTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection();
  const { t } = await getDashT();
  const values = formObject(formData);
  const parsed = (await taskSchema()).safeParse(values);
  if (!parsed.success) return { ok: false, message: t("راجع الحقول.", "Check the fields."), errors: fieldErrors(parsed.error), values };
  const v = parsed.data;
  // Members without the "tasks" permission can still delegate; RLS keeps them to tasks they created or own.
  const { error } = await admin.supabase.from("tasks").insert({
    ...v,
    assignee_id: v.assignee_id ?? (admin.can("tasks") ? null : admin.user.id),
    created_by: admin.user.id,
    completed_at: v.status === "done" ? new Date().toISOString() : null,
  });
  if (error) return { ok: false, message: t("تعذّر حفظ المهمة: ", "Couldn't save the task: ") + error.message, values };
  if (v.contact_id) await logContactTask(admin, v.contact_id, v.title);
  refresh();
  return { ok: true, message: t("أضيفت المهمة.", "Task added.") };
}

export async function updateTask(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection();
  const { t } = await getDashT();
  const id = String(formData.get("id") ?? "");
  const values = formObject(formData);
  const parsed = (await taskSchema()).safeParse(values);
  if (!parsed.success) return { ok: false, message: t("راجع الحقول.", "Check the fields."), errors: fieldErrors(parsed.error), values };
  const v = parsed.data;
  const { data: before } = await admin.supabase.from("tasks").select("*").eq("id", id).maybeSingle();
  if (!before) return { ok: false, message: t("المهمة غير موجودة أو لا تملك صلاحيتها.", "Task not found or not yours."), values };
  const { error } = await admin.supabase
    .from("tasks")
    .update({ ...v, completed_at: v.status === "done" ? (before.completed_at ?? new Date().toISOString()) : null })
    .eq("id", id);
  if (error) return { ok: false, message: error.message, values };
  if (v.status === "done" && before.status !== "done") await repeat({ ...(before as Task), ...v });
  refresh();
  return { ok: true, message: t("تم الحفظ.", "Saved.") };
}

/** Checkbox: done / not done. Finishing a repeating task schedules the next one. */
export async function toggleTask(id: string, done: boolean) {
  const admin = await requireSection();
  const { data: task } = await admin.supabase
    .from("tasks")
    .update({ status: done ? "done" : "todo", completed_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .select("*")
    .maybeSingle();
  if (task && done) await repeat(task as Task);
  refresh();
}

/** Drag and drop on the board (status) or the week view (due date). */
export async function moveTask(id: string, patch: { status?: Task["status"]; due_date?: string | null; position?: number }) {
  const admin = await requireSection();
  const update: Record<string, unknown> = {};
  if (patch.status) {
    update.status = patch.status;
    update.completed_at = patch.status === "done" ? new Date().toISOString() : null;
  }
  if (patch.due_date !== undefined) update.due_date = patch.due_date && /^\d{4}-\d{2}-\d{2}$/.test(patch.due_date) ? patch.due_date : null;
  if (typeof patch.position === "number" && Number.isFinite(patch.position)) update.position = patch.position;
  const { data: before } = await admin.supabase.from("tasks").select("status").eq("id", id).maybeSingle();
  const { data: task } = await admin.supabase.from("tasks").update(update).eq("id", id).select("*").maybeSingle();
  if (task && patch.status === "done" && before?.status !== "done") await repeat(task as Task);
  refresh();
}

export async function deleteTask(formData: FormData) {
  const admin = await requireSection();
  await admin.supabase.from("tasks").delete().eq("id", String(formData.get("id") ?? ""));
  refresh();
}

// ---------------------------------------------------------------------------

async function nextDate(from: string, rule: TaskRecurrence) {
  switch (rule) {
    case "daily":
      return addDays(from, 1);
    case "weekly":
      return addDays(from, 7);
    case "monthly": {
      const [y, m, d] = from.split("-").map(Number);
      const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
      return new Date(Date.UTC(y, m, Math.min(d, last))).toISOString().slice(0, 10);
    }
    case "weekdays": {
      const { working_days } = await getBookingSettings();
      let day = addDays(from, 1);
      for (let i = 0; i < 7 && !working_days.includes(weekdayOf(day)); i++) day = addDays(day, 1);
      return day;
    }
    default:
      return null;
  }
}

async function repeat(task: Task) {
  if (task.recurrence === "none") return;
  const admin = await requireSection();
  const { time_zone } = await getBookingSettings();
  const base = task.due_date ?? new Intl.DateTimeFormat("en-CA", { timeZone: time_zone }).format(new Date());
  const due = await nextDate(base, task.recurrence);
  if (!due) return;
  await admin.supabase.from("tasks").insert({
    title: task.title,
    notes: task.notes,
    priority: task.priority,
    due_date: due,
    due_time: task.due_time,
    recurrence: task.recurrence,
    assignee_id: task.assignee_id,
    created_by: task.created_by ?? admin.user.id,
    contact_id: task.contact_id,
  });
}

async function logContactTask(admin: Awaited<ReturnType<typeof requireSection>>, contactId: string, title: string) {
  if (!admin.can("clients")) return;
  await admin.supabase.from("contact_activities").insert({ contact_id: contactId, kind: "task", body: title, author_id: admin.user.id });
}
