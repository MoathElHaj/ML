import Link from "next/link";
import { CalendarClock, Mail, Plug, Radar, Trash2 } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { removeBlockedDate } from "@/actions/settings";
import { DEFAULT_BOOKING, DEFAULT_EMAIL, DEFAULT_TRACKING, type BookingSettings, type EmailSettings, type TrackingSettings } from "@/lib/settings";
import { isServiceConfigured } from "@/lib/supabase/service";
import { cn, formatDate, formatDay } from "@/lib/utils";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { BlockedDateForm, BookingSettingsForm, CrmSettingsForm, EmailSettingsForm, TestEmailForm, TrackingSettingsForm, WhatsAppSettingsForm } from "@/components/dashboard/settings";
import { getDashT } from "@/lib/dash";
import { site } from "@/lib/site";
import { DEFAULT_WHATSAPP, type WhatsAppSettings } from "@/lib/whatsapp";
import { EmptyRow, Panel } from "@/components/dashboard/ui";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("الإعدادات", "Settings") };
}

const tabs = [
  { key: "booking", ar: "المواعيد", en: "Bookings", Icon: CalendarClock },
  { key: "email", ar: "البريد الإلكتروني", en: "Email", Icon: Mail },
  { key: "tracking", ar: "التتبع والتحليلات", en: "Tracking & analytics", Icon: Radar },
  { key: "integrations", ar: "التكاملات", en: "Integrations", Icon: Plug },
] as const;

const kindLabel: Record<string, { ar: string; en: string }> = {
  booking_admin: { ar: "إشعار حجز للفريق", en: "Team booking alert" },
  booking_client: { ar: "استلام طلب للعميل", en: "Client receipt" },
  booking_confirmed: { ar: "تأكيد موعد للعميل", en: "Client confirmation" },
  reminder: { ar: "تذكير بالموعد", en: "Reminder" },
  message_admin: { ar: "إشعار رسالة للفريق", en: "Team message alert" },
  test: { ar: "رسالة تجريبية", en: "Test message" },
};

const statusStyle = {
  sent: "border-emerald-200 bg-emerald-50 text-emerald-900",
  failed: "border-red-200 bg-red-50 text-red-900",
  skipped: "border-zinc-200 bg-zinc-100 text-zinc-700",
} as const;

