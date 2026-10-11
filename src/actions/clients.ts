"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSection } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getDashT } from "@/lib/dash";
import { syncMetaLeads } from "@/lib/leads";
import { getWhatsAppSettings, isWhatsAppReady, sendWhatsAppText } from "@/lib/whatsapp";
import { fieldErrors, formObject } from "@/lib/validation";
import type { ContactStage, FormState } from "@/lib/types";

const STAGES = ["new", "contacted", "qualified", "proposal", "won", "lost"] as const;
const SOURCES = ["website", "booking", "contact_form", "whatsapp", "meta_ads", "meta_lead_form", "google_ads", "instagram", "referral", "manual", "other"] as const;
const empty = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);

async function contactSchema() {
  const { t } = await getDashT();
  return z
    .object({
      full_name: z.string().trim().min(1, t("اكتب اسم العميل.", "Enter the client's name.")).max(120),
      phone: z.preprocess(empty, z.string().trim().max(30).regex(/^[+\d\s()-]{6,30}$/, t("رقم غير صالح.", "Invalid number.")).nullable()),
      email: z.preprocess(empty, z.string().trim().email(t("بريد غير صالح.", "Invalid email.")).max(200).nullable()),
      company: z.preprocess(empty, z.string().trim().max(160).nullable()),
      source: z.enum(SOURCES).default("manual"),
      campaign: z.preprocess(empty, z.string().trim().max(200).nullable()),
      stage: z.enum(STAGES).default("new"),
      value: z.preprocess((v) => (empty(v) === null ? null : Number(v)), z.number().min(0).max(1e9).nullable()),
      service_slug: z.preprocess(empty, z.string().max(80).nullable()),
      tags: z.preprocess(
        (v) => (typeof v === "string" ? v.split(/[,،]/).map((x) => x.trim()).filter(Boolean).slice(0, 12) : []),
        z.array(z.string().max(40)),
      ),
      notes: z.preprocess(empty, z.string().trim().max(4000).nullable()),
      assignee_id: z.preprocess(empty, z.string().uuid().nullable()),
    })
    .refine((v) => v.phone || v.email, { message: t("أدخل رقم الهاتف أو البريد.", "Enter a phone number or an email."), path: ["phone"] });
}

function normalizePhone(p: string | null) {
  if (!p) return null;
  const d = p.replace(/\D/g, "").replace(/^00/, "");
  if (!d) return null;
  return d.length === 8 ? `968${d}` : d;
}

function refresh(id?: string) {
  revalidatePath("/dashboard/clients");
  if (id) revalidatePath(`/dashboard/clients/${id}`);
  revalidatePath("/dashboard", "layout");
}

export async function saveContact(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("clients");
  const { t } = await getDashT();
  const id = String(formData.get("id") ?? "");
  const values = formObject(formData);
  const parsed = (await contactSchema()).safeParse(values);
  if (!parsed.success) return { ok: false, message: t("راجع الحقول المظللة.", "Check the highlighted fields."), errors: fieldErrors(parsed.error), values };
  const v = parsed.data;
  const row = { ...v, phone_norm: normalizePhone(v.phone), email: v.email?.toLowerCase() ?? null };

  if (id) {
    const { data: before } = await admin.supabase.from("contacts").select("stage").eq("id", id).maybeSingle();
    const { error } = await admin.supabase.from("contacts").update(row).eq("id", id);
    if (error) return { ok: false, message: duplicateMessage(error.message, t), values };
    if (before && before.stage !== v.stage) await logStage(admin, id, before.stage, v.stage);
    refresh(id);
    return { ok: true, message: t("تم الحفظ.", "Saved.") };
  }

  const { data, error } = await admin.supabase.from("contacts").insert({ ...row, last_activity_at: new Date().toISOString() }).select("id").single();
  if (error) return { ok: false, message: duplicateMessage(error.message, t), values };
  await admin.supabase.from("contact_activities").insert({ contact_id: data.id, kind: "note", body: t("أضيف يدوياً.", "Added manually."), author_id: admin.user.id });
  refresh();
  redirect(`/dashboard/clients/${data.id}`);
}

function duplicateMessage(message: string, t: (ar: string, en: string) => string) {
  return /contacts_phone_uniq|contacts_wa_uniq/.test(message) ? t("يوجد عميل آخر بنفس رقم الهاتف.", "Another client already has this phone number.") : message;
}

async function logStage(admin: Awaited<ReturnType<typeof requireSection>>, id: string, from: string, to: string) {
  await admin.supabase.from("contact_activities").insert({ contact_id: id, kind: "stage", body: `${from} → ${to}`, meta: { from, to }, author_id: admin.user.id });
}

