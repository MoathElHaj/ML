"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSection, type Admin } from "@/lib/supabase/server";
import { fieldErrors, formObject } from "@/lib/validation";
import { DEFAULT_EMAIL, type EmailSettings } from "@/lib/settings";
import { isEmailReady, sendMail, testMail } from "@/lib/email";
import type { FormState } from "@/lib/types";
import { getDashT } from "@/lib/dash";
import { DEFAULT_WHATSAPP, type WhatsAppSettings } from "@/lib/whatsapp";
import type { T } from "@/lib/dash-i18n";

const checkbox = z
  .string()
  .optional()
  .transform((v) => v === "on" || v === "true");

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// ---------------------------------------------------------------------------
// Booking
// ---------------------------------------------------------------------------
const bookingSchema = (t: T) => z.object({
  slots: z
    .string()
    .transform((v) =>
      [...new Set(v.split(/[\s,،]+/).map((s) => s.trim()).filter(Boolean))].map((s) => (s.length === 4 ? `0${s}` : s)).sort(),
    )
    .refine((v) => v.length > 0 && v.every((s) => TIME.test(s)), t("أدخل الأوقات بصيغة 24 ساعة مثل 10:00 و 16:30", "Enter times in 24-hour format, e.g. 10:00 and 16:30")),
  days_ahead: z.coerce.number().int().min(1).max(120),
  duration_minutes: z.coerce.number().int().min(10).max(240),
  time_zone: z.string().refine((tz) => {
    try {
      new Intl.DateTimeFormat("en", { timeZone: tz });
      return true;
    } catch {
      return false;
    }
  }, t("منطقة زمنية غير صحيحة", "Invalid time zone")),
  auto_confirm: checkbox,
  reminders: checkbox,
});

export async function saveBookingSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("settings");
  const { t } = await getDashT();
  const values = formObject(formData);
  const parsed = bookingSchema(t).safeParse(values);
  if (!parsed.success) return { ok: false, message: t("راجع الحقول المظللة.", "Check the highlighted fields."), errors: fieldErrors(parsed.error), values };
  const working_days = formData
    .getAll("working_days")
    .map(Number)
    .filter((d) => d >= 0 && d <= 6);
  if (!working_days.length)
    return { ok: false, message: t("اختر يوم عمل واحداً على الأقل.", "Pick at least one working day."), errors: { working_days: t("اختر يوماً واحداً على الأقل", "Pick at least one day") }, values };

  const { error } = await admin.supabase.from("site_settings").upsert({ key: "booking", value: { ...parsed.data, working_days } });
  if (error) return { ok: false, message: t("تعذّر الحفظ: ", "Couldn't save: ") + error.message, values };
  revalidatePath("/", "layout");
  return { ok: true, message: t("تم حفظ إعدادات الحجز. صفحة الحجز في الموقع تعمل بها الآن.", "Booking settings saved. The website booking page uses them now.") };
}

export async function addBlockedDate(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("bookings");
  const { t } = await getDashT();
  const day = String(formData.get("day") ?? "");
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 120) || null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return { ok: false, message: t("اختر التاريخ.", "Pick a date.") };
  const { error } = await admin.supabase.from("blocked_dates").upsert({ day, reason });
  if (error) return { ok: false, message: t("تعذّر الحفظ: ", "Couldn't save: ") + error.message };
  revalidatePath("/", "layout");
  return { ok: true, message: t("تمت إضافة يوم الإجازة.", "Day off added.") };
}

export async function removeBlockedDate(formData: FormData) {
  const admin = await requireSection("bookings");
  await admin.supabase.from("blocked_dates").delete().eq("day", String(formData.get("day")));
  revalidatePath("/", "layout");
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------
const emailList = (t: T) => z.string().transform((v, ctx) => {
  const list = [...new Set(v.split(/[\s,،;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean))];
  for (const e of list) if (!z.email().safeParse(e).success) ctx.addIssue({ code: "custom", message: t("بريد غير صحيح: ", "Invalid email: ") + e });
  return list;
});

const emailSchema = (t: T) => z.object({
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
    .refine((v) => v === "" || z.email().safeParse(v).success, t("بريد المرسل غير صحيح", "Invalid sender email")),
  notify_to: emailList(t),
  notify_bookings: checkbox,
  notify_messages: checkbox,
  client_confirmations: checkbox,
});

async function currentEmail(admin: Admin): Promise<EmailSettings> {
  const { data } = await admin.supabase.from("private_settings").select("value").eq("key", "email").maybeSingle();
  return { ...DEFAULT_EMAIL, ...((data?.value as Partial<EmailSettings>) ?? {}) };
}

export async function saveEmailSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("settings");
  const { t } = await getDashT();
  const values = formObject(formData);
  const parsed = emailSchema(t).safeParse(values);
  // Never echo the password back into the form.
  const safeValues = { ...values, password: "" };
  if (!parsed.success) return { ok: false, message: t("راجع الحقول المظللة.", "Check the highlighted fields."), errors: fieldErrors(parsed.error), values: safeValues };
  const next = parsed.data;
  if (next.enabled && (!next.host || !next.from_email)) {
    const req = t("مطلوب", "Required");
    return { ok: false, message: t("لتفعيل الإرسال أدخل خادم SMTP وبريد المرسل.", "To enable sending, enter the SMTP host and sender email."), errors: { host: next.host ? "" : req, from_email: next.from_email ? "" : req }, values: safeValues };
  }
  const existing = await currentEmail(admin);
  // An empty password field keeps the saved one.
  const value: EmailSettings = { ...next, password: next.password ? next.password : existing.password };
  const { error } = await admin.supabase.from("private_settings").upsert({ key: "email", value });
  if (error) return { ok: false, message: t("تعذّر الحفظ: ", "Couldn't save: ") + error.message, values: safeValues };
  revalidatePath("/dashboard/settings");
  return { ok: true, message: t("تم حفظ إعدادات البريد.", "Email settings saved.") };
}

export async function sendTestEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("settings");
  const { t } = await getDashT();
  const to = String(formData.get("to") ?? "").trim();
  if (!z.email().safeParse(to).success) return { ok: false, message: t("أدخل بريداً صحيحاً لاستلام الرسالة التجريبية.", "Enter a valid email to receive the test message.") };
  const settings = await currentEmail(admin);
  if (!isEmailReady(settings)) return { ok: false, message: t("فعّل الإرسال وأكمل إعدادات SMTP واحفظها أولاً.", "Enable sending, complete the SMTP settings and save first.") };
  const res = await sendMail(testMail(to), settings);
  revalidatePath("/dashboard/settings");
  return res.ok ? { ok: true, message: t(`أُرسلت رسالة تجريبية إلى ${to}.`, `Test message sent to ${to}.`) } : { ok: false, message: t("فشل الإرسال: ", "Sending failed: ") + res.error };
}

