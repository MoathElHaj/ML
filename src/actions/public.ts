"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { after } from "next/server";
import { ATTRIBUTION_COOKIE, cleanAttribution } from "@/lib/attribution";
import { createPublicClient } from "@/lib/supabase/public";
import { createServiceClient } from "@/lib/supabase/service";
import { consultationSchema, fieldErrors, formObject, messageSchema } from "@/lib/validation";
import { getBlockedDays, getBookingSettings } from "@/lib/settings";
import { notifyNewBooking, notifyNewMessage } from "@/lib/email";
import { getDict, isLang, type Lang } from "@/lib/i18n";
import { defaultServices } from "@/lib/content";
import type { Consultation, FormState, Message } from "@/lib/types";

/** Bots fill every field; people never see this one. */
function isBot(formData: FormData) {
  return Boolean(formData.get("website"));
}

/** The ad/campaign that brought this visitor, if any (see AttributionCapture). */
async function attribution() {
  const raw = (await cookies()).get(ATTRIBUTION_COOKIE)?.value;
  if (!raw) return {};
  try {
    return cleanAttribution(JSON.parse(raw));
  } catch {
    return {};
  }
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
  const lang = langOf(formData);
  const f = getDict(lang).form;
  const values = formObject(formData);
  const [booking, blocked] = await Promise.all([getBookingSettings(), getBlockedDays()]);
  const parsed = consultationSchema(lang, booking, blocked).safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: f.msg.review, errors: fieldErrors(parsed.error), values };
  }

  // With the service key the server may auto-confirm; otherwise visitors can only create pending bookings.
  const service = createServiceClient();
  const db = service ?? createPublicClient();
  if (!db) return { ok: false, message: f.msg.bookingOffline, values };

  const row = {
    id: randomUUID(),
    ...parsed.data,
    lang,
    utm: await attribution(),
    status: service && booking.auto_confirm ? ("confirmed" as const) : ("pending" as const),
  };
  const { error } = await db.from("consultations").insert(row);
  if (error) {
    if (error.code === "23505") {
      return { ok: false, message: f.msg.slotTaken, errors: { scheduled_time: f.errors.slotTaken }, values };
    }
    if (/too_many|rate_limited/.test(error.message)) return { ok: false, message: f.msg.tooMany, values };
    console.error("bookConsultation", error.message);
    return { ok: false, message: f.msg.bookingFailed, values };
  }

  const consultation: Consultation = { ...row, admin_notes: null, created_at: new Date().toISOString() };
  const serviceTitle = defaultServices.find((s) => s.slug === row.service_slug)?.title ?? row.service_slug;
  after(() => notifyNewBooking(consultation, serviceTitle, booking.duration_minutes, booking.time_zone));

  return { ok: true, message: row.status === "confirmed" ? f.msg.bookingConfirmed : f.msg.bookingOk };
}

export async function sendMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  if (isBot(formData)) return { ok: true };
  const lang = langOf(formData);
  const f = getDict(lang).form;
  const values = formObject(formData);
  const parsed = messageSchema(lang).safeParse(values);
  if (!parsed.success) {
    return { ok: false, message: f.msg.review, errors: fieldErrors(parsed.error), values };
  }
  if (!parsed.data.email && !parsed.data.phone) {
    return { ok: false, message: f.msg.needContact, errors: { phone: f.errors.contactMethod }, values };
  }
  const supabase = createPublicClient();
  if (!supabase) return { ok: false, message: f.msg.contactOffline, values };

  const row = { id: randomUUID(), ...parsed.data, lang, utm: await attribution() };
  const { error } = await supabase.from("messages").insert(row);
  if (error) {
    if (/too_many|rate_limited/.test(error.message)) return { ok: false, message: f.msg.tooMany, values };
    console.error("sendMessage", error.message);
    return { ok: false, message: f.msg.contactFailed, values };
  }
  const message: Message = { ...row, is_read: false, created_at: new Date().toISOString() };
  after(() => notifyNewMessage(message));
  return { ok: true, message: f.msg.contactOk };
}
