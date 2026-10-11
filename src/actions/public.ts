"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { consultationSchema, fieldErrors, formObject, messageSchema } from "@/lib/validation";
import { getDict, isLang, type Lang } from "@/lib/i18n";
import type { FormState } from "@/lib/types";

/** Bots fill every field; people never see this one. */
function isBot(formData: FormData) {
  return Boolean(formData.get("website"));
}

function langOf(formData: FormData): Lang {
  const v = String(formData.get("lang") ?? "");
  return isLang(v) ? v : "ar";
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
  const f = getDict(langOf(formData)).form;
  const values = formObject(formData);
  const parsed = consultationSchema(langOf(formData)).safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: f.msg.review, errors: fieldErrors(parsed.error), values };
  }
  const supabase = createPublicClient();
  if (!supabase) return { ok: false, message: f.msg.bookingOffline, values };

  const { error } = await supabase.from("consultations").insert(parsed.data);
  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: f.msg.slotTaken, errors: { scheduled_time: f.errors.slotTaken }, values };
    }
    console.error("bookConsultation", error.message);
    return { ok: false, message: f.msg.bookingFailed, values };
  }
  return { ok: true, message: f.msg.bookingOk };
}

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { ok: true };
  const f = getDict(langOf(formData)).form;
  const values = formObject(formData);
  const parsed = messageSchema(langOf(formData)).safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: f.msg.review, errors: fieldErrors(parsed.error), values };
  }
  if (!parsed.data.email && !parsed.data.phone) {
    return { ok: false, message: f.msg.needContact, errors: { phone: f.errors.contactMethod }, values };
  }
  const supabase = createPublicClient();
  if (!supabase) return { ok: false, message: f.msg.contactOffline, values };

  const { error } = await supabase.from("messages").insert(parsed.data);
  if (error) {
    console.error("sendMessage", error.message);
    return { ok: false, message: f.msg.contactFailed, values };
  }
  return { ok: true, message: f.msg.contactOk };
}
