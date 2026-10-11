"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdmin } from "@/lib/supabase/server";
import { fieldErrors, formObject } from "@/lib/validation";
import type { ConsultationStatus, FormState } from "@/lib/types";

type Admin = NonNullable<Awaited<ReturnType<typeof getAdmin>>>;

async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return admin;
}

function refreshSite() {
  revalidatePath("/", "layout");
}

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "استخدم أحرفاً إنجليزية صغيرة وأرقاماً وشرطات فقط، مثل: web-design");

const lines = (v: string) =>
  v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const list = (v: string) =>
  v
    .split(/[,،\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .transform((v) => (v === "" ? null : v));

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

const url = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), "أدخل رابطاً يبدأ بـ https://")
  .transform((v) => (v === "" ? null : v));

const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Uploads `file` (if any) to the public media bucket and returns the image URL to store. */
async function resolveImage(
  admin: Admin,
  formData: FormData,
  field: string,
  folder: string,
): Promise<{ url: string | null } | { error: string }> {
  const file = formData.get(`${field}_file`);
  const current = String(formData.get(field) ?? "").trim() || null;
  if (formData.get(`${field}_remove`) === "on") return { url: null };
  if (!(file instanceof File) || file.size === 0) return { url: current };
  if (!ALLOWED_IMAGES.includes(file.type)) return { error: "نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP." };
  if (file.size > 5 * 1024 * 1024) return { error: "حجم الصورة أكبر من 5 ميغابايت." };

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await admin.supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: `تعذّر رفع الصورة: ${error.message}` };
  return { url: admin.supabase.storage.from("media").getPublicUrl(path).data.publicUrl };
}

function dbError(error: { code?: string; message: string }, values: Record<string, string>): FormState {
  if (error.code === "23505") return { ok: false, message: "هذا الرابط (slug) مستخدم بالفعل.", errors: { slug: "اختر رابطاً مختلفاً" }, values };
  return { ok: false, message: `تعذّر الحفظ: ${error.message}`, values };
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
const serviceSchema = z.object({
  title: z.string().trim().min(2, "أدخل اسم الخدمة").max(120),
  slug,
  summary: z.string().trim().max(300, "الوصف المختصر طويل جداً"),
  description: z.string().trim().max(5000),
  icon: z.string().trim().min(1),
  features: z.string().transform(lines),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_published: checkbox,
});

export async function saveService(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formObject(formData);
  const parsed = serviceSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "راجع الحقول المظللة.", errors: fieldErrors(parsed.error), values };
  const image = await resolveImage(admin, formData, "image_url", "services");
  if ("error" in image) return { ok: false, message: image.error, errors: { image_url: image.error }, values };

  const row = { ...parsed.data, image_url: image.url };
  const id = String(formData.get("id") ?? "");
  const { error } = id
    ? await admin.supabase.from("services").update(row).eq("id", id)
    : await admin.supabase.from("services").insert(row);
  if (error) return dbError(error, values);
  refreshSite();
  redirect("/dashboard/services?saved=1");
}

export async function deleteService(formData: FormData) {
  const admin = await requireAdmin();
  await admin.supabase.from("services").delete().eq("id", String(formData.get("id")));
  refreshSite();
}

export async function toggleService(formData: FormData) {
  const admin = await requireAdmin();
  await admin.supabase
    .from("services")
    .update({ is_published: formData.get("value") === "true" })
    .eq("id", String(formData.get("id")));
  refreshSite();
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
const projectSchema = z.object({
  title: z.string().trim().min(2, "أدخل اسم المشروع").max(160),
  slug,
  client: optional(160),
  service_id: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  summary: z.string().trim().max(400, "الملخص طويل جداً"),
  description: z.string().trim().max(10000),
  link_url: url,
  tags: z.string().transform(list),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_featured: checkbox,
  is_published: checkbox,
});

export async function saveProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formObject(formData);
  const parsed = projectSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "راجع الحقول المظللة.", errors: fieldErrors(parsed.error), values };
  const image = await resolveImage(admin, formData, "cover_url", "projects");
  if ("error" in image) return { ok: false, message: image.error, errors: { cover_url: image.error }, values };

  const row = { ...parsed.data, cover_url: image.url };
  const id = String(formData.get("id") ?? "");
  const { error } = id
    ? await admin.supabase.from("projects").update(row).eq("id", id)
    : await admin.supabase.from("projects").insert(row);
  if (error) return dbError(error, values);
  refreshSite();
  redirect("/dashboard/projects?saved=1");
}

