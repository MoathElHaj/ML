import "server-only";
import nodemailer from "nodemailer";
import { createServiceClient } from "./supabase/service";
import { getEmailSettings, type EmailSettings } from "./settings";
import { site } from "./site";
import { formatDay, formatTime } from "./utils";
import type { Consultation, Message } from "./types";

type Lang = "ar" | "en";

export type MailKind = "booking_admin" | "booking_client" | "booking_confirmed" | "reminder" | "message_admin" | "test";

type Mail = {
  to: string;
  subject: string;
  html: string;
  text: string;
  kind: MailKind;
  relatedId?: string;
  /** Lets the team answer the client straight from their inbox. */
  replyTo?: string | null;
  attachments?: { filename: string; content: string; contentType: string }[];
};

export function isEmailReady(s: EmailSettings) {
  return Boolean(s.enabled && s.host && s.port && s.from_email);
}

async function log(mail: Mail, status: "sent" | "failed" | "skipped", error?: string) {
  const db = createServiceClient();
  if (!db) return;
  await db.from("email_log").insert({
    kind: mail.kind,
    to_email: mail.to,
    subject: mail.subject,
    status,
    error: error?.slice(0, 1000) ?? null,
    related_id: mail.relatedId ?? null,
  });
}

/** Sends one email with the dashboard's SMTP settings and records the outcome. Never throws. */
export async function sendMail(mail: Mail, settings?: EmailSettings): Promise<{ ok: boolean; error?: string }> {
  const s = settings ?? (await getEmailSettings());
  if (!isEmailReady(s)) {
    await log(mail, "skipped", "Email sending is off or not configured");
    return { ok: false, error: "not_configured" };
  }
  try {
    const transport = nodemailer.createTransport({
      host: s.host,
      port: Number(s.port),
      secure: Boolean(s.secure),
      auth: s.user ? { user: s.user, pass: s.password } : undefined,
      connectionTimeout: 15000,
    });
    await transport.sendMail({
      from: { name: s.from_name || "Bariq", address: s.from_email },
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: mail.replyTo || undefined,
      attachments: mail.attachments,
    });
    await log(mail, "sent");
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error("sendMail", mail.kind, error);
    await log(mail, "failed", error);
    return { ok: false, error };
  }
}

