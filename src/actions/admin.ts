"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { notifyConfirmed } from "@/lib/email";
import { getBookingSettings } from "@/lib/settings";
import { z } from "zod";
import { requireSection, type Admin } from "@/lib/supabase/server";
import { fieldErrors, formObject } from "@/lib/validation";
import { getDashT } from "@/lib/dash";
import type { T } from "@/lib/dash-i18n";
import type { Consultation, ConsultationStatus, FormState } from "@/lib/types";


function refreshSite() {
  revalidatePath("/", "layout");
}

const slug = (t: T) =>
  z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, t("استخدم أحرفاً إنجليزية صغيرة وأرقاماً وشرطات فقط، مثل: web-design", "Use lowercase English letters, numbers and dashes only, e.g. web-design"));

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

const url = (t: T) =>
  z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/\S+$/.test(v), t("أدخل رابطاً يبدأ بـ https://", "Enter a link starting with https://"))
  .transform((v) => (v === "" ? null : v));

const ALLOWED_IMAGES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/** Uploads `file` (if any) to the public media bucket and returns the image URL to store. */
async function resolveImage(
  admin: Admin,
  formData: FormData,
  field: string,
  folder: string,
): Promise<{ url: string | null } | { error: string }> {
  const { t } = await getDashT();
  const file = formData.get(`${field}_file`);
  const current = String(formData.get(field) ?? "").trim() || null;
  if (formData.get(`${field}_remove`) === "on") return { url: null };
  if (!(file instanceof File) || file.size === 0) return { url: current };
  if (!ALLOWED_IMAGES.includes(file.type)) return { error: t("نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP.", "Unsupported image type. Use JPG, PNG or WebP.") };
  if (file.size > 5 * 1024 * 1024) return { error: t("حجم الصورة أكبر من 5 ميغابايت.", "The image is larger than 5 MB.") };

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await admin.supabase.storage.from("media").upload(path, file, { contentType: file.type, upsert: false });
  if (error) return { error: t("تعذّر رفع الصورة: ", "Could not upload the image: ") + error.message };
  return { url: admin.supabase.storage.from("media").getPublicUrl(path).data.publicUrl };
}

function dbError(t: T, error: { code?: string; message: string }, values: Record<string, string>): FormState {
  if (error.code === "23505")
    return { ok: false, message: t("هذا الرابط (slug) مستخدم بالفعل.", "This URL slug is already used."), errors: { slug: t("اختر رابطاً مختلفاً", "Pick a different slug") }, values };
  return { ok: false, message: t("تعذّر الحفظ: ", "Could not save: ") + error.message, values };
}

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
const serviceSchema = (t: T) =>
  z.object({
  title: z.string().trim().min(2, t("أدخل اسم الخدمة", "Enter the service name")).max(120),
  slug: slug(t),
  summary: z.string().trim().max(300, t("الوصف المختصر طويل جداً", "The summary is too long")),
  description: z.string().trim().max(5000),
  icon: z.string().trim().min(1),
  features: z.string().transform(lines),
  title_en: optional(120),
  summary_en: optional(300),
  description_en: optional(5000),
  features_en: z.string().default("").transform(lines),
  content: z.string().trim().max(30000).default(""),
  content_en: optional(30000),
  meta_title: optional(120),
  meta_title_en: optional(120),
  meta_description: optional(300),
  meta_description_en: optional(300),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_published: checkbox,
});

export async function saveService(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("content");
  const { t } = await getDashT();
  const values = formObject(formData);
  const parsed = serviceSchema(t).safeParse(values);
  if (!parsed.success) return { ok: false, message: t("راجع الحقول المظللة.", "Check the highlighted fields."), errors: fieldErrors(parsed.error), values };
  const image = await resolveImage(admin, formData, "image_url", "services");
  if ("error" in image) return { ok: false, message: image.error, errors: { image_url: image.error }, values };

  const row = { ...parsed.data, image_url: image.url };
  const id = String(formData.get("id") ?? "");
  const { error } = id
    ? await admin.supabase.from("services").update(row).eq("id", id)
    : await admin.supabase.from("services").insert(row);
  if (error) return dbError(t, error, values);
  refreshSite();
  redirect("/dashboard/services?saved=1");
}

export async function deleteService(formData: FormData) {
  const admin = await requireSection("content");
  await admin.supabase.from("services").delete().eq("id", String(formData.get("id")));
  refreshSite();
}

export async function toggleService(formData: FormData) {
  const admin = await requireSection("content");
  await admin.supabase
    .from("services")
    .update({ is_published: formData.get("value") === "true" })
    .eq("id", String(formData.get("id")));
  refreshSite();
}

// ---------------------------------------------------------------------------
// Projects
// ---------------------------------------------------------------------------
const projectSchema = (t: T) =>
  z.object({
  title: z.string().trim().min(2, t("أدخل اسم المشروع", "Enter the project name")).max(160),
  slug: slug(t),
  client: optional(160),
  service_id: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  summary: z.string().trim().max(400, t("الملخص طويل جداً", "The summary is too long")),
  description: z.string().trim().max(10000),
  link_url: url(t),
  tags: z.string().transform(list),
  title_en: optional(160),
  summary_en: optional(400),
  description_en: optional(10000),
  tags_en: z.string().default("").transform(list),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_featured: checkbox,
  is_published: checkbox,
});

