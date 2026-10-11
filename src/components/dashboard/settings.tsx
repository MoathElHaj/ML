"use client";

import { useActionState } from "react";
import { Save, Send } from "lucide-react";
import { addBlockedDate, saveBookingSettings, saveEmailSettings, saveTrackingSettings, sendTestEmail } from "@/actions/settings";
import type { FormState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FormAlert, TextField } from "@/components/forms/Field";

const initial: FormState = { ok: false };

const DAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

function Card({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[20px] border border-line bg-white p-5 sm:p-6">
      <h2 className="font-bold text-night">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-4">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-[#cfc4e3] transition-colors peer-checked:bg-violet peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-violet after:absolute after:top-0.5 after:start-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:-translate-x-5" />
      <span>
        <span className="block font-semibold text-night">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </label>
  );
}

function SaveBar({ pending, state }: { pending: boolean; state: FormState }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        <Save className="size-4" aria-hidden />
        {pending ? "جارٍ الحفظ…" : "حفظ"}
      </button>
      <FormAlert ok={state.ok} message={state.message} />
    </div>
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
  const [state, action, pending] = useActionState(saveBookingSettings, initial);
  const e = state.errors ?? {};
  const v = state.values;
  return (
    <form action={action} className="space-y-6">
      <Card title="أيام وأوقات العمل" description="تظهر هذه الأيام والأوقات للعملاء في صفحة «احجز استشارة».">
        <fieldset>
          <legend className="field-label">أيام العمل</legend>
          <div className="flex flex-wrap gap-2">
            {DAYS.map((label, i) => (
              <label key={i} className="cursor-pointer">
                <input type="checkbox" name="working_days" value={i} defaultChecked={value.working_days.includes(i)} className="peer sr-only" />
                <span className="inline-flex min-h-10 items-center rounded-full border-[1.5px] border-line px-4 text-sm font-semibold text-night transition-colors peer-checked:border-violet peer-checked:bg-violet peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-violet">
                  {label}
                </span>
              </label>
            ))}
          </div>
          {e.working_days && <p className="field-error">{e.working_days}</p>}
        </fieldset>
        <TextField
          label="أوقات المواعيد"
          name="slots"
          dir="ltr"
          defaultValue={v?.slots ?? value.slots.join(", ")}
          error={e.slots}
          hint="بصيغة 24 ساعة مفصولة بفاصلة، مثل: 10:00, 11:00, 16:30"
        />
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField label="مدة الجلسة (دقيقة)" name="duration_minutes" type="number" min={10} max={240} dir="ltr" defaultValue={v?.duration_minutes ?? String(value.duration_minutes)} error={e.duration_minutes} />
          <TextField label="الحجز متاح لمدة (يوم)" name="days_ahead" type="number" min={1} max={120} dir="ltr" defaultValue={v?.days_ahead ?? String(value.days_ahead)} error={e.days_ahead} />
          <TextField label="المنطقة الزمنية" name="time_zone" dir="ltr" defaultValue={v?.time_zone ?? value.time_zone} error={e.time_zone} hint="مثل Asia/Muscat" />
        </div>
      </Card>
      <Card title="الأتمتة">
        <Toggle name="auto_confirm" label="تأكيد الحجوزات تلقائياً" hint="يُؤكَّد الموعد فور حجزه ويصل العميل بريد التأكيد مع ملف التقويم. عند الإيقاف تؤكده أنت من جدول الاستشارات." defaultChecked={v ? v.auto_confirm === "on" : value.auto_confirm} />
        <Toggle name="reminders" label="تذكير العميل قبل الموعد بيوم" hint="يُرسل بريد تذكير تلقائي يومياً للمواعيد المؤكدة في اليوم التالي (يتطلب إعداد البريد)." defaultChecked={v ? v.reminders === "on" : value.reminders} />
      </Card>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}

export function BlockedDateForm() {
  const [state, action, pending] = useActionState(addBlockedDate, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="blocked-day" className="field-label">
          التاريخ
        </label>
        <input id="blocked-day" type="date" name="day" required dir="ltr" className="field !w-auto" />
      </div>
      <div className="min-w-48 flex-1">
        <label htmlFor="blocked-reason" className="field-label">
          السبب (اختياري)
        </label>
        <input id="blocked-reason" name="reason" maxLength={120} className="field" placeholder="مثل: إجازة العيد" />
      </div>
      <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
        إضافة يوم إجازة
      </button>
      {state.message && (
        <p role="status" className={cn("w-full text-sm", state.ok ? "text-emerald-800" : "text-red-800")}>
          {state.message}
        </p>
      )}
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
  const [state, action, pending] = useActionState(saveEmailSettings, initial);
  const e = state.errors ?? {};
  const v = state.values;
  return (
    <form action={action} className="space-y-6" autoComplete="off">
      <Card title="من يستلم الإشعارات؟">
        <TextField
          label="بريد فريق بريق"
          name="notify_to"
          dir="ltr"
          defaultValue={v?.notify_to ?? value.notify_to.join(", ")}
          error={e.notify_to}
          hint="يصل إليه إشعار بكل حجز ورسالة جديدة. يمكنك إدخال أكثر من بريد مفصول بفاصلة."
        />
        <div className="grid gap-3 lg:grid-cols-3">
          <Toggle name="notify_bookings" label="إشعار بالحجوزات الجديدة" defaultChecked={v ? v.notify_bookings === "on" : value.notify_bookings} />
          <Toggle name="notify_messages" label="إشعار برسائل «تواصل معنا»" defaultChecked={v ? v.notify_messages === "on" : value.notify_messages} />
          <Toggle name="client_confirmations" label="رسائل للعميل" hint="استلام الطلب، التأكيد مع ملف التقويم، والتذكير" defaultChecked={v ? v.client_confirmations === "on" : value.client_confirmations} />
        </div>
      </Card>

      <Card
        title="خادم الإرسال (SMTP)"
        description="بيانات بريد الإرسال من مزوّد بريدك: Google Workspace أو Zoho أو Outlook أو بريد الاستضافة. في Gmail استخدم «كلمة مرور التطبيقات» وليس كلمة المرور العادية."
      >
        <Toggle name="enabled" label="تفعيل إرسال البريد" defaultChecked={v ? v.enabled === "on" : value.enabled} />
        <div className="grid gap-5 sm:grid-cols-[1fr_120px]">
          <TextField label="الخادم (Host)" name="host" dir="ltr" defaultValue={v?.host ?? value.host} error={e.host} placeholder="smtp.gmail.com" />
          <TextField label="المنفذ (Port)" name="port" type="number" dir="ltr" defaultValue={v?.port ?? String(value.port)} error={e.port} hint="587 أو 465" />
        </div>
        <Toggle name="secure" label="اتصال آمن مباشر (SSL)" hint="فعّله مع المنفذ 465، وأوقفه مع 587." defaultChecked={v ? v.secure === "on" : value.secure} />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="اسم المستخدم" name="user" dir="ltr" autoComplete="off" defaultValue={v?.user ?? value.user} error={e.user} placeholder="you@bariq.om" />
          <TextField
            label="كلمة المرور"
            name="password"
            type="password"
            dir="ltr"
            autoComplete="new-password"
            error={e.password}
            placeholder={value.has_password ? "••••••••  (محفوظة — اتركها فارغة للإبقاء عليها)" : ""}
          />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="اسم المرسل" name="from_name" defaultValue={v?.from_name ?? value.from_name} error={e.from_name} />
          <TextField label="بريد المرسل" name="from_email" dir="ltr" defaultValue={v?.from_email ?? value.from_email} error={e.from_email} placeholder="hello@bariq.om" />
        </div>
      </Card>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}

export function TestEmailForm({ defaultTo }: { defaultTo: string }) {
  const [state, action, pending] = useActionState(sendTestEmail, initial);
  return (
    <form action={action} className="flex flex-wrap items-end gap-3">
      <div className="min-w-56 flex-1">
        <label htmlFor="test-to" className="field-label">
          إرسال رسالة تجريبية إلى
        </label>
        <input id="test-to" name="to" type="email" dir="ltr" defaultValue={defaultTo} className="field" />
      </div>
      <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
        <Send className="size-4 rtl:-scale-x-100" aria-hidden />
        {pending ? "جارٍ الإرسال…" : "إرسال تجربة"}
      </button>
      {state.message && (
        <p role="status" className={cn("w-full text-sm", state.ok ? "text-emerald-800" : "text-red-800")}>
          {state.message}
        </p>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
export type TrackingValues = { gtm_id: string; ga4_id: string; google_ads_id: string; google_ads_lead_label: string; meta_pixel_id: string };

export function TrackingSettingsForm({ value }: { value: TrackingValues }) {
  const [state, action, pending] = useActionState(saveTrackingSettings, initial);
  const e = state.errors ?? {};
  const v = state.values;
  return (
    <form action={action} className="space-y-6">
      <Card
        title="Google"
        description="إن استخدمت Google Tag Manager فأضف GA4 وGoogle Ads من داخل GTM واترك حقليهما هنا فارغين لتجنب تكرار القياس."
      >
        <TextField label="Google Tag Manager — معرّف الحاوية" name="gtm_id" dir="ltr" defaultValue={v?.gtm_id ?? value.gtm_id} error={e.gtm_id} placeholder="GTM-XXXXXXX" />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Google Analytics 4 — معرّف القياس" name="ga4_id" dir="ltr" defaultValue={v?.ga4_id ?? value.ga4_id} error={e.ga4_id} placeholder="G-XXXXXXXXXX" />
          <TextField label="Google Ads — معرّف الحساب" name="google_ads_id" dir="ltr" defaultValue={v?.google_ads_id ?? value.google_ads_id} error={e.google_ads_id} placeholder="AW-XXXXXXXXX" />
        </div>
        <TextField
          label="Google Ads — تسمية تحويل «عميل محتمل»"
          name="google_ads_lead_label"
          dir="ltr"
          defaultValue={v?.google_ads_lead_label ?? value.google_ads_lead_label}
          error={e.google_ads_lead_label}
          hint="من Google Ads ← الأهداف ← التحويلات. يُسجَّل التحويل تلقائياً عند كل حجز أو رسالة ناجحة."
        />
      </Card>
      <Card title="Meta (فيسبوك وإنستغرام)">
        <TextField
          label="Meta Pixel — المعرّف"
          name="meta_pixel_id"
          dir="ltr"
          defaultValue={v?.meta_pixel_id ?? value.meta_pixel_id}
          error={e.meta_pixel_id}
          hint="من Events Manager. يُسجَّل حدث Lead عند كل حجز أو رسالة، لتحسين حملاتك الإعلانية."
        />
      </Card>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}