export async function deleteProject(formData: FormData) {
  const admin = await requireAdmin();
  await admin.supabase.from("projects").delete().eq("id", String(formData.get("id")));
  refreshSite();
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------
const postSchema = z.object({
  title: z.string().trim().min(2, "أدخل عنوان المقال").max(200),
  slug,
  excerpt: z.string().trim().max(400, "المقتطف طويل جداً"),
  content: z.string().trim().min(20, "اكتب محتوى المقال (20 حرفاً على الأقل)"),
  category: optional(80),
  author_name: z.string().trim().min(2).max(120),
  is_published: checkbox,
});

export async function savePost(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formObject(formData);
  const parsed = postSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "راجع الحقول المظللة.", errors: fieldErrors(parsed.error), values };
  const image = await resolveImage(admin, formData, "cover_url", "posts");
  if ("error" in image) return { ok: false, message: image.error, errors: { cover_url: image.error }, values };

  const id = String(formData.get("id") ?? "");
  let published_at: string | null = values.published_at || null;
  if (parsed.data.is_published && !published_at) published_at = new Date().toISOString();

  const row = { ...parsed.data, cover_url: image.url, published_at };
  const { error } = id
    ? await admin.supabase.from("posts").update(row).eq("id", id)
    : await admin.supabase.from("posts").insert(row);
  if (error) return dbError(error, values);
  refreshSite();
  redirect("/dashboard/posts?saved=1");
}

export async function deletePost(formData: FormData) {
  const admin = await requireAdmin();
  await admin.supabase.from("posts").delete().eq("id", String(formData.get("id")));
  refreshSite();
}

// ---------------------------------------------------------------------------
// Consultations
// ---------------------------------------------------------------------------
const STATUSES: ConsultationStatus[] = ["pending", "confirmed", "completed", "cancelled"];

export async function updateConsultationStatus(formData: FormData) {
  const admin = await requireAdmin();
  const status = String(formData.get("status")) as ConsultationStatus;
  if (!STATUSES.includes(status)) return;
  await admin.supabase.from("consultations").update({ status }).eq("id", String(formData.get("id")));
  revalidatePath("/dashboard", "layout");
}

export async function saveConsultationNotes(formData: FormData) {
  const admin = await requireAdmin();
  const notes = String(formData.get("admin_notes") ?? "").trim().slice(0, 2000);
  await admin.supabase
    .from("consultations")
    .update({ admin_notes: notes || null })
    .eq("id", String(formData.get("id")));
  revalidatePath("/dashboard/consultations");
}

export async function rescheduleConsultation(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const day = String(formData.get("scheduled_date") ?? "");
  const time = String(formData.get("scheduled_time") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time)) return { ok: false, message: "اختر تاريخاً ووقتاً صحيحين." };
  const { error } = await admin.supabase
    .from("consultations")
    .update({ scheduled_date: day, scheduled_time: time })
    .eq("id", String(formData.get("id")));
  if (error) {
    return { ok: false, message: error.code === "23505" ? "يوجد حجز آخر في هذا الموعد." : `تعذّر الحفظ: ${error.message}` };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: "تم تحديث الموعد." };
}

export async function deleteConsultation(formData: FormData) {
  const admin = await requireAdmin();
  await admin.supabase.from("consultations").delete().eq("id", String(formData.get("id")));
  revalidatePath("/dashboard", "layout");
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
export async function setMessageRead(formData: FormData) {
  const admin = await requireAdmin();
  await admin.supabase
    .from("messages")
    .update({ is_read: formData.get("value") === "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/dashboard", "layout");
}

export async function deleteMessage(formData: FormData) {
  const admin = await requireAdmin();
  await admin.supabase.from("messages").delete().eq("id", String(formData.get("id")));
  revalidatePath("/dashboard", "layout");
}