export async function saveProject(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("content");
  const { t } = await getDashT();
  const values = formObject(formData);
  const parsed = projectSchema(t).safeParse(values);
  if (!parsed.success) return { ok: false, message: t("راجع الحقول المظللة.", "Check the highlighted fields."), errors: fieldErrors(parsed.error), values };
  const image = await resolveImage(admin, formData, "cover_url", "projects");
  if ("error" in image) return { ok: false, message: image.error, errors: { cover_url: image.error }, values };

  const row = { ...parsed.data, cover_url: image.url };
  const id = String(formData.get("id") ?? "");
  const { error } = id
    ? await admin.supabase.from("projects").update(row).eq("id", id)
    : await admin.supabase.from("projects").insert(row);
  if (error) return dbError(t, error, values);
  refreshSite();
  redirect("/dashboard/projects?saved=1");
}

export async function deleteProject(formData: FormData) {
  const admin = await requireSection("content");
  await admin.supabase.from("projects").delete().eq("id", String(formData.get("id")));
  refreshSite();
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------
const postSchema = (t: T) =>
  z.object({
  title: z.string().trim().min(2, t("أدخل عنوان المقال", "Enter the article title")).max(200),
  slug: slug(t),
  excerpt: z.string().trim().max(400, t("المقتطف طويل جداً", "The excerpt is too long")),
  content: z.string().trim().min(20, t("اكتب محتوى المقال (20 حرفاً على الأقل)", "Write the article (at least 20 characters)")),
  category: optional(80),
  author_name: z.string().trim().min(2).max(120),
  title_en: optional(200),
  excerpt_en: optional(400),
  content_en: optional(50000),
  category_en: optional(80),
  meta_title: optional(120),
  meta_title_en: optional(120),
  meta_description: optional(300),
  meta_description_en: optional(300),
  is_published: checkbox,
});

export async function savePost(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("content");
  const { t } = await getDashT();
  const values = formObject(formData);
  const parsed = postSchema(t).safeParse(values);
  if (!parsed.success) return { ok: false, message: t("راجع الحقول المظللة.", "Check the highlighted fields."), errors: fieldErrors(parsed.error), values };
  const image = await resolveImage(admin, formData, "cover_url", "posts");
  if ("error" in image) return { ok: false, message: image.error, errors: { cover_url: image.error }, values };

  const id = String(formData.get("id") ?? "");
  let published_at: string | null = values.published_at || null;
  if (parsed.data.is_published && !published_at) published_at = new Date().toISOString();

  const row = { ...parsed.data, cover_url: image.url, published_at };
  const { error } = id
    ? await admin.supabase.from("posts").update(row).eq("id", id)
    : await admin.supabase.from("posts").insert(row);
  if (error) return dbError(t, error, values);
  refreshSite();
  redirect("/dashboard/posts?saved=1");
}

export async function deletePost(formData: FormData) {
  const admin = await requireSection("content");
  await admin.supabase.from("posts").delete().eq("id", String(formData.get("id")));
  refreshSite();
}

// ---------------------------------------------------------------------------
// Consultations
// ---------------------------------------------------------------------------
const STATUSES: ConsultationStatus[] = ["pending", "confirmed", "completed", "cancelled"];

export async function updateConsultationStatus(formData: FormData) {
  const admin = await requireSection("bookings");
  const status = String(formData.get("status")) as ConsultationStatus;
  if (!STATUSES.includes(status)) return;
  const { data } = await admin.supabase.from("consultations").update({ status }).eq("id", String(formData.get("id"))).select("*").maybeSingle();
  // Confirming a booking emails the client a confirmation with a calendar invite.
  if (status === "confirmed" && data) {
    const c = data as Consultation;
    const booking = await getBookingSettings();
    after(() => notifyConfirmed(c, booking.duration_minutes, booking.time_zone));
  }
  revalidatePath("/dashboard", "layout");
}

export async function resendConfirmation(formData: FormData) {
  const admin = await requireSection("bookings");
  const { data } = await admin.supabase.from("consultations").select("*").eq("id", String(formData.get("id"))).maybeSingle();
  if (!data) return;
  const booking = await getBookingSettings();
  await notifyConfirmed(data as Consultation, booking.duration_minutes, booking.time_zone);
  revalidatePath("/dashboard/consultations");
}

export async function saveConsultationNotes(formData: FormData) {
  const admin = await requireSection("bookings");
  const notes = String(formData.get("admin_notes") ?? "").trim().slice(0, 2000);
  await admin.supabase
    .from("consultations")
    .update({ admin_notes: notes || null })
    .eq("id", String(formData.get("id")));
  revalidatePath("/dashboard/consultations");
}

export async function rescheduleConsultation(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("bookings");
  const { t } = await getDashT();
  const day = String(formData.get("scheduled_date") ?? "");
  const time = String(formData.get("scheduled_time") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time)) return { ok: false, message: t("اختر تاريخاً ووقتاً صحيحين.", "Pick a valid date and time.") };
  const { data, error } = await admin.supabase
    .from("consultations")
    .update({ scheduled_date: day, scheduled_time: time, reminder_sent_at: null })
    .eq("id", String(formData.get("id")))
    .select("*")
    .maybeSingle();
  if (error) {
    return { ok: false, message: error.code === "23505" ? t("يوجد حجز آخر في هذا الموعد.", "Another booking already has this slot.") : t("تعذّر الحفظ: ", "Could not save: ") + error.message };
  }
  // A confirmed booking that moves gets a fresh confirmation with the new time.
  if (data && (data as Consultation).status === "confirmed") {
    const booking = await getBookingSettings();
    after(() => notifyConfirmed(data as Consultation, booking.duration_minutes, booking.time_zone));
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: data?.status === "confirmed" ? t("تم تحديث الموعد وإرسال التأكيد الجديد للعميل.", "Rescheduled, and the new confirmation was sent to the client.") : t("تم تحديث الموعد.", "Rescheduled.") };
}

