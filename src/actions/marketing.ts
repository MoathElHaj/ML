"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdmin } from "@/lib/supabase/server";
import { AiError, generateAdPlan, normalizePlan, type AdPlan } from "@/lib/ai";
import { createClickToWhatsAppCampaign, listAdAccounts, listPages, MetaError, resolveInterests } from "@/lib/meta";
import { site } from "@/lib/site";
import { defaultServices } from "@/lib/content";
import { fieldErrors, formObject } from "@/lib/validation";
import type { FormState } from "@/lib/types";

type Admin = NonNullable<Awaited<ReturnType<typeof getAdmin>>>;

async function requireAdmin(): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  return admin;
}

export type MetaConnection = {
  access_token: string;
  token_expires_at: string | null;
  fb_user_name: string | null;
  ad_account_id: string | null;
  ad_account_name: string | null;
  ad_account_currency: string | null;
  page_id: string | null;
  page_name: string | null;
  whatsapp_number: string | null;
};

async function connection(admin: Admin) {
  const { data } = await admin.supabase.from("meta_connection").select("*").eq("id", 1).maybeSingle();
  return (data as MetaConnection | null) ?? null;
}

// ---------------------------------------------------------------------------
// Connection
// ---------------------------------------------------------------------------
export async function saveMetaAssets(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const conn = await connection(admin);
  if (!conn) return { ok: false, message: "اربط حساب Meta أولاً." };

  const adAccountId = String(formData.get("ad_account_id") ?? "");
  const pageId = String(formData.get("page_id") ?? "");
  const whatsapp = String(formData.get("whatsapp_number") ?? "").replace(/\D/g, "");
  if (!adAccountId || !pageId) return { ok: false, message: "اختر الحساب الإعلاني والصفحة." };
  if (whatsapp && whatsapp.length < 8) return { ok: false, message: "رقم واتساب غير صحيح.", errors: { whatsapp_number: "أدخل الرقم بالصيغة الدولية" } };

  try {
    // Re-read from Meta so we only store assets this token can really use.
    const [accounts, pages] = await Promise.all([listAdAccounts(conn.access_token), listPages(conn.access_token)]);
    const account = accounts.find((a) => a.id === adAccountId);
    const page = pages.find((p) => p.id === pageId);
    if (!account || !page) return { ok: false, message: "الحساب أو الصفحة غير متاحين لهذا المستخدم في Meta." };

    const { error } = await admin.supabase
      .from("meta_connection")
      .update({
        ad_account_id: account.id,
        ad_account_name: account.name,
        ad_account_currency: account.currency,
        page_id: page.id,
        page_name: page.name,
        whatsapp_number: whatsapp || null,
      })
      .eq("id", 1);
    if (error) return { ok: false, message: `تعذّر الحفظ: ${error.message}` };
  } catch (e) {
    return { ok: false, message: e instanceof MetaError ? `Meta: ${e.message}` : "تعذّر الاتصال بـ Meta." };
  }
  revalidatePath("/dashboard/marketing");
  return { ok: true, message: "تم حفظ إعدادات الربط." };
}

export async function disconnectMeta() {
  const admin = await requireAdmin();
  await admin.supabase.from("meta_connection").delete().eq("id", 1);
  revalidatePath("/dashboard/marketing");
}

// ---------------------------------------------------------------------------
// AI campaign drafts
// ---------------------------------------------------------------------------
const briefSchema = z.object({
  service_slug: z.string().min(1, "اختر الخدمة"),
  goal: z.string().trim().min(5, "صف هدف الحملة").max(500),
  audience: z.string().trim().max(500),
  countries: z
    .string()
    .transform((v) =>
      v
        .split(/[,،\s]+/)
        .map((c) => c.trim().toUpperCase())
        .filter((c) => /^[A-Z]{2}$/.test(c)),
    )
    .refine((v) => v.length > 0, "أدخل رمز دولة واحد على الأقل مثل OM"),
  daily_budget: z.coerce.number().positive("أدخل ميزانية يومية").max(100000),
  duration_days: z.coerce.number().int().min(2, "يومان على الأقل").max(90),
  language: z.enum(["ar", "en"]),
  offer: z.string().trim().max(300),
  image_url: z.string().trim().min(1, "اختر صورة الإعلان"),
});

