"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdmin } from "@/lib/supabase/server";
import { fieldErrors, formObject } from "@/lib/validation";
import { DEFAULT_EMAIL, type EmailSettings } from "@/lib/settings";
import { isEmailReady, sendMail, testMail } from "@/lib/email";
import type { FormState } from "@/lib/types";

type Admin = NonNullable<Awaited<ReturnType<typeof getAdmin>>>;

async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return admin;
}

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------
const bookingSchema = z.object({
  slots: z
    .string()
    .transform((v) =>
      [...new Set(v.split(/[\s,،]+/).map((s) => s.trim()).filter(Boolean))].map((s) => (s.length === 4 ? `0${s}` : s)).sort(),
    )
    .refine((v) => v.length > 0 && v.every((s) => TIME.test(s)), "أدخل الأوقات بصيغة 24 ساعة مثل 10:00 و 16:30"),
  days_ahead: z.coerce.number().int().min(1).max(120),
  duration_minutes: z.coerce.number().int().min(10).max(240),
  time_zone: z.string().refine((tz) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, "منطقة زمنية غير صحيحة"),
  auto_confirm: checkbox,
  reminders: checkbox,
});

export async function saveBookingSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formObject(formData);
  const parsed = bookingSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "راجع الحقول المظللة.", errors: fieldErrors(parsed.error), values };
  const working_days = formData
    .getAll("working_days")
    .map(Number)
    .filter((d) => d >= 0 && d <= 6);
  if (!working_days.length) return { ok: false, message: "اختر يوم عمل واحداً على الأقل.", errors: { working_days: "اختر يوماً واحداً على الأقل" }, values };

  const { error } = await admin.supabase.from("site_settings").upsert({ key: "booking", value: { ...parsed.data, working_days } });
  if (error) return { ok: false, message: `تعذّر الحفظ: ${error.message}`, values };
  revalidatePath("/", "layout");
  return { ok: true, message: "تم حفظ إعدادات الحجز. صفحة الحجز في الموقع تعمل بها الآن." };
}

export async function addBlockedDate(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const day = String(formData.get("day") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 120) || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { ok: false, message: "اختر التاريخ." };
  const { error } = await admin.supabase.from("blocked_dates").upsert({ day, reason });
  if (error) return { ok: false, message: `تعذّر الحفظ: ${error.message}` };
  revalidatePath("/", "layout");
  return { ok: true, message: "تمت إضافة يوم الإجازة." };
}

export async function removeBlockedDate(formData: FormData) {
  const admin = await requireAdmin();
  await admin.supabase.from("blocked_dates").delete().eq("day", String(formData.get("day")));
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------
const emailList = z.string().transform((v, ctx) => {
  const list = [...new Set(v.split(/[\s,،;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean))];
  for (const e of list) if (!z.email().safeParse(e).success) ctx.addIssue({ code: "custom", message: `بريد غير صحيح: ${e}` });
  return list;
});

const emailSchema = z.object({
  enabled: checkbox,
  host: z.string().trim().max(200),
  port: z.coerce.number().int().min(1).max(65535),
  secure: checkbox,
  user: z.string().trim().max(200),
  password: z.string().max(500),
  from_name: z.string().trim().max(100),
  from_email: z
    .string()
    .trim()
    .refine((v) => v === "" || z.email().safeParse(v).success, "بريد المرسل غير صحيح"),
  notify_to: emailList,
  notify_bookings: checkbox,
  notify_messages: checkbox,
  client_confirmations: checkbox,
});

async function currentEmail(admin: Admin): Promise<EmailSettings> {
  const { data } = await admin.supabase.from("private_settings").select("value").eq("key", "email").maybeSingle();
  return { ...DEFAULT_EMAIL, ...((data?.value as Partial<EmailSettings>) ?? {}) };
}

export async function saveEmailSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formObject(formData);
  const parsed = emailSchema.safeParse(values);
  // Never echo the password back into the form.
  const safeValues = { ...values, password: "" };
  if (!parsed.success) return { ok: false, message: "راجع الحقول المظللة.", errors: fieldErrors(parsed.error), values: safeValues };
  const next = parsed.data;
  if (next.enabled && (!next.host || !next.from_email)) {
    return { ok: false, message: "لتفعيل الإرسال أدخل خادم SMTP وبريد المرسل.", errors: { host: next.host ? "" : "مطلوب", from_email: next.from_email ? "" : "مطلوب" }, values: safeValues };
  }
  const existing = await currentEmail(admin);
  // An empty password field keeps the saved one.
  const value: EmailSettings = { ...next, password: next.password ? next.password : existing.password };
  const { error } = await admin.supabase.from("private_settings").upsert({ key: "email", value });
  if (error) return { ok: false, message: `تعذّر الحفظ: ${error.message}`, values: safeValues };
  revalidatePath("/dashboard/settings");
  return { ok: true, message: "تم حفظ إعدادات البريد." };
}

export async function sendTestEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const to = String(formData.get("to") ?? "").trim();
  if (!z.email().safeParse(to).success) return { ok: false, message: "أدخل بريداً صحيحاً لاستلام الرسالة التجريبية." };
  const settings = await currentEmail(admin);
  if (!isEmailReady(settings)) return { ok: false, message: "فعّل الإرسال وأكمل إعدادات SMTP واحفظها أولاً." };
  const res = await sendMail(testMail(to), settings);
  revalidatePath("/dashboard/settings");
  return res.ok ? { ok: true, message: `أُرسلت رسالة تجريبية إلى ${to}.` } : { ok: false, message: `فشل الإرسال: ${res.error}` };
}

// ---------------------------------------------------------------------------
// Tracking (Google Tag Manager, GA4, Google Ads, Meta Pixel)
// ---------------------------------------------------------------------------
const opt = (re: RegExp, msg: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || re.test(v), msg);

const trackingSchema = z.object({
  gtm_id: opt(/^GTM-[A-Z0-9]{4,12}$/, "المعرّف يبدأ بـ GTM- مثل GTM-ABC1234"),
  ga4_id: opt(/^G-[A-Z0-9]{4,14}$/, "المعرّف يبدأ بـ G- مثل G-AB12CD34EF"),
  google_ads_id: opt(/^AW-\d{6,14}$/, "المعرّف يبدأ بـ AW- مثل AW-123456789"),
  google_ads_lead_label: opt(/^[A-Za-z0-9_-]{4,40}$/, "تسمية التحويل غير صحيحة"),
  meta_pixel_id: opt(/^\d{8,20}$/, "معرّف البكسل أرقام فقط"),
});

export async function saveTrackingSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formObject(formData);
  const upper = { ...values, gtm_id: values.gtm_id?.toUpperCase(), ga4_id: values.ga4_id?.toUpperCase(), google_ads_id: values.google_ads_id?.toUpperCase() };
  const parsed = trackingSchema.safeParse(upper);
  if (!parsed.success) return { ok: false, message: "راجع الحقول المظللة.", errors: fieldErrors(parsed.error), values };
  const { error } = await admin.supabase.from("site_settings").upsert({ key: "tracking", value: parsed.data });
  if (error) return { ok: false, message: `تعذّر الحفظ: ${error.message}`, values };
  revalidatePath("/", "layout");
  return { ok: true, message: "تم الحفظ. أكواد التتبع تعمل على الموقع الآن." };
}
