"use client";

import { useActionState, useState } from "react";
import { Check, Copy, Send } from "lucide-react";
import {
  addBlockedDate,
  saveBookingSettings,
  saveCrmSettings,
  saveEmailSettings,
  saveTrackingSettings,
  saveWhatsAppSettings,
  sendTestEmail,
} from "@/actions/settings";
import type { FormState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TextField } from "@/components/forms/Field";
import { Card, ChipCheckbox, SaveBar, Toggle } from "./kit";
import { useT } from "./DashLang";

const initial: FormState = { ok: false };

const DAYS = [
  { ar: "الأحد", en: "Sun" },
  { ar: "الإثنين", en: "Mon" },
  { ar: "الثلاثاء", en: "Tue" },
  { ar: "الأربعاء", en: "Wed" },
  { ar: "الخميس", en: "Thu" },
  { ar: "الجمعة", en: "Fri" },
  { ar: "السبت", en: "Sat" },
];

function InlineStatus({ state }: { state: FormState }) {
  if (!state.message) return null;
  return (
    <p role="status" className={cn("w-full text-sm", state.ok ? "text-emerald-800" : "text-red-800")}>
      {state.message}
    </p>
  );
}

// ---------------------------------------------------------------------------
export type BookingValues = {
  working_days: number[];
  slots: string[];
  days_ahead: number;
  duration_minutes: number;
  time_zone: string;
  auto_confirm: boolean;
  reminders: boolean;
};

export function BookingSettingsForm({ value }: { value: BookingValues }) {
  const { t, lang } = useT();
  const [state, action, pending] = useActionState(saveBookingSettings, initial);
  const e = state.errors ?? {};
  const v = state.values;
  return (
    <form action={action} className="space-y-6">
      <Card title={t("أيام وأوقات العمل", "Working days & hours")} description={t("تظهر هذه الأيام والأوقات للعملاء في صفحة «احجز استشارة».", "Clients see these days and times on the “Book a consultation” page.")}>
        <fieldset>
          <legend className="field-label">{t("أيام العمل", "Working days")}</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d, i) => (
              <ChipCheckbox key={i} name="working_days" value={String(i)} label={d[lang]} defaultChecked={value.working_days.includes(i)} />
            ))}
          </div>
          {e.working_days && <p className="field-error">{e.working_days}</p>}
        </fieldset>
        <TextField
          label={t("أوقات المواعيد", "Time slots")}
          name="slots"
          dir="ltr"
          defaultValue={v?.slots ?? value.slots.join(", ")}
          error={e.slots}
          hint={t("بصيغة 24 ساعة مفصولة بفاصلة، مثل: 10:00, 11:00, 16:30", "24-hour format, comma separated, e.g. 10:00, 11:00, 16:30")}
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField label={t("مدة الجلسة (دقيقة)", "Session length (min)")} name="duration_minutes" type="number" min={10} max={240} dir="ltr" defaultValue={v?.duration_minutes ?? String(value.duration_minutes)} error={e.duration_minutes} />
          <TextField label={t("الحجز متاح لمدة (يوم)", "Bookable days ahead")} name="days_ahead" type="number" min={1} max={120} dir="ltr" defaultValue={v?.days_ahead ?? String(value.days_ahead)} error={e.days_ahead} />
          <TextField label={t("المنطقة الزمنية", "Time zone")} name="time_zone" dir="ltr" defaultValue={v?.time_zone ?? value.time_zone} error={e.time_zone} hint={t("مثل Asia/Muscat", "e.g. Asia/Muscat")} />
        </div>
      </Card>
      <Card title={t("الأتمتة", "Automation")}>
        <Toggle
          name="auto_confirm"
          label={t("تأكيد الحجوزات تلقائياً", "Auto-confirm bookings")}
          hint={t("يُؤكَّد الموعد فور حجزه ويصل العميل بريد التأكيد مع ملف التقويم. عند الإيقاف تؤكده أنت من جدول الاستشارات.", "Bookings are confirmed instantly and the client gets the confirmation email with a calendar file. When off, you confirm them from the schedule.")}
          defaultChecked={v ? v.auto_confirm === "on" : value.auto_confirm}
        />
        <Toggle
          name="reminders"
          label={t("تذكير العميل قبل الموعد بيوم", "Remind the client a day before")}
          hint={t("يُرسل بريد تذكير تلقائي يومياً للمواعيد المؤكدة في اليوم التالي (يتطلب إعداد البريد).", "A reminder email goes out daily for the next day's confirmed bookings (needs email set up).")}
          defaultChecked={v ? v.reminders === "on" : value.reminders}
        />
      </Card>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}

