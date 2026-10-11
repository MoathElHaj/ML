import Link from "next/link";
import { BellRing, Building2, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Clock, Download, LayoutList, Mail, MailCheck, MessageSquareText, Phone, Trash2, Video } from "lucide-react";
import { getAdmin, requireSection } from "@/lib/supabase/server";
import { deleteConsultation, resendConfirmation, saveConsultationNotes, updateConsultationStatus } from "@/actions/admin";
import { channels } from "@/lib/site";
import { getBookingSettings } from "@/lib/settings";
import { getDashT } from "@/lib/dash";
import type { DashLang, T } from "@/lib/dash-i18n";
import type { Consultation, Service } from "@/lib/types";
import { addDays, cn, dayOfMonth, formatDate, formatDay, formatShortWeekday, formatTime, todayIn } from "@/lib/utils";
import { ConfirmButton, SubmitButton } from "@/components/dashboard/ConfirmButton";
import { RescheduleForm, StatusSelect } from "@/components/dashboard/ConsultationControls";
import { EmptyRow, Panel, StatusBadge } from "@/components/dashboard/ui";
import { WhatsAppIcon } from "@/components/icons";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("الاستشارات", "Bookings") };
}

const tabs = [
  { key: "upcoming", ar: "القادمة", en: "Upcoming" },
  { key: "pending", ar: "بانتظار التأكيد", en: "To confirm" },
  { key: "past", ar: "السابقة", en: "Past" },
  { key: "all", ar: "الكل", en: "All" },
] as const;

