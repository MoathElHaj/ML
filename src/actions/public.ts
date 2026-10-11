"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { consultationSchema, fieldErrors, formObject, messageSchema } from "@/lib/validation";
import type { FormState } from "@/lib/types";

const NOT_CONFIGURED: FormState = {
  ok: false,
  message: "نظام الحجز غير متصل بقاعدة البيانات بعد. تواصل معنا عبر واتساب.",
};

/** Bots fill every field; people never see this one. */
function isBot(formData: FormData) {
  return Boolean(formData.get("website"));
}

export async function getBookedSlots(day: string): Promise<string[]> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return [];
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data, error } = await supabase.rpc("booked_slots", { p_date: day });
  if (error || !data) return [];
  return (data as string[]).map((t) => t.slice(0, 5));
}

export async function bookConsultation(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { ok: true };
  const values = formObject(formData);
  const parsed = consultationSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: "راجع الحقول المظللة.", errors: fieldErrors(parsed.error), values };
  }
  const supabase = createPublicClient();
  if (!supabase) return { ...NOT_CONFIGURED, values };

  const { error } = await supabase.from("consultations").insert(parsed.data);
  if (error) {
    if (error.code === "23505") {
      return {
        ok: false,
        message: "تم حجز هذا الموعد للتو. اختر وقتاً آخر من فضلك.",
        errors: { scheduled_time: "هذا الوقت لم يعد متاحاً" },
        values,
      };
    }
    console.error("bookConsultation", error.message);
    return { ok: false, message: "تعذّر إرسال الحجز. حاول مرة أخرى أو تواصل معنا عبر واتساب.", values };
  }
  return { ok: true, message: "تم استلام طلبك! سنؤكد موعد الاستشارة معك قريباً." };
}

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { ok: true };
  const values = formObject(formData);
  const parsed = messageSchema.safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: "راجع الحقول المظللة.", errors: fieldErrors(parsed.error), values };
  }
  if (!parsed.data.email && !parsed.data.phone) {
    return { ok: false, message: "نحتاج وسيلة للرد عليك.", errors: { phone: "أدخل رقم الهاتف أو البريد الإلكتروني" }, values };
  }
  const supabase = createPublicClient();
  if (!supabase) return { ...NOT_CONFIGURED, message: "نموذج التواصل غير متصل بعد. راسلنا عبر واتساب.", values };

  const { error } = await supabase.from("messages").insert(parsed.data);
  if (error) {
    console.error("sendMessage", error.message);
    return { ok: false, message: "تعذّر إرسال الرسالة. حاول مرة أخرى.", values };
  }
  return { ok: true, message: "وصلتنا رسالتك، وسنرد عليك خلال يوم عمل." };
}
