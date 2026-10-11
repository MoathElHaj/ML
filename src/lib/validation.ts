import { z } from "zod";
import { booking } from "./site";
import { addDays, todayIn, weekdayOf } from "./utils";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `الحد الأقصى ${max} حرفاً`)
    .transform((v) => (v === "" ? null : v));

const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{6,20}$/, "أدخل رقم هاتف صحيحاً");

export const consultationSchema = z
  .object({
    full_name: z.string().trim().min(2, "أدخل اسمك").max(120),
    phone,
    email: z
      .string()
      .trim()
      .max(200)
      .refine((v) => v === "" || z.email().safeParse(v).success, "أدخل بريداً إلكترونياً صحيحاً")
      .transform((v) => (v === "" ? null : v)),
    company: optionalText(160),
    service_slug: optionalText(80),
    channel: z.enum(["online", "phone", "office"]),
    scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "اختر يوم الاستشارة"),
    scheduled_time: z.string().refine((v) => booking.slots.includes(v), "اختر وقت الاستشارة"),
    message: optionalText(2000),
  })
  .superRefine((v, ctx) => {
    const today = todayIn(booking.timeZone);
    if (v.scheduled_date <= today || v.scheduled_date > addDays(today, booking.daysAhead)) {
      ctx.addIssue({ code: "custom", path: ["scheduled_date"], message: "اختر يوماً من الأيام المتاحة" });
    } else if (!booking.workingDays.includes(weekdayOf(v.scheduled_date))) {
      ctx.addIssue({ code: "custom", path: ["scheduled_date"], message: "هذا اليوم خارج أيام العمل" });
    }
  });

export const messageSchema = z.object({
  full_name: z.string().trim().min(2, "أدخل اسمك").max(120),
  email: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || z.email().safeParse(v).success, "أدخل بريداً إلكترونياً صحيحاً")
    .transform((v) => (v === "" ? null : v)),
  phone: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\+?[0-9\s-]{6,20}$/.test(v), "أدخل رقم هاتف صحيحاً")
    .transform((v) => (v === "" ? null : v)),
  subject: optionalText(200),
  body: z.string().trim().min(5, "اكتب رسالتك (5 أحرف على الأقل)").max(4000),
});

export function fieldErrors(error: z.ZodError) {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function formObject(formData: FormData) {
  const out: Record<string, string> = {};
  formData.forEach((value, key) => {
    if (typeof value === "string") out[key] = value;
  });
  return out;
}