export async function deleteConsultation(formData: FormData) {
  const admin = await requireSection("bookings");
  await admin.supabase.from("consultations").delete().eq("id", String(formData.get("id")));
  revalidatePath("/dashboard", "layout");
}

// ---------------------------------------------------------------------------
// Messages
// ---------------------------------------------------------------------------
export async function setMessageRead(formData: FormData) {
  const admin = await requireSection("messages");
  await admin.supabase
    .from("messages")
    .update({ is_read: formData.get("value") === "true" })
    .eq("id", String(formData.get("id")));
  revalidatePath("/dashboard", "layout");
}

export async function deleteMessage(formData: FormData) {
  const admin = await requireSection("messages");
  await admin.supabase.from("messages").delete().eq("id", String(formData.get("id")));
  revalidatePath("/dashboard", "layout");
}

// ---------------------------------------------------------------------------
// Pricing packages
// ---------------------------------------------------------------------------
const packageSchema = (t: T) =>
  z.object({
  name: z.string().trim().min(2, t("أدخل اسم الباقة", "Enter the package name")).max(80),
  name_en: optional(80),
  price: z.coerce.number({ message: t("أدخل السعر", "Enter the price") }).min(0, t("السعر لا يكون سالباً", "The price cannot be negative")).max(1000000),
  currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, t("رمز عملة من 3 أحرف مثل OMR", "A 3-letter currency code like OMR")),
  period: z.enum(["month", "year", "once"]),
  tagline: z.string().trim().max(200),
  tagline_en: optional(200),
  features: z.string().transform(lines).refine((v) => v.length > 0, t("أضف ميزة واحدة على الأقل", "Add at least one item")),
  features_en: z.string().default("").transform(lines),
  cta: optional(60),
  cta_en: optional(60),
  sort_order: z.coerce.number().int().min(0).max(999),
  is_featured: checkbox,
  is_published: checkbox,
});

export async function savePackage(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("pricing");
  const { t } = await getDashT();
  const values = formObject(formData);
  const parsed = packageSchema(t).safeParse(values);
  if (!parsed.success) return { ok: false, message: t("راجع الحقول المظللة.", "Check the highlighted fields."), errors: fieldErrors(parsed.error), values };
  const id = String(formData.get("id") ?? "");
  // Only one package carries the "most popular" badge.
  if (parsed.data.is_featured) {
    let q = admin.supabase.from("packages").update({ is_featured: false }).eq("is_featured", true);
    if (id) q = q.neq("id", id);
    await q;
  }
  const { error } = id
    ? await admin.supabase.from("packages").update(parsed.data).eq("id", id)
    : await admin.supabase.from("packages").insert(parsed.data);
  if (error) return { ok: false, message: t("تعذّر الحفظ: ", "Could not save: ") + error.message, values };
  refreshSite();
  redirect("/dashboard/pricing?saved=1");
}

export async function deletePackage(formData: FormData) {
  const admin = await requireSection("pricing");
  await admin.supabase.from("packages").delete().eq("id", String(formData.get("id")));
  refreshSite();
}

export async function togglePackage(formData: FormData) {
  const admin = await requireSection("pricing");
  await admin.supabase
    .from("packages")
    .update({ is_published: formData.get("value") === "true" })
    .eq("id", String(formData.get("id")));
  refreshSite();
}

// ---------------------------------------------------------------------------
// Images inside article / project / service content
// ---------------------------------------------------------------------------
export async function uploadContentImage(formData: FormData): Promise<{ url?: string; error?: string }> {
  const admin = await requireSection("content");
  const folder = String(formData.get("folder") ?? "content").replace(/[^a-z-]/g, "") || "content";
  const fd = new FormData();
  fd.set("img_file", formData.get("file") as File);
  const res = await resolveImage(admin, fd, "img", folder);
  if ("error" in res) return { error: res.error };
  return res.url ? { url: res.url } : { error: (await getDashT()).t("اختر صورة.", "Choose an image.") };
}