// ---------------------------------------------------------------------------
// Calendar invite
// ---------------------------------------------------------------------------
/** Converts a wall-clock time in an IANA zone to a UTC Date. */
export function zonedToUtc(day: string, time: string, timeZone: string) {
  const [y, m, d] = day.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(new Date(guess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
  return new Date(guess - (asIfUtc - guess));
}

const icsDate = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
const icsText = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function consultationIcs(c: Consultation, durationMinutes: number, timeZone: string) {
  const start = zonedToUtc(c.scheduled_date, c.scheduled_time.slice(0, 5), timeZone);
  const end = new Date(start.getTime() + durationMinutes * 60000);
  const title = c.lang === "en" ? "Free consultation with Bariq" : "استشارة مجانية مع بريق";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bariq//Consultations//AR",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${c.id}@bariq`,
    `DTSTAMP:${icsDate(new Date())}`,
    `DTSTART:${icsDate(start)}`,
    `DTEND:${icsDate(end)}`,
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(`${site.fullNameEn}\n${site.url}`)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT30M",
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsText(title)}`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

// ---------------------------------------------------------------------------
// Templates
// ---------------------------------------------------------------------------
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(lang: Lang, heading: string, bodyHtml: string, cta?: { label: string; url: string }) {
  const dir = lang === "ar" ? "rtl" : "ltr";
  const align = lang === "ar" ? "right" : "left";
  return `<!doctype html><html lang="${lang}" dir="${dir}"><body style="margin:0;background:#f5f0fe;font-family:Tahoma,Arial,sans-serif;color:#230b4b">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0fe;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:20px;overflow:hidden;border:1px solid #e4daf5">
<tr><td style="background:#230b4b;padding:22px 28px;text-align:${align}"><span style="color:#ffffff;font-size:20px;font-weight:bold">بريق · Bariq</span><br><span style="color:#cda9ff;font-size:13px">${esc(site.fullName)} · ${esc(site.fullNameEn)}</span></td></tr>
<tr><td style="padding:28px;text-align:${align};direction:${dir}">
<h1 style="margin:0 0 16px;font-size:20px;line-height:1.5;color:#230b4b">${esc(heading)}</h1>
${bodyHtml}
${cta ? `<p style="margin:24px 0 0"><a href="${esc(cta.url)}" style="display:inline-block;background:#612aae;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold">${esc(cta.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:18px 28px;background:#f5f0fe;color:#5b4d73;font-size:12px;text-align:${align};direction:${dir}">${esc(site.url)}${site.whatsapp ? ` · WhatsApp +${site.whatsapp}` : ""}</td></tr>
</table></td></tr></table></body></html>`;
}

function rows(items: [string, string | null | undefined][], lang: Lang) {
  const align = lang === "ar" ? "right" : "left";
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">${items
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:8px 0;color:#5b4d73;width:38%;vertical-align:top;text-align:${align}">${esc(k)}</td><td style="padding:8px 0;font-weight:bold;text-align:${align};white-space:pre-line">${esc(String(v))}</td></tr>`,
    )
    .join("")}</table>`;
}

const plain = (items: [string, string | null | undefined][]) =>
  items
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

const channelLabel = (c: Consultation["channel"], lang: Lang) =>
  ({ online: { ar: "اجتماع أونلاين", en: "Online meeting" }, phone: { ar: "مكالمة هاتفية", en: "Phone call" }, office: { ar: "زيارة لمقرنا", en: "Office visit" } })[c][lang];

/** To the team: a new booking arrived. Always Arabic (the team's language). */
export function bookingAdminMail(c: Consultation, serviceTitle: string | null, to: string): Mail {
  const when = `${formatDay(c.scheduled_date, "ar")} — ${formatTime(c.scheduled_time, "ar")}`;
  const items: [string, string | null | undefined][] = [
    ["الموعد", when],
    ["الاسم", c.full_name],
    ["الهاتف", c.phone],
    ["البريد", c.email],
    ["الشركة", c.company],
    ["الخدمة", serviceTitle],
    ["طريقة الاجتماع", channelLabel(c.channel, "ar")],
    ["الحالة", c.status === "confirmed" ? "مؤكد تلقائياً" : "بانتظار التأكيد"],
    ["الرسالة", c.message],
  ];
  return {
    replyTo: c.email,
    kind: "booking_admin",
    to,
    relatedId: c.id,
    subject: `حجز استشارة جديد: ${c.full_name} — ${when}`,
    html: layout("ar", "حجز استشارة جديد", rows(items, "ar"), { label: "فتح جدول الاستشارات", url: `${site.url}/dashboard/consultations` }),
    text: `حجز استشارة جديد\n\n${plain(items)}\n\n${site.url}/dashboard/consultations`,
  };
}

/** To the client: we received (or confirmed) the booking, with a calendar invite. */
export function bookingClientMail(c: Consultation, confirmed: boolean, durationMinutes: number, timeZone: string): Mail {
  const lang: Lang = c.lang === "en" ? "en" : "ar";
  const when = `${formatDay(c.scheduled_date, lang)} — ${formatTime(c.scheduled_time, lang)}`;
  const t =
    lang === "ar"
      ? {
          subject: confirmed ? `تم تأكيد استشارتك مع بريق — ${when}` : `استلمنا طلب استشارتك — ${when}`,
          heading: confirmed ? `أهلاً ${c.full_name}، موعدك مؤكد` : `أهلاً ${c.full_name}، استلمنا طلبك`,
          intro: confirmed
            ? "يسعدنا تأكيد موعد استشارتك المجانية. أضفنا لك ملف تقويم لإضافة الموعد إلى جدولك."
            : "شكراً لاختيارك بريق. سيتواصل معك أحد خبرائنا لتأكيد الموعد قريباً.",
          when: "الموعد",
          channel: "طريقة الاجتماع",
          duration: "المدة",
          minutes: `${durationMinutes} دقيقة`,
          cta: "تواصل معنا عبر واتساب",
        }
      : {
          subject: confirmed ? `Your Bariq consultation is confirmed — ${when}` : `We received your consultation request — ${when}`,
          heading: confirmed ? `Hi ${c.full_name}, your session is confirmed` : `Hi ${c.full_name}, we got your request`,
          intro: confirmed
            ? "Your free consultation is confirmed. We've attached a calendar invite so you can add it to your schedule."
            : "Thanks for choosing Bariq. One of our experts will contact you shortly to confirm the time.",
          when: "When",
          channel: "Meeting type",
          duration: "Duration",
          minutes: `${durationMinutes} minutes`,
          cta: "Chat with us on WhatsApp",
        };
  const items: [string, string][] = [
    [t.when, when],
    [t.channel, channelLabel(c.channel, lang)],
    [t.duration, t.minutes],
  ];
  const wa = site.whatsapp ? `https://wa.me/${site.whatsapp}` : site.url;
  return {
    kind: confirmed ? "booking_confirmed" : "booking_client",
    to: c.email!,
    relatedId: c.id,
    subject: t.subject,
    html: layout(lang, t.heading, `<p style="margin:0 0 18px;line-height:1.8;font-size:15px">${esc(t.intro)}</p>${rows(items, lang)}`, { label: t.cta, url: wa }),
    text: `${t.heading}\n\n${t.intro}\n\n${plain(items)}`,
    attachments: confirmed ? [{ filename: "bariq-consultation.ics", content: consultationIcs(c, durationMinutes, timeZone), contentType: "text/calendar; charset=utf-8; method=PUBLISH" }] : undefined,
  };
}