export default async function SettingsPage(props: PageProps<"/dashboard/settings">) {
  const admin = await requireSection("settings");
  const { tab: raw } = await props.searchParams;
  const { t, lang } = await getDashT();
  const tab = tabs.some((x) => x.key === raw) ? (raw as (typeof tabs)[number]["key"]) : "booking";
  const db = admin.supabase;

  const [{ data: rows }, { data: emailRow }, { data: waRow }, { data: blocked }, { data: log }] = await Promise.all([
    db.from("site_settings").select("key, value"),
    db.from("private_settings").select("value").eq("key", "email").maybeSingle(),
    db.from("private_settings").select("value").eq("key", "whatsapp").maybeSingle(),
    db.from("blocked_dates").select("day, reason").gte("day", new Date().toISOString().slice(0, 10)).order("day"),
    tab === "email" ? db.from("email_log").select("*").order("created_at", { ascending: false }).limit(25) : Promise.resolve({ data: null }),
  ]);
  const get = <T,>(key: string, fallback: T): T => ({ ...fallback, ...((rows?.find((r) => r.key === key)?.value as Partial<T>) ?? {}) });
  const booking = get<BookingSettings>("booking", DEFAULT_BOOKING);
  const tracking = get<TrackingSettings>("tracking", DEFAULT_TRACKING);
  const email: EmailSettings = { ...DEFAULT_EMAIL, ...((emailRow?.value as Partial<EmailSettings>) ?? {}) };
  const wa: WhatsAppSettings = { ...DEFAULT_WHATSAPP, ...((waRow?.value as Partial<WhatsAppSettings>) ?? {}) };
  const crm = get<{ auto_followup: boolean }>("crm", { auto_followup: true });

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-night">{t("الإعدادات", "Settings")}</h1>
        <p className="mt-1 text-muted">{t("كل ما تغيّره هنا ينعكس على الموقع مباشرة.", "Everything you change here applies to the website right away.")}</p>
      </div>

      <nav aria-label={t("أقسام الإعدادات", "Settings sections")} className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map(({ key, ar, en, Icon }) => (
          <Link
            key={key}
            href={`/dashboard/settings?tab=${key}`}
            aria-current={tab === key ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-2 whitespace-nowrap rounded-full border-[1.5px] px-4 py-2 text-sm font-semibold transition-colors",
              tab === key ? "border-night bg-night text-white" : "border-line bg-white text-night hover:border-violet",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {lang === "en" ? en : ar}
          </Link>
        ))}
      </nav>

      {!isServiceConfigured && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          {t("لإرسال البريد والتذكيرات وإدارة المستخدمين أضف", "To send email and reminders and manage users, add")} <code dir="ltr">SUPABASE_SERVICE_ROLE_KEY</code> {t("إلى إعدادات الخادم.", "to the server settings.")}
        </p>
      )}

      {tab === "booking" && (
        <div className="space-y-6">
          <BookingSettingsForm value={booking} />
          <Panel title={t("أيام الإجازة", "Days off")} className="p-0">
            <div className="space-y-5 p-5">
              <p className="text-sm text-muted">{t("لا تظهر هذه الأيام في صفحة الحجز.", "These days are hidden on the booking page.")}</p>
              <BlockedDateForm />
              {blocked?.length ? (
                <ul className="divide-y divide-line rounded-2xl border border-line">
                  {blocked.map((b) => (
                    <li key={b.day} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-semibold text-night">{formatDay(b.day, lang)}</p>
                        {b.reason && <p className="text-sm text-muted">{b.reason}</p>}
                      </div>
                      <form action={removeBlockedDate}>
                        <input type="hidden" name="day" value={b.day} />
                        <ConfirmButton className="btn btn-danger btn-sm" message={t("حذف يوم الإجازة؟", "Remove this day off?")} aria-label={t(`حذف ${b.day}`, `Remove ${b.day}`)}>
                          <Trash2 className="size-4" aria-hidden />
                        </ConfirmButton>
                      </form>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Panel>
        </div>
      )}

      {tab === "email" && (
        <div className="space-y-6">
          <EmailSettingsForm
            value={{
              enabled: email.enabled,
              host: email.host,
              port: email.port,
              secure: email.secure,
              user: email.user,
              has_password: Boolean(email.password),
              from_name: email.from_name,
              from_email: email.from_email,
              notify_to: email.notify_to,
              notify_bookings: email.notify_bookings,
              notify_messages: email.notify_messages,
              client_confirmations: email.client_confirmations,
            }}
          />
          <Panel title={t("تجربة الإرسال", "Test sending")}>
            <div className="p-5">
              <TestEmailForm defaultTo={email.notify_to[0] ?? admin.user.email ?? ""} />
            </div>
          </Panel>
          <Panel title={t("سجل البريد المرسل", "Email log")}>
            {log?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="text-start text-xs text-muted">
                    <tr className="border-b border-line">
                      <th className="px-5 py-3 text-start font-semibold">{t("النوع", "Type")}</th>
                      <th className="px-5 py-3 text-start font-semibold">{t("إلى", "To")}</th>
                      <th className="px-5 py-3 text-start font-semibold">{t("الحالة", "Status")}</th>
                      <th className="px-5 py-3 text-start font-semibold">{t("الوقت", "Time")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {log.map((l) => (
                      <tr key={l.id}>
                        <td className="px-5 py-3 text-night">{kindLabel[l.kind]?.[lang] ?? l.kind}</td>
                        <td className="px-5 py-3 text-muted" dir="ltr">
                          {l.to_email}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", statusStyle[l.status as keyof typeof statusStyle])} title={l.error ?? undefined}>
                            {l.status === "sent" ? t("أُرسل", "Sent") : l.status === "failed" ? t("فشل", "Failed") : t("لم يُرسل", "Skipped")}
                          </span>
                          {l.error && <p className="mt-1 max-w-xs truncate text-xs text-muted" title={l.error}>{l.error}</p>}
                        </td>
                        <td className="px-5 py-3 text-muted">{formatDate(l.created_at, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyRow>{t("لم تُرسل أي رسائل بعد.", "No emails sent yet.")}</EmptyRow>
            )}
          </Panel>
        </div>
      )}

      {tab === "tracking" && <TrackingSettingsForm value={tracking} />}

      {tab === "integrations" && (
        <div className="space-y-6">
          <WhatsAppSettingsForm
            value={{
              phone_number_id: wa.phone_number_id,
              business_account_id: wa.business_account_id,
              has_token: Boolean(wa.access_token),
              has_secret: Boolean(wa.app_secret),
              verify_token: wa.verify_token,
              webhook_url: `${site.url}/api/whatsapp/webhook`,
            }}
          />
          <CrmSettingsForm autoFollowup={crm.auto_followup} />
        </div>
      )}
    </>
  );
}