export function BlockedDateForm() {
  const { t } = useT();
  const [state, action, pending] = useActionState(addBlockedDate, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="blocked-day" className="field-label">
          {t("التاريخ", "Date")}
        </label>
        <input id="blocked-day" type="date" name="day" required dir="ltr" className="field !w-auto" />
      </div>
      <div className="min-w-48 flex-1">
        <label htmlFor="blocked-reason" className="field-label">
          {t("السبب (اختياري)", "Reason (optional)")}
        </label>
        <input id="blocked-reason" name="reason" maxLength={120} className="field" placeholder={t("مثل: إجازة العيد", "e.g. Eid holiday")} />
      </div>
      <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
        {t("إضافة يوم إجازة", "Add day off")}
      </button>
      <InlineStatus state={state} />
    </form>
  );
}

// ---------------------------------------------------------------------------
export type EmailValues = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  has_password: boolean;
  from_name: string;
  from_email: string;
  notify_to: string[];
  notify_bookings: boolean;
  notify_messages: boolean;
  client_confirmations: boolean;
};

export function EmailSettingsForm({ value }: { value: EmailValues }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(saveEmailSettings, initial);
  const e = state.errors ?? {};
  const v = state.values;
  return (
    <form action={action} className="space-y-6" autoComplete="off">
      <Card title={t("من يستلم الإشعارات؟", "Who gets notified?")}>
        <TextField
          label={t("بريد فريق بريق", "Team email")}
          name="notify_to"
          dir="ltr"
          defaultValue={v?.notify_to ?? value.notify_to.join(", ")}
          error={e.notify_to}
          hint={t("يصل إليه إشعار بكل حجز ورسالة جديدة. يمكنك إدخال أكثر من بريد مفصول بفاصلة.", "Gets a notification for every new booking and message. Separate several emails with commas.")}
        />
        <div className="grid gap-3 lg:grid-cols-3">
          <Toggle name="notify_bookings" label={t("إشعار بالحجوزات الجديدة", "New booking alerts")} defaultChecked={v ? v.notify_bookings === "on" : value.notify_bookings} />
          <Toggle name="notify_messages" label={t("إشعار برسائل «تواصل معنا»", "Contact form alerts")} defaultChecked={v ? v.notify_messages === "on" : value.notify_messages} />
          <Toggle
            name="client_confirmations"
            label={t("رسائل للعميل", "Client emails")}
            hint={t("استلام الطلب، التأكيد مع ملف التقويم، والتذكير", "Receipt, confirmation with calendar file, and reminder")}
            defaultChecked={v ? v.client_confirmations === "on" : value.client_confirmations}
          />
        </div>
      </Card>

      <Card
        title={t("خادم الإرسال (SMTP)", "Outgoing server (SMTP)")}
        description={t(
          "بيانات بريد الإرسال من مزوّد بريدك: Google Workspace أو Zoho أو Outlook أو بريد الاستضافة. في Gmail استخدم «كلمة مرور التطبيقات» وليس كلمة المرور العادية.",
          "Sending details from your email provider: Google Workspace, Zoho, Outlook or your host. With Gmail use an App Password, not your normal password.",
        )}
      >
        <Toggle name="enabled" label={t("تفعيل إرسال البريد", "Enable email sending")} defaultChecked={v ? v.enabled === "on" : value.enabled} />
        <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
          <TextField label={t("الخادم (Host)", "Host")} name="host" dir="ltr" defaultValue={v?.host ?? value.host} error={e.host} placeholder="smtp.gmail.com" />
          <TextField label={t("المنفذ (Port)", "Port")} name="port" type="number" dir="ltr" defaultValue={v?.port ?? String(value.port)} error={e.port} hint={t("587 أو 465", "587 or 465")} />
        </div>
        <Toggle name="secure" label={t("اتصال آمن مباشر (SSL)", "Direct secure connection (SSL)")} hint={t("فعّله مع المنفذ 465، وأوقفه مع 587.", "On for port 465, off for 587.")} defaultChecked={v ? v.secure === "on" : value.secure} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label={t("اسم المستخدم", "Username")} name="user" dir="ltr" autoComplete="off" defaultValue={v?.user ?? value.user} error={e.user} placeholder="you@bariq.om" />
          <TextField
            label={t("كلمة المرور", "Password")}
            name="password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            error={e.password}
            placeholder={value.has_password ? t("••••••••  (محفوظة — اتركها فارغة للإبقاء عليها)", "••••••••  (saved — leave empty to keep it)") : ""}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label={t("اسم المرسل", "Sender name")} name="from_name" defaultValue={v?.from_name ?? value.from_name} error={e.from_name} />
          <TextField label={t("بريد المرسل", "Sender email")} name="from_email" dir="ltr" defaultValue={v?.from_email ?? value.from_email} error={e.from_email} placeholder="hello@bariq.om" />
        </div>
      </Card>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}

export function TestEmailForm({ defaultTo }: { defaultTo: string }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(sendTestEmail, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1">
        <label htmlFor="test-to" className="field-label">
          {t("إرسال رسالة تجريبية إلى", "Send a test message to")}
        </label>
        <input id="test-to" name="to" type="email" dir="ltr" defaultValue={defaultTo} className="field" />
      </div>
      <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
        <Send className="size-4 rtl:-scale-x-100" aria-hidden />
        {pending ? t("جارٍ الإرسال…", "Sending…") : t("إرسال تجربة", "Send test")}
      </button>
      <InlineStatus state={state} />
    </form>
  );
}

// ---------------------------------------------------------------------------
export type TrackingValues = { gtm_id: string; ga4_id: string; google_ads_id: string; google_ads_lead_label: string; meta_pixel_id: string };

export function TrackingSettingsForm({ value }: { value: TrackingValues }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(saveTrackingSettings, initial);
  const e = state.errors ?? {};
  const v = state.values;
  return (
    <form action={action} className="space-y-6">
      <Card
        title="Google"
        description={t(
          "إن استخدمت Google Tag Manager فأضف GA4 وGoogle Ads من داخل GTM واترك حقليهما هنا فارغين لتجنب تكرار القياس.",
          "If you use Google Tag Manager, add GA4 and Google Ads inside GTM and leave those two fields empty here to avoid double counting.",
        )}
      >
        <TextField label={t("Google Tag Manager — معرّف الحاوية", "Google Tag Manager — container ID")} name="gtm_id" dir="ltr" defaultValue={v?.gtm_id ?? value.gtm_id} error={e.gtm_id} placeholder="GTM-XXXXXXX" />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label={t("Google Analytics 4 — معرّف القياس", "Google Analytics 4 — measurement ID")} name="ga4_id" dir="ltr" defaultValue={v?.ga4_id ?? value.ga4_id} error={e.ga4_id} placeholder="G-XXXXXXXXXX" />
          <TextField label={t("Google Ads — معرّف الحساب", "Google Ads — account ID")} name="google_ads_id" dir="ltr" defaultValue={v?.google_ads_id ?? value.google_ads_id} error={e.google_ads_id} placeholder="AW-XXXXXXXXX" />
        </div>
        <TextField
          label={t("Google Ads — تسمية تحويل «عميل محتمل»", "Google Ads — lead conversion label")}
          name="google_ads_lead_label"
          dir="ltr"
          defaultValue={v?.google_ads_lead_label ?? value.google_ads_lead_label}
          error={e.google_ads_lead_label}
          hint={t("من Google Ads ← الأهداف ← التحويلات. يُسجَّل التحويل تلقائياً عند كل حجز أو رسالة ناجحة.", "From Google Ads → Goals → Conversions. Recorded automatically on every successful booking or message.")}
        />
      </Card>
      <Card title={t("Meta (فيسبوك وإنستغرام)", "Meta (Facebook & Instagram)")}>
        <TextField
          label={t("Meta Pixel — المعرّف", "Meta Pixel — ID")}
          name="meta_pixel_id"
          dir="ltr"
          defaultValue={v?.meta_pixel_id ?? value.meta_pixel_id}
          error={e.meta_pixel_id}
          hint={t("من Events Manager. يُسجَّل حدث Lead عند كل حجز أو رسالة، لتحسين حملاتك الإعلانية.", "From Events Manager. A Lead event fires on every booking or message to optimise your ads.")}
        />
      </Card>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}

// ---------------------------------------------------------------------------
export type WhatsAppValues = {
  phone_number_id: string;
  business_account_id: string;
  has_token: boolean;
  has_secret: boolean;
  verify_token: string;
  webhook_url: string;
};

function CopyField({ label, value }: { label: string; value: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="flex gap-2">
        <code dir="ltr" className="field flex min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap bg-[#f8f6fc] text-sm">
          {value}
        </code>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(value).then(() => (setCopied(true), setTimeout(() => setCopied(false), 1500)))}
          className="btn btn-outline btn-sm shrink-0"
        >
          {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? t("تم النسخ", "Copied") : t("نسخ", "Copy")}
        </button>
      </div>
    </div>
  );
}

export function WhatsAppSettingsForm({ value }: { value: WhatsAppValues }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(saveWhatsAppSettings, initial);
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-6" autoComplete="off">
      <Card
        title={t("WhatsApp Cloud API", "WhatsApp Cloud API")}
        description={t(
          "عند الربط، كل رسالة تصل إلى رقم واتساب الشركة — ومنها رسائل إعلانات «انقر للمراسلة» — تُضاف تلقائياً إلى «العملاء» مع اسم الإعلان، ويمكنك الرد من لوحة التحكم.",
          "Once connected, every message to the business WhatsApp number — including click-to-WhatsApp ads — becomes a client with the ad that started it, and you can reply from the dashboard.",
        )}
      >
        <ol className="list-decimal space-y-1 ps-5 text-sm leading-7 text-muted">
          <li>{t("في developers.facebook.com افتح تطبيقك وأضف منتج WhatsApp، واربط رقم الشركة.", "In developers.facebook.com open your app, add the WhatsApp product and connect the business number.")}</li>
          <li>{t("انسخ Phone number ID و WhatsApp Business Account ID، وأنشئ رمز وصول دائم من System User في Business Manager.", "Copy the Phone number ID and WhatsApp Business Account ID, and create a permanent access token from a System User in Business Manager.")}</li>
          <li>{t("في إعداد Webhook ضع الرابط ورمز التحقق أدناه، واشترك في حقل messages.", "In the Webhook setup paste the URL and verify token below, and subscribe to the messages field.")}</li>
        </ol>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Phone number ID" name="phone_number_id" dir="ltr" defaultValue={value.phone_number_id} />
          <TextField label="WhatsApp Business Account ID" name="business_account_id" dir="ltr" defaultValue={value.business_account_id} />
          <TextField
            label={t("رمز الوصول (Access token)", "Access token")}
            name="access_token"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            placeholder={value.has_token ? t("•••••• محفوظ — اتركه فارغاً للإبقاء عليه", "•••••• saved — leave empty to keep it") : ""}
          />
          <TextField
            label={t("App secret (للتحقق من التوقيع)", "App secret (signature check)")}
            name="app_secret"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            placeholder={value.has_secret ? t("•••••• محفوظ", "•••••• saved") : t("يُستخدم META_APP_SECRET إن تُرك فارغاً", "Falls back to META_APP_SECRET")}
          />
        </div>
        <CopyField label={t("رابط Webhook", "Webhook URL")} value={value.webhook_url} />
        <TextField label={t("رمز التحقق (Verify token)", "Verify token")} name="verify_token" dir="ltr" defaultValue={value.verify_token} error={e.verify_token} hint={t("انسخه كما هو إلى إعداد Webhook في Meta.", "Paste it as-is into the Meta webhook setup.")} />
      </Card>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}

export function CrmSettingsForm({ autoFollowup }: { autoFollowup: boolean }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(saveCrmSettings, initial);
  return (
    <form action={action} className="space-y-4">
      <Card title={t("أتمتة العملاء", "Client automation")}>
        <Toggle
          name="auto_followup"
          label={t("إنشاء مهمة متابعة لكل عميل جديد", "Create a follow-up task for every new client")}
          hint={t("مهمة «تواصل مع …» بأولوية مهمة في نفس اليوم، تظهر في «المهام».", "A high-priority “Contact …” task due the same day, shown in Tasks.")}
          defaultChecked={autoFollowup}
        />
      </Card>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}