/** To the client, the day before. */
export function reminderMail(c: Consultation, durationMinutes: number, timeZone: string): Mail {
  const lang: Lang = c.lang === "en" ? "en" : "ar";
  const when = `${formatDay(c.scheduled_date, lang)} — ${formatTime(c.scheduled_time, lang)}`;
  const heading = lang === "ar" ? `تذكير: استشارتك مع بريق غداً` : `Reminder: your Bariq consultation is tomorrow`;
  const intro =
    lang === "ar" ? `أهلاً ${c.full_name}، نذكّرك بموعد استشارتك المجانية. نتطلع للحديث معك!` : `Hi ${c.full_name}, a quick reminder about your free consultation. We look forward to talking with you!`;
  const items: [string, string][] = [[lang === "ar" ? "الموعد" : "When", when]];
  return {
    kind: "reminder",
    to: c.email!,
    relatedId: c.id,
    subject: `${heading} — ${when}`,
    html: layout(lang, heading, `<p style="margin:0 0 18px;line-height:1.8;font-size:15px">${esc(intro)}</p>${rows(items, lang)}`),
    text: `${heading}\n\n${intro}\n\n${plain(items)}`,
    attachments: [{ filename: "bariq-consultation.ics", content: consultationIcs(c, durationMinutes, timeZone), contentType: "text/calendar; charset=utf-8; method=PUBLISH" }],
  };
}

/** To the team: a new contact-form message. */
export function messageAdminMail(m: Message, to: string): Mail {
  const items: [string, string | null | undefined][] = [
    ["الاسم", m.full_name],
    ["الهاتف", m.phone],
    ["البريد", m.email],
    ["الموضوع", m.subject],
    ["الرسالة", m.body],
  ];
  return {
    replyTo: m.email,
    kind: "message_admin",
    to,
    relatedId: m.id,
    subject: `رسالة جديدة من الموقع: ${m.subject || m.full_name}`,
    html: layout("ar", "رسالة جديدة من نموذج «تواصل معنا»", rows(items, "ar"), { label: "فتح الرسائل", url: `${site.url}/dashboard/messages` }),
    text: `رسالة جديدة\n\n${plain(items)}`,
  };
}

export function testMail(to: string): Mail {
  return {
    kind: "test",
    to,
    subject: "رسالة تجريبية من لوحة تحكم بريق",
    html: layout("ar", "إعدادات البريد تعمل ✓", `<p style="margin:0;line-height:1.8">وصلتك هذه الرسالة من لوحة تحكم بريق، أي أن إعدادات SMTP صحيحة.</p>`),
    text: "إعدادات البريد تعمل. وصلتك هذه الرسالة من لوحة تحكم بريق.",
  };
}

// ---------------------------------------------------------------------------
// High-level notifications (called from actions; never throw)
// ---------------------------------------------------------------------------
export async function notifyNewBooking(c: Consultation, serviceTitle: string | null, durationMinutes: number, timeZone: string) {
  const s = await getEmailSettings();
  if (!isEmailReady(s)) return;
  const jobs: Promise<unknown>[] = [];
  if (s.notify_bookings) for (const to of s.notify_to) jobs.push(sendMail(bookingAdminMail(c, serviceTitle, to), s));
  if (s.client_confirmations && c.email) jobs.push(sendMail(bookingClientMail(c, c.status === "confirmed", durationMinutes, timeZone), s));
  await Promise.all(jobs);
  if (c.status === "confirmed" && c.email && s.client_confirmations) {
    await createServiceClient()?.from("consultations").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", c.id);
  }
}

export async function notifyConfirmed(c: Consultation, durationMinutes: number, timeZone: string) {
  const s = await getEmailSettings();
  if (!isEmailReady(s) || !s.client_confirmations || !c.email) return { ok: false };
  const res = await sendMail(bookingClientMail(c, true, durationMinutes, timeZone), s);
  if (res.ok) await createServiceClient()?.from("consultations").update({ confirmation_sent_at: new Date().toISOString() }).eq("id", c.id);
  return res;
}

export async function notifyNewMessage(m: Message) {
  const s = await getEmailSettings();
  if (!isEmailReady(s) || !s.notify_messages) return;
  await Promise.all(s.notify_to.map((to) => sendMail(messageAdminMail(m, to), s)));
}
