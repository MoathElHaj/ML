import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, Mail, Radar, Trash2 } from "lucide-react";
import { getAdmin } from "@/lib/supabase/server";
import { removeBlockedDate } from "@/actions/settings";
import { DEFAULT_BOOKING, DEFAULT_EMAIL, DEFAULT_TRACKING, type BookingSettings, type EmailSettings, type TrackingSettings } from "@/lib/settings";
import { isServiceConfigured } from "@/lib/supabase/service";
import { cn, formatDate, formatDay } from "@/lib/utils";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { BlockedDateForm, BookingSettingsForm, EmailSettingsForm, TestEmailForm, TrackingSettingsForm } from "@/components/dashboard/settings";
import { EmptyRow, Panel } from "@/components/dashboard/ui";

export const metadata = { title: "الإعدادات" };

const tabs = [
  { key: "booking", label: "المواعيد", Icon: CalendarClock },
  { key: "email", label: "البريد الإلكتروني", Icon: Mail },
  { key: "tracking", label: "التتبع والتحليلات", Icon: Radar },
] as const;

const kindLabel: Record<string, string> = {
  booking_admin: "إشعار حجز للفريق",
  booking_client: "استلام طلب للعميل",
  booking_confirmed: "تأكيد موعد للعميل",
  reminder: "تذكير بالموعد",
  message_admin: "إشعار رسالة للفريق",
  test: "رسالة تجريبية",
};

const statusStyle = {
  sent: "border-emerald-200 bg-emerald-50 text-emerald-900",
  failed: "border-red-200 bg-red-50 text-red-900",
  skipped: "border-zinc-200 bg-zinc-100 text-zinc-700",
} as const;

export default async function SettingsPage(props: PageProps<"/dashboard/settings">) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const { tab: raw } = await props.searchParams;
  const tab = tabs.some((t) => t.key === raw) ? (raw as (typeof tabs)[number]["key"]) : "booking";
  const db = admin.supabase;

  const [{ data: rows }, { data: emailRow }, { data: blocked }, { data: log }] = await Promise.all([
    db.from("site_settings").select("key, value"),
    db.from("private_settings").select("value").eq("key", "email").maybeSingle(),
    db.from("blocked_dates").select("day, reason").gte("day", new Date().toISOString().slice(0, 10)).order("day"),
    tab === "email" ? db.from("email_log").select("*").order("created_at", { ascending: false }).limit(25) : Promise.resolve({ data: null }),
  ]);
  const get = <T,>(key: string, fallback: T): T => ({ ...fallback, ...((rows?.find((r) => r.key === key)?.value as Partial<T>) ?? {}) });
  const booking = get<BookingSettings>("booking", DEFAULT_BOOKING);
  const tracking = get<TrackingSettings>("tracking", DEFAULT_TRACKING);
  const email: EmailSettings = { ...DEFAULT_EMAIL, ...((emailRow?.value as Partial<EmailSettings>) ?? {}) };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-night">الإعدادات</h1>
        <p className="mt-1 text-muted">كل ما تغيّره هنا ينعكس على الموقع مباشرة.</p>
      </div>

      <nav aria-label="أقسام الإعدادات" className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map(({ key, label, Icon }) => (
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
            {label}
          </Link>
        ))}
      </nav>

      {!isServiceConfigured && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          لإرسال البريد والتذكيرات تلقائياً أضف <code dir="ltr">SUPABASE_SERVICE_ROLE_KEY</code> إلى إعدادات الخادم.
        </p>
      )}

      {tab === "booking" && (
        <div className="space-y-6">
          <BookingSettingsForm value={booking} />
          <Panel title="أيام الإجازة" className="p-0">
            <div className="space-y-5 p-5">
              <p className="text-sm text-muted">لا تظهر هذه الأيام في صفحة الحجز.</p>
              <BlockedDateForm />
              {blocked?.length ? (
                <ul className="divide-y divide-line rounded-2xl border border-line">
                  {blocked.map((b) => (
                    <li key={b.day} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="font-semibold text-night">{formatDay(b.day)}</p>
                        {b.reason && <p className="text-sm text-muted">{b.reason}</p>}
                      </div>
                      <form action={removeBlockedDate}>
                        <input type="hidden" name="day" value={b.day} />
                        <ConfirmButton className="btn btn-danger btn-sm" message="حذف يوم الإجازة؟" aria-label={`حذف ${b.day}`}>
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
          <Panel title="تجربة الإرسال">
            <div className="p-5">
              <TestEmailForm defaultTo={email.notify_to[0] ?? admin.user.email ?? ""} />
            </div>
          </Panel>
          <Panel title="سجل البريد المرسل">
            {log?.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="text-start text-xs text-muted">
                    <tr className="border-b border-line">
                      <th className="px-5 py-3 text-start font-semibold">النوع</th>
                      <th className="px-5 py-3 text-start font-semibold">إلى</th>
                      <th className="px-5 py-3 text-start font-semibold">الحالة</th>
                      <th className="px-5 py-3 text-start font-semibold">الوقت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {log.map((l) => (
                      <tr key={l.id}>
                        <td className="px-5 py-3 text-night">{kindLabel[l.kind] ?? l.kind}</td>
                        <td className="px-5 py-3 text-muted" dir="ltr">
                          {l.to_email}
                        </td>
                        <td className="px-5 py-3">
                          <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", statusStyle[l.status as keyof typeof statusStyle])} title={l.error ?? undefined}>
                            {l.status === "sent" ? "أُرسل" : l.status === "failed" ? "فشل" : "لم يُرسل"}
                          </span>
                          {l.error && <p className="mt-1 max-w-xs truncate text-xs text-muted" title={l.error}>{l.error}</p>}
                        </td>
                        <td className="px-5 py-3 text-muted">{formatDate(l.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyRow>لم تُرسل أي رسائل بعد.</EmptyRow>
            )}
          </Panel>
        </div>
      )}

      {tab === "tracking" && <TrackingSettingsForm value={tracking} />}
    </>
  );
}