export async function generateCampaign(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const values = formObject(formData);
  const parsed = briefSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "راجع الحقول المظللة.", errors: fieldErrors(parsed.error), values };
  const brief = parsed.data;
  const conn = await connection(admin);
  const currency = conn?.ad_account_currency ?? "USD";
  const service = defaultServices.find((s) => s.slug === brief.service_slug);

  let plan: AdPlan;
  try {
    plan = await generateAdPlan({
      service: service ? `${service.title} (${service.title_en}) — ${service.summary_en}` : brief.service_slug,
      goal: brief.goal,
      audience: brief.audience,
      countries: brief.countries,
      dailyBudget: brief.daily_budget,
      currency,
      durationDays: brief.duration_days,
      language: brief.language,
      offer: brief.offer,
    });
  } catch (e) {
    return { ok: false, message: e instanceof AiError ? e.message : "تعذّر توليد الحملة. حاول مرة أخرى.", values };
  }

  const { data, error } = await admin.supabase
    .from("ad_campaigns")
    .insert({
      title: plan.campaign_name,
      service_slug: brief.service_slug,
      brief: { ...brief, currency },
      plan,
      image_url: brief.image_url,
      daily_budget: brief.daily_budget,
      duration_days: brief.duration_days,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: `تعذّر حفظ المسودة: ${error.message}`, values };
  revalidatePath("/dashboard/marketing");
  redirect(`/dashboard/marketing/${data.id}?generated=1`);
}

const lines = (v: string) =>
  v
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

const planEditSchema = z.object({
  campaign_name: z.string().trim().min(2).max(100),
  headline: z.string().trim().min(2, "أدخل العنوان").max(40, "40 حرفاً كحد أقصى"),
  primary_text: z.string().trim().min(10, "أدخل نص الإعلان").max(500, "500 حرف كحد أقصى"),
  description: z.string().trim().max(30, "30 حرفاً كحد أقصى"),
  welcome_message: z.string().trim().min(2, "أدخل رسالة الترحيب").max(200, "200 حرف كحد أقصى"),
  icebreakers: z.string().transform(lines),
  age_min: z.coerce.number().int().min(18).max(65),
  age_max: z.coerce.number().int().min(18).max(65),
  gender: z.enum(["all", "male", "female"]),
  countries: z.string(),
  interests: z.string().transform((v) => v.split(/[,،\n]/).map((s) => s.trim()).filter(Boolean)),
  daily_budget: z.coerce.number().positive("أدخل ميزانية يومية").max(100000),
  duration_days: z.coerce.number().int().min(2, "يومان على الأقل").max(90),
  image_url: z.string().trim().min(1, "اختر صورة الإعلان"),
});

export async function savePlan(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const values = formObject(formData);
  const parsed = planEditSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "راجع الحقول المظللة.", errors: fieldErrors(parsed.error), values };
  const v = parsed.data;
  if (v.age_max < v.age_min) return { ok: false, message: "العمر الأقصى أصغر من الأدنى.", errors: { age_max: "يجب أن يكون أكبر من العمر الأدنى" }, values };

  const { data: existing } = await admin.supabase.from("ad_campaigns").select("plan, status").eq("id", id).maybeSingle();
  if (!existing) return { ok: false, message: "الحملة غير موجودة." };
  if (existing.status === "created") return { ok: false, message: "أُنشئت هذه الحملة في Meta بالفعل. عدّلها من مدير الإعلانات." };

  const plan = normalizePlan(
    {
      ...(existing.plan as AdPlan),
      campaign_name: v.campaign_name,
      headline: v.headline,
      primary_text: v.primary_text,
      description: v.description,
      welcome_message: v.welcome_message,
      icebreakers: v.icebreakers,
      age_min: v.age_min,
      age_max: v.age_max,
      gender: v.gender,
      countries: v.countries.split(/[,،\s]+/),
      interests: v.interests,
    },
    ["OM"],
  );
  const { error } = await admin.supabase
    .from("ad_campaigns")
    .update({ title: plan.campaign_name, plan, daily_budget: v.daily_budget, duration_days: v.duration_days, image_url: v.image_url })
    .eq("id", id);
  if (error) return { ok: false, message: `تعذّر الحفظ: ${error.message}`, values };
  revalidatePath(`/dashboard/marketing/${id}`);
  return { ok: true, message: "تم حفظ التعديلات." };
}