function clientWhatsApp(c: Consultation) {
  const digits = c.phone.replace(/\D/g, "").replace(/^00/, "");
  const text =
    c.lang === "en"
      ? `Hi ${c.full_name}, this is the Bariq team. We're confirming your free consultation on ${formatDay(c.scheduled_date, "en")} at ${formatTime(c.scheduled_time, "en")}.`
      : `مرحباً ${c.full_name}، معك فريق بريق. نؤكد موعد استشارتك المجانية يوم ${formatDay(c.scheduled_date)} الساعة ${formatTime(c.scheduled_time)}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default async function ConsultationsAdmin(props: PageProps<"/dashboard/consultations">) {
  const admin = await requireSection("bookings");
  const sp = await props.searchParams;
  const tab = (typeof sp.status === "string" ? sp.status : "upcoming") as (typeof tabs)[number]["key"];
  const day = typeof sp.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.day) ? sp.day : null;
  const { t, lang } = await getDashT();
  const booking = await getBookingSettings();
  const today = todayIn(booking.time_zone);
  const view = sp.view === "calendar" ? "calendar" : "list";

  // Two-week strip with booking counts.
  const week = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  let q = admin.supabase.from("consultations").select("*");
  if (day) q = q.eq("scheduled_date", day);
  else if (tab === "upcoming") q = q.gte("scheduled_date", today).in("status", ["pending", "confirmed"]);
  else if (tab === "pending") q = q.eq("status", "pending");
  else if (tab === "past") q = q.or(`scheduled_date.lt.${today},status.in.(completed,cancelled)`);
  const ascending = tab !== "past";
  q = q.order("scheduled_date", { ascending }).order("scheduled_time", { ascending }).limit(200);

  const [{ data }, { data: counts }, { data: services }] = await Promise.all([
    q,
    admin.supabase
      .from("consultations")
      .select("scheduled_date")
      .gte("scheduled_date", week[0])
      .lte("scheduled_date", week[week.length - 1])
      .in("status", ["pending", "confirmed"]),
    admin.supabase.from("services").select("slug, title"),
  ]);

  const list = (data ?? []) as Consultation[];
  const perDay = new Map<string, number>();
  for (const r of counts ?? []) perDay.set(r.scheduled_date, (perDay.get(r.scheduled_date) ?? 0) + 1);
  const serviceTitle = new Map((services as Pick<Service, "slug" | "title">[] | null)?.map((s) => [s.slug, s.title]) ?? []);

  const groups = new Map<string, Consultation[]>();
  for (const c of list) groups.set(c.scheduled_date, [...(groups.get(c.scheduled_date) ?? []), c]);

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-night">{t("جدول الاستشارات", "Bookings")}</h1>
          <p className="mt-1 text-muted">{t("الحجوزات التي يرسلها العملاء من صفحة «احجز استشارة». أكّد الموعد وتواصل مع العميل مباشرة.", "Consultations booked on the website. Confirm them and contact the client directly.")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex rounded-full border-[1.5px] border-line bg-white p-1" role="group" aria-label={t("طريقة العرض", "View")}>
            {[
              { key: "list", label: t("قائمة", "List"), Icon: LayoutList },
              { key: "calendar", label: t("تقويم", "Calendar"), Icon: CalendarDays },
            ].map(({ key, label, Icon }) => (
              <Link
                key={key}
                href={key === "calendar" ? "/dashboard/consultations?view=calendar" : "/dashboard/consultations"}
                aria-current={view === key ? "page" : undefined}
                className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold", view === key ? "bg-night text-white" : "text-night hover:text-violet")}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
          <a href="/api/export/consultations" download className="btn btn-outline btn-sm">
            <Download className="size-4" aria-hidden />
            {t("تصدير Excel", "Export to Excel")}
          </a>
          <Link href="/dashboard/settings?tab=booking" className="btn btn-outline btn-sm">
            {t("إعدادات المواعيد", "Booking settings")}
          </Link>
        </div>
      </div>

      <Stats db={admin.supabase} today={today} t={t} />

      {view === "calendar" ? (
        <MonthCalendar db={admin.supabase} today={today} month={typeof sp.month === "string" ? sp.month : undefined} t={t} lang={lang} />
      ) : (
      <>

      <Panel className="mb-6 p-4">
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {week.map((d) => {
            const n = perDay.get(d) ?? 0;
            const active = d === day;
            return (
              <Link
                key={d}
                href={active ? "/dashboard/consultations" : `/dashboard/consultations?day=${d}`}
                aria-current={active ? "date" : undefined}
                aria-label={`${formatDay(d, lang)}: ${n} ${t("حجز", "bookings")}`}
                className={cn(
                  "flex min-w-[68px] flex-col items-center rounded-2xl border-[1.5px] px-2 py-2.5 transition-colors",
                  active ? "border-violet bg-violet text-white" : d === today ? "border-violet/40 bg-lilac-50" : "border-line hover:border-violet",
                )}
              >
                <span className={cn("text-xs", active ? "text-white/85" : "text-muted")}>{d === today ? t("اليوم", "Today") : formatShortWeekday(d, lang)}</span>
                <span className="text-lg font-bold leading-7">{dayOfMonth(d)}</span>
                <span
                  className={cn(
                    "mt-0.5 min-w-6 rounded-full px-1.5 text-center text-xs font-bold leading-5",
                    n === 0 ? (active ? "text-white/60" : "text-[#9c90b5]") : active ? "bg-white text-violet" : "bg-violet text-white",
                  )}
                >
                  {n}
                </span>
              </Link>
            );
          })}
        </div>
      </Panel>

      <nav aria-label={t("تصفية الاستشارات", "Filter bookings")} className="mb-6 flex flex-wrap gap-2">
        {day ? (
          <Link href="/dashboard/consultations" className="btn btn-outline btn-sm">
            <CalendarDays className="size-4" aria-hidden />
            {formatDay(day, lang)} · {t("عرض الكل", "Show all")} ✕
          </Link>
        ) : (
          tabs.map((x) => (
            <Link
              key={x.key}
              href={`/dashboard/consultations?status=${x.key}`}
              aria-current={tab === x.key ? "page" : undefined}
              className={cn(
                "rounded-full border-[1.5px] px-4 py-2 text-sm font-semibold transition-colors",
                tab === x.key ? "border-night bg-night text-white" : "border-line bg-white text-night hover:border-violet",
              )}
            >
              {lang === "en" ? x.en : x.ar}
            </Link>
          ))
        )}
      </nav>

      {list.length === 0 ? (
        <Panel>
          <EmptyRow>{t("لا توجد حجوزات هنا.", "No bookings here.")}</EmptyRow>
        </Panel>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([date, items]) => (
            <section key={date} aria-labelledby={`day-${date}`}>
              <h2 id={`day-${date}`} className="mb-3 flex items-center gap-2 font-bold text-night">
                <CalendarDays className="size-5 text-violet" aria-hidden />
                {formatDay(date, lang)}
                {date === today && <span className="rounded-full bg-violet px-2 py-0.5 text-xs text-white">{t("اليوم", "Today")}</span>}
                <span className="text-sm font-normal text-muted">· {items.length} {t("حجز", "bookings")}</span>
              </h2>
              <div className="space-y-3">
                {items.map((c) => (
                  <article key={c.id} className={cn("rounded-[20px] border bg-white p-5", c.status === "pending" ? "border-amber-300" : "border-line")}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      <div className="flex shrink-0 items-center gap-2 rounded-xl bg-lilac-50 px-3 py-2 text-night lg:w-28 lg:flex-col lg:py-3">
                        <Clock className="size-4 text-violet" aria-hidden />
                        <span className="font-bold">{formatTime(c.scheduled_time, lang)}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-night">{c.full_name}</h3>
                          <StatusBadge status={c.status} />
                          {c.status === "confirmed" && c.email && (
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold",
                                c.confirmation_sent_at ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-zinc-200 bg-zinc-100 text-zinc-700",
                              )}
                              title={c.confirmation_sent_at ? `${t("أُرسل", "Sent")} ${formatDate(c.confirmation_sent_at, lang)}` : undefined}
                            >
                              <MailCheck className="size-3.5" aria-hidden />
                              {c.confirmation_sent_at ? t("أُرسل التأكيد", "Confirmation sent") : t("لم يُرسل التأكيد", "Confirmation not sent")}
                            </span>
                          )}
                          {c.reminder_sent_at && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-lilac bg-lilac-50 px-2 py-0.5 text-xs font-semibold text-violet" title={formatDate(c.reminder_sent_at, lang)}>
                              <BellRing className="size-3.5" aria-hidden />
                              {t("أُرسل التذكير", "Reminder sent")}
                            </span>
                          )}
                        </div>
                        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
                          {c.company && (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="size-4" aria-hidden />
                              <dt className="sr-only">{t("الشركة", "Company")}</dt>
                              <dd>{c.company}</dd>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Video className="size-4" aria-hidden />
                            <dt className="sr-only">{t("طريقة الاجتماع", "Meeting type")}</dt>
                            <dd>{lang === "en" ? CHANNEL_EN[c.channel] : channels.find((ch) => ch.value === c.channel)?.label}</dd>
                          </div>
                          {c.service_slug && (
                            <div className="flex items-center gap-1.5">
                              <dt className="sr-only">{t("الخدمة", "Service")}</dt>
                              <dd className="rounded-full bg-lilac-50 px-2 py-0.5 font-semibold text-violet">{serviceTitle.get(c.service_slug) ?? c.service_slug}</dd>
                            </div>
                          )}
                        </dl>
                        {c.message && (
                          <p className="mt-3 flex gap-2 rounded-xl bg-[#f8f6fc] p-3 text-[15px] leading-7 text-night">
                            <MessageSquareText className="mt-1 size-4 shrink-0 text-violet" aria-hidden />
                            {c.message}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap gap-2">
                          <a href={clientWhatsApp(c)} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm">
                            <WhatsAppIcon className="size-4" />
                            {t("واتساب العميل", "WhatsApp client")}
                          </a>
                          <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="btn btn-outline btn-sm">
                            <Phone className="size-4" aria-hidden />
                            <span dir="ltr">{c.phone}</span>
                          </a>
                          {c.email && (
                            <a href={`mailto:${c.email}`} className="btn btn-outline btn-sm">
                              <Mail className="size-4" aria-hidden />
                              {t("بريد", "Email")}
                            </a>
                          )}
                        </div>

                        <details className="group mt-4 rounded-xl border border-line">
                          <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-semibold text-violet marker:hidden">
                            {t("ملاحظات وتغيير الموعد", "Notes & reschedule")} {c.admin_notes ? t("· يوجد ملاحظات", "· has notes") : ""}
                          </summary>
                          <div className="space-y-4 border-t border-line p-4">
                            <form action={saveConsultationNotes} className="space-y-2">
                              <input type="hidden" name="id" value={c.id} />
                              <label htmlFor={`n-${c.id}`} className="block text-xs font-semibold text-muted">
                                {t("ملاحظات داخلية (لا يراها العميل)", "Internal notes (hidden from the client)")}
                              </label>
                              <textarea id={`n-${c.id}`} name="admin_notes" defaultValue={c.admin_notes ?? ""} rows={3} className="field !min-h-0 text-sm" />
                              <SubmitButton className="btn btn-outline btn-sm" pendingText={t("جارٍ الحفظ…", "Saving…")}>
                                {t("حفظ الملاحظات", "Save notes")}
                              </SubmitButton>
                            </form>
                            <RescheduleForm id={c.id} date={c.scheduled_date} time={c.scheduled_time} slots={booking.slots} />
                          </div>
                        </details>
                      </div>

                      <div className="flex shrink-0 flex-row items-start gap-2 lg:flex-col lg:items-stretch">
                        {c.status === "pending" && (
                          <form action={updateConsultationStatus}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="status" value="confirmed" />
                            <SubmitButton className="btn btn-primary btn-sm w-full" pendingText="…">
                              {t("تأكيد الموعد", "Confirm booking")}
                            </SubmitButton>
                          </form>
                        )}
                        <StatusSelect id={c.id} status={c.status} name={c.full_name} />
                        {c.status === "confirmed" && c.email && (
                          <form action={resendConfirmation}>
                            <input type="hidden" name="id" value={c.id} />
                            <SubmitButton className="btn btn-outline btn-sm w-full" pendingText={t("جارٍ الإرسال…", "Sending…")}>
                              <Mail className="size-4" aria-hidden />
                              {c.confirmation_sent_at ? t("إعادة إرسال التأكيد", "Resend confirmation") : t("إرسال التأكيد", "Send confirmation")}
                            </SubmitButton>
                          </form>
                        )}
                        <form action={deleteConsultation}>
                          <input type="hidden" name="id" value={c.id} />
                          <ConfirmButton className="btn btn-danger btn-sm w-full" message={t(`حذف حجز ${c.full_name} نهائياً؟`, `Delete the booking of ${c.full_name} permanently?`)} aria-label={t(`حذف حجز ${c.full_name}`, `Delete the booking of ${c.full_name}`)}>
                            <Trash2 className="size-4" aria-hidden />
                            <span className="lg:inline">{t("حذف", "Delete")}</span>
                          </ConfirmButton>
                        </form>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
      </>
      )}
    </>
  );
}

type Db = NonNullable<Awaited<ReturnType<typeof getAdmin>>>["supabase"];

async function Stats({ db, today, t }: { db: Db; today: string; t: T }) {
  const monthStart = today.slice(0, 8) + "01";
  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);
  const base = () => db.from("consultations").select("id", { count: "exact", head: true });
  const [todayN, pending, upcoming, month] = await Promise.all([
    count(base().eq("scheduled_date", today).in("status", ["pending", "confirmed"])),
    count(base().eq("status", "pending").gte("scheduled_date", today)),
    count(base().gte("scheduled_date", today).eq("status", "confirmed")),
    count(base().gte("created_at", monthStart)),
  ]);
  const cards = [
    { label: t("مواعيد اليوم", "Today"), value: todayN, Icon: Clock, href: `/dashboard/consultations?day=${today}` },
    { label: t("بانتظار التأكيد", "To confirm"), value: pending, Icon: BellRing, href: "/dashboard/consultations?status=pending", warn: pending > 0 },
    { label: t("مؤكدة قادمة", "Confirmed upcoming"), value: upcoming, Icon: CheckCircle2, href: "/dashboard/consultations?status=upcoming" },
    { label: t("حجوزات هذا الشهر", "Booked this month"), value: month, Icon: CalendarDays, href: "/dashboard/consultations?status=all" },
  ];
  return (
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ label, value, Icon, href, warn }) => (
        <Link key={label} href={href} className={cn("rounded-[20px] border bg-white p-4 transition-colors hover:border-violet", warn ? "border-amber-300" : "border-line")}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted">{label}</span>
            <Icon className={cn("size-5", warn ? "text-amber-600" : "text-violet")} aria-hidden />
          </div>
          <p className="mt-2 text-3xl font-bold text-night">{value}</p>
        </Link>
      ))}
    </div>
  );
}

const WEEKDAYS = {
  ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};

const CHANNEL_EN: Record<string, string> = { online: "Online meeting", phone: "Phone call", office: "Office visit" };

async function MonthCalendar({ db, today, month: raw, t, lang }: { db: Db; today: string; month?: string; t: T; lang: DashLang }) {
  const month = raw && /^\d{4}-\d{2}$/.test(raw) ? raw : today.slice(0, 7);
  const [y, m] = month.split("-").map(Number);
  const first = `${month}-01`;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const last = `${month}-${String(daysInMonth).padStart(2, "0")}`;
  const lead = new Date(Date.UTC(y, m - 1, 1)).getUTCDay(); // Sunday-first grid
  const shift = (n: number) => {
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  };
  const title = new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ar", { month: "long", year: "numeric", timeZone: "UTC", numberingSystem: "latn" }).format(new Date(Date.UTC(y, m - 1, 1)));

  const [{ data }, { data: blocked }] = await Promise.all([
    db.from("consultations").select("id, full_name, scheduled_date, scheduled_time, status").gte("scheduled_date", first).lte("scheduled_date", last).neq("status", "cancelled").order("scheduled_time"),
    db.from("blocked_dates").select("day, reason").gte("day", first).lte("day", last),
  ]);
  const byDay = new Map<string, Pick<Consultation, "id" | "full_name" | "scheduled_time" | "status">[]>();
  for (const c of data ?? []) byDay.set(c.scheduled_date, [...(byDay.get(c.scheduled_date) ?? []), c]);
  const off = new Map((blocked ?? []).map((b) => [b.day, b.reason as string | null]));

  const cells: (string | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => addDays(first, i))];
  while (cells.length % 7) cells.push(null);

  return (
    <Panel className="p-0">
      <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
        <Link href={`/dashboard/consultations?view=calendar&month=${shift(-1)}`} className="btn btn-outline btn-sm" aria-label={t("الشهر السابق", "Previous month")}>
          <ChevronRight className="size-4" aria-hidden />
        </Link>
        <div className="text-center">
          <h2 className="text-lg font-bold text-night">{title}</h2>
          {month !== today.slice(0, 7) && (
            <Link href="/dashboard/consultations?view=calendar" className="text-xs font-semibold text-violet hover:underline">
              {t("العودة إلى الشهر الحالي", "Back to this month")}
            </Link>
          )}
        </div>
        <Link href={`/dashboard/consultations?view=calendar&month=${shift(1)}`} className="btn btn-outline btn-sm" aria-label={t("الشهر التالي", "Next month")}>
          <ChevronLeft className="size-4" aria-hidden />
        </Link>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-7">
          {WEEKDAYS[lang].map((w) => (
            <div key={w} className="border-b border-line px-2 py-2 text-center text-xs font-semibold text-muted">
              {w}
            </div>
          ))}
          {cells.map((d, i) => {
            if (!d) return <div key={`e${i}`} className="min-h-28 border-b border-e border-line bg-zinc-50/60" />;
            const items = byDay.get(d) ?? [];
            const reason = off.get(d);
            const isOff = off.has(d);
            return (
              <div key={d} className={cn("min-h-28 border-b border-e border-line p-1.5", isOff && "bg-zinc-50", d < today && "opacity-60")}>
                <Link
                  href={`/dashboard/consultations?day=${d}`}
                  className={cn("mb-1 inline-flex size-7 items-center justify-center rounded-full text-sm font-bold", d === today ? "bg-violet text-white" : "text-night hover:bg-lilac-50")}
                  aria-label={`${formatDay(d, lang)}: ${items.length} ${t("حجز", "bookings")}`}
                >
                  {dayOfMonth(d)}
                </Link>
                {isOff && <p className="truncate text-[11px] font-semibold text-zinc-500" title={reason ?? undefined}>{t("إجازة", "Day off")}{reason ? ` · ${reason}` : ""}</p>}
                <ul className="space-y-1">
                  {items.slice(0, 3).map((c) => (
                    <li key={c.id}>
                      <Link
                        href={`/dashboard/consultations?day=${d}`}
                        className={cn(
                          "block truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold",
                          c.status === "pending" ? "bg-amber-100 text-amber-900" : c.status === "completed" ? "bg-zinc-100 text-zinc-700" : "bg-lilac-100 text-violet",
                        )}
                        title={`${formatTime(c.scheduled_time, lang)} · ${c.full_name}`}
                      >
                        <span dir="ltr">{c.scheduled_time.slice(0, 5)}</span> {c.full_name}
                      </Link>
                    </li>
                  ))}
                  {items.length > 3 && (
                    <li>
                      <Link href={`/dashboard/consultations?day=${d}`} className="px-1.5 text-[11px] font-semibold text-violet hover:underline">
                        +{items.length - 3} {t("أخرى", "more")}
                      </Link>
                    </li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap gap-4 px-5 py-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-lilac-100" aria-hidden />{t("مؤكد", "Confirmed")}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-amber-100" aria-hidden />{t("بانتظار التأكيد", "To confirm")}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded bg-zinc-100" aria-hidden />{t("مكتمل", "Completed")}</span>
        <span className="inline-flex items-center gap-1.5"><span className="size-3 rounded border border-line bg-zinc-50" aria-hidden />{t("إجازة", "Day off")}</span>
      </div>
    </Panel>
  );
}