// ---------------------------------------------------------------------------
// Tracking (Google Tag Manager, GA4, Google Ads, Meta Pixel)
// ---------------------------------------------------------------------------
const opt = (re: RegExp, msg: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || re.test(v), msg);

const trackingSchema = (t: T) => z.object({
  gtm_id: opt(/^GTM-[A-Z0-9]{4,12}$/, t("المعرّف يبدأ بـ GTM- مثل GTM-ABC1234", "Starts with GTM-, e.g. GTM-ABC1234")),
  ga4_id: opt(/^G-[A-Z0-9]{4,14}$/, t("المعرّف يبدأ بـ G- مثل G-AB12CD34EF", "Starts with G-, e.g. G-AB12CD34EF")),
  google_ads_id: opt(/^AW-\d{6,14}$/, t("المعرّف يبدأ بـ AW- مثل AW-123456789", "Starts with AW-, e.g. AW-123456789")),
  google_ads_lead_label: opt(/^[A-Za-z0-9_-]{4,40}$/, t("تسمية التحويل غير صحيحة", "Invalid conversion label")),
  meta_pixel_id: opt(/^\d{8,20}$/, t("معرّف البكسل أرقام فقط", "The Pixel ID is digits only")),
});

export async function saveTrackingSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("settings");
  const { t } = await getDashT();
  const values = formObject(formData);
  const upper = { ...values, gtm_id: values.gtm_id?.toUpperCase(), ga4_id: values.ga4_id?.toUpperCase(), google_ads_id: values.google_ads_id?.toUpperCase() };
  const parsed = trackingSchema(t).safeParse(upper);
  if (!parsed.success) return { ok: false, message: t("راجع الحقول المظللة.", "Check the highlighted fields."), errors: fieldErrors(parsed.error), values };
  const { error } = await admin.supabase.from("site_settings").upsert({ key: "tracking", value: parsed.data });
  if (error) return { ok: false, message: t("تعذّر الحفظ: ", "Couldn't save: ") + error.message, values };
  revalidatePath("/", "layout");
  return { ok: true, message: t("تم الحفظ. أكواد التتبع تعمل على الموقع الآن.", "Saved. The tracking codes are live on the website.") };
}

// ---------------------------------------------------------------------------
// Integrations: WhatsApp Cloud API + clients automation
// ---------------------------------------------------------------------------
export async function saveWhatsAppSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("settings");
  const { t } = await getDashT();
  const values = formObject(formData);
  const digits = (v?: string) => (v ?? "").replace(/\D/g, "");
  const { data } = await admin.supabase.from("private_settings").select("value").eq("key", "whatsapp").maybeSingle();
  const current: WhatsAppSettings = { ...DEFAULT_WHATSAPP, ...((data?.value as Partial<WhatsAppSettings>) ?? {}) };
  const verify = (values.verify_token ?? "").trim();
  if (verify && !/^[A-Za-z0-9_-]{8,80}$/.test(verify))
    return { ok: false, message: t("رمز التحقق: 8 أحرف إنجليزية أو أرقام على الأقل.", "Verify token: at least 8 letters or digits."), errors: { verify_token: t("غير صالح", "Invalid") }, values: { ...values, access_token: "", app_secret: "" } };
  // Empty secret fields keep the saved values.
  const value: WhatsAppSettings = {
    phone_number_id: digits(values.phone_number_id),
    business_account_id: digits(values.business_account_id),
    access_token: values.access_token?.trim() || current.access_token,
    app_secret: values.app_secret?.trim() || current.app_secret,
    verify_token: verify || current.verify_token,
  };
  const { error } = await admin.supabase.from("private_settings").upsert({ key: "whatsapp", value });
  if (error) return { ok: false, message: t("تعذّر الحفظ: ", "Couldn't save: ") + error.message };
  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/clients");
  return { ok: true, message: t("تم حفظ إعدادات واتساب.", "WhatsApp settings saved.") };
}

export async function saveCrmSettings(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("settings");
  const { t } = await getDashT();
  const { error } = await admin.supabase.from("site_settings").upsert({ key: "crm", value: { auto_followup: formData.get("auto_followup") === "on" } });
  if (error) return { ok: false, message: t("تعذّر الحفظ: ", "Couldn't save: ") + error.message };
  return { ok: true, message: t("تم الحفظ.", "Saved.") };
}