export async function deleteCampaignDraft(formData: FormData) {
  const admin = await requireAdmin();
  await admin.supabase.from("ad_campaigns").delete().eq("id", String(formData.get("id")));
  revalidatePath("/dashboard/marketing");
  redirect("/dashboard/marketing");
}

// ---------------------------------------------------------------------------
// Publish to Meta (always PAUSED)
// ---------------------------------------------------------------------------
async function imageBase64(url: string) {
  const absolute = url.startsWith("http") ? url : `${site.url}${url}`;
  const res = await fetch(absolute, { cache: "no-store" });
  if (!res.ok) throw new Error(`تعذّر تحميل صورة الإعلان (${res.status}).`);
  return Buffer.from(await res.arrayBuffer()).toString("base64");
}

export async function publishToMeta(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const conn = await connection(admin);
  if (!conn?.ad_account_id || !conn.page_id) return { ok: false, message: "أكمل ربط Meta (الحساب الإعلاني والصفحة) أولاً." };
  if (conn.token_expires_at && new Date(conn.token_expires_at) < new Date()) return { ok: false, message: "انتهت صلاحية ربط Meta. أعد الربط من صفحة الحملات." };

  const { data: row } = await admin.supabase.from("ad_campaigns").select("*").eq("id", id).maybeSingle();
  if (!row) return { ok: false, message: "الحملة غير موجودة." };
  if (row.status === "created") return { ok: true, message: "الحملة موجودة في Meta بالفعل." };
  const plan = row.plan as AdPlan;

  const record = async (r: { campaignId?: string; adsetId?: string; creativeId?: string; adId?: string }) => {
    await admin.supabase
      .from("ad_campaigns")
      .update({ meta_campaign_id: r.campaignId ?? null, meta_adset_id: r.adsetId ?? null, meta_creative_id: r.creativeId ?? null, meta_ad_id: r.adId ?? null })
      .eq("id", id);
  };

  try {
    const [interests, bytes] = await Promise.all([resolveInterests(conn.access_token, plan.interests), imageBase64(row.image_url)]);
    await createClickToWhatsAppCampaign(
      {
        token: conn.access_token,
        adAccountId: conn.ad_account_id,
        currency: conn.ad_account_currency ?? "USD",
        pageId: conn.page_id,
        whatsappNumber: conn.whatsapp_number,
        name: plan.campaign_name,
        headline: plan.headline,
        primaryText: plan.primary_text,
        description: plan.description,
        welcomeMessage: plan.welcome_message,
        icebreakers: plan.icebreakers,
        imageBytesBase64: bytes,
        dailyBudget: Number(row.daily_budget),
        durationDays: row.duration_days,
        countries: plan.countries,
        ageMin: plan.age_min,
        ageMax: plan.age_max,
        gender: plan.gender,
        interests,
      },
      record,
    );
    await admin.supabase.from("ad_campaigns").update({ status: "created", error: null }).eq("id", id);
  } catch (e) {
    const message = e instanceof MetaError ? `Meta: ${e.message}` : e instanceof Error ? e.message : "خطأ غير متوقع";
    await admin.supabase.from("ad_campaigns").update({ status: "failed", error: message }).eq("id", id);
    revalidatePath(`/dashboard/marketing/${id}`);
    return { ok: false, message: `تعذّر إنشاء الحملة: ${message}` };
  }
  revalidatePath("/dashboard/marketing");
  revalidatePath(`/dashboard/marketing/${id}`);
  return { ok: true, message: "تم إنشاء الحملة في Meta وهي متوقفة (PAUSED). راجعها وفعّلها من مدير الإعلانات." };
}
