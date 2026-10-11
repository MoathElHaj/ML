import { z } from "zod";
import { addDays, todayIn, weekdayOf } from "./utils";
import { getDict, type Lang } from "./i18n";

/** The booking rules the form is checked against (from dashboard settings). */
export type BookingRules = { working_days: number[]; slots: string[]; days_ahead: number; time_zone: string };

const PHONE = /^\+?[0-9\s-]{6,20}$/;

export function consultationSchema(lang: Lang, booking: BookingRules, blockedDays: string[] = []) {
  const e = getDict(lang).form.errors;
  const optionalText = (max: number) =>
    z
      .string()
      .trim()
      .max(max, e.max(max))
      .transform((v) => (v === "" ? null : v));

  return z
    .object({
      full_name: z.string().trim().min(2, e.name).max(120),
      phone: z.string().trim().regex(PHONE, e.phone),
      email: z
        .string()
        .trim()
        .max(200)
        .refine((v) => v === "" || z.email().safeParse(v).success, e.email)
        .transform((v) => (v === "" ? null : v)),
      company: optionalText(160),
      service_slug: optionalText(80),
      channel: z.enum(["online", "phone", "office"]),
      scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, e.day),
      scheduled_time: z.string().refine((v) => booking.slots.includes(v), e.time),
      message: optionalText(2000),
    })
    .superRefine((v, ctx) => {
      const today = todayIn(booking.time_zone);
      if (v.scheduled_date <= today || v.scheduled_date > addDays(today, booking.days_ahead)) {
        ctx.addIssue({ code: "custom", path: ["scheduled_date"], message: e.dayRange });
      } else if (!booking.working_days.includes(weekdayOf(v.scheduled_date)) || blockedDays.includes(v.scheduled_date)) {
        ctx.addIssue({ code: "custom", path: ["scheduled_date"], message: e.dayOff });
      }
    });
}

export function messageSchema(lang: Lang) {
  const e = getDict(lang).form.errors;
  return z.object({
    full_name: z.string().trim().min(2, e.name).max(120),
    email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === "" || z.email().safeParse(v).success, e.email)
      .transform((v) => (v === "" ? null : v)),
    phone: z
      .string()
      .trim()
      .refine((v) => v === "" || PHONE.test(v), e.phone)
      .transform((v) => (v === "" ? null : v)),
    subject: z
      .string()
      .trim()
      .max(200, e.max(200))
      .transform((v) => (v === "" ? null : v)),
    body: z.string().trim().min(5, e.body).max(4000, e.max(4000)),
  });
}

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Form fields as strings, minus the routing-only `lang` and honeypot fields. */
export function formObject(formData: FormData) {
  const out: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string" && key !== "lang" && key !== "website") out[key] = value;
  });
  return out;
}