/** Drag-and-drop on the pipeline. */
export async function moveContact(id: string, stage: ContactStage) {
  const admin = await requireSection("clients");
  if (!STAGES.includes(stage)) return;
  const { data: before } = await admin.supabase.from("contacts").select("stage").eq("id", id).maybeSingle();
  if (!before || before.stage === stage) return;
  await admin.supabase.from("contacts").update({ stage, last_activity_at: new Date().toISOString() }).eq("id", id);
  await logStage(admin, id, before.stage, stage);
  refresh(id);
}

export async function addActivity(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireSection("clients");
  const { t } = await getDashT();
  const id = String(formData.get("contact_id") ?? "");
  const kind = String(formData.get("kind") ?? "note");
  const body = String(formData.get("body") ?? "").trim();
  if (!body) return { ok: false, message: t("اكتب الملاحظة.", "Write something first.") };
  if (!["note", "call", "email", "meeting", "whatsapp_out"].includes(kind)) return { ok: false };

  if (kind === "whatsapp_out" && formData.get("send") === "1") {
    const s = await getWhatsAppSettings();
    const { data: c } = await admin.supabase.from("contacts").select("wa_id, phone_norm").eq("id", id).maybeSingle();
    const to = c?.wa_id ?? c?.phone_norm;
    if (!isWhatsAppReady(s)) return { ok: false, message: t("اربط WhatsApp Cloud API من الإعدادات أولاً.", "Connect the WhatsApp Cloud API in Settings first.") };
    if (!to) return { ok: false, message: t("لا يوجد رقم واتساب لهذا العميل.", "This client has no WhatsApp number.") };
    try {
      const messageId = await sendWhatsAppText(s, to, body.slice(0, 4000));
      await admin.supabase
        .from("contact_activities")
        .insert({ contact_id: id, kind, body: body.slice(0, 4000), author_id: admin.user.id, external_id: messageId ? `wa:${messageId}` : null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return {
        ok: false,
        message: /24|window|re-engage|131047/i.test(msg)
          ? t("انتهت نافذة الـ 24 ساعة: لا يمكن إرسال رسالة حرة. استخدم رابط واتساب أو قالب رسالة معتمد.", "The 24-hour window has closed: free-form messages aren't allowed. Use the WhatsApp link or an approved template.")
          : msg,
      };
    }
  } else {
    await admin.supabase.from("contact_activities").insert({ contact_id: id, kind, body: body.slice(0, 4000), author_id: admin.user.id });
  }
  await admin.supabase.from("contacts").update({ last_activity_at: new Date().toISOString() }).eq("id", id);
  refresh(id);
  return { ok: true, message: kind === "whatsapp_out" && formData.get("send") === "1" ? t("أُرسلت الرسالة.", "Message sent.") : t("تمت الإضافة.", "Added.") };
}

export async function deleteActivity(formData: FormData) {
  const admin = await requireSection("clients");
  const id = String(formData.get("id") ?? "");
  const contactId = String(formData.get("contact_id") ?? "");
  await admin.supabase.from("contact_activities").delete().eq("id", id).in("kind", ["note", "call", "email", "meeting"]);
  refresh(contactId);
}

export async function deleteContact(formData: FormData) {
  const admin = await requireSection("clients");
  await admin.supabase.from("contacts").delete().eq("id", String(formData.get("id") ?? ""));
  refresh();
  redirect("/dashboard/clients");
}

export async function runMetaLeadSync(): Promise<FormState> {
  const admin = await requireSection("clients");
  const { t } = await getDashT();
  if (!admin.can("clients")) return { ok: false };
  if (!createServiceClient()) return { ok: false, message: t("أضف SUPABASE_SERVICE_ROLE_KEY أولاً.", "Add SUPABASE_SERVICE_ROLE_KEY first.") };
  const res = await syncMetaLeads();
  refresh();
  if (res.ok) return { ok: true, message: res.imported ? t(`استُورد ${res.imported} عميل محتمل.`, `Imported ${res.imported} leads.`) : t("لا توجد نماذج جديدة.", "No new form leads.") };
  const reason =
    res.error === "not_configured"
      ? t("أضف META_APP_ID و META_APP_SECRET.", "Add META_APP_ID and META_APP_SECRET.")
      : res.error === "no_page"
        ? t("اربط حساب Meta واختر الصفحة من «الحملات الإعلانية».", "Connect Meta and pick a Page under Campaigns.")
        : /permission|leads_retrieval|\(#200\)|\(#10\)/i.test(res.error ?? "")
          ? t("أعد ربط Meta لمنح صلاحية قراءة نماذج العملاء (leads_retrieval).", "Reconnect Meta to grant the leads_retrieval permission.")
          : res.error;
  return { ok: false, message: reason };
}
