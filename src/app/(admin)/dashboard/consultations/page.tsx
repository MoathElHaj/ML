import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, CalendarDays, Clock, Mail, MessageSquareText, Phone, Trash2, Video } from "lucide-react";
import { getAdmin } from "@/lib/supabase/server";
import { deleteConsultation, saveConsultationNotes, updateConsultationStatus } from "@/actions/admin";
import { booking, channels } from "@/lib/site";
import type { Consultation, Service } from "@/lib/types";
import { addDays, cn, dayOfMonth, formatDay, formatShortWeekday, formatTime, todayIn } from "@/lib/utils";
import { ConfirmButton, SubmitButton } from "@/components/dashboard/ConfirmButton";
import { RescheduleForm, StatusSelect } from "@/components/dashboard/ConsultationControls";
import { EmptyRow, Panel, StatusBadge } from "@/components/dashboard/ui";
import { WhatsAppIcon } from "@/components/icons";

export const metadata = { title: "الاستشارات" };

const tabs = [
  { key: "upcoming", label: "القادمة" },
  { key: "pending", label: "بانتظار التأكيد" },
  { key: "past", label: "السابقة" },
  { key: "all", label: "الكل" },
] as const;

function clientWhatsApp(c: Consultation) {
  const digits = c.phone.replace(/\D/g, "").replace(/^00/, "");
  const text = `مرحباً ${c.full_name}، معك فريق بريق. نؤكد موعد استشارتك المجانية يوم ${formatDay(c.scheduled_date)} الساعة ${formatTime(c.scheduled_time)}.`;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export default async function ConsultationsAdmin(props: PageProps<"/dashboard/consultations">) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const sp = await props.searchParams;
  const tab = (typeof sp.status === "string" ? sp.status : "upcoming") as (typeof tabs)[number]["key"];
  const day = typeof sp.day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.day) ? sp.day : null;
  const today = todayIn(booking.timeZone);

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
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-night">جدول الاستشارات</h1>
        <p className="mt-1 text-muted">الحجوزات التي يرسلها العملاء من صفحة «احجز استشارة». أكّد الموعد وتواصل مع العميل مباشرة.</p>
      </div>

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
                aria-label={`${formatDay(d)}: ${n} حجز`}
                className={cn(
                  "flex min-w-[68px] flex-col items-center rounded-2xl border-[1.5px] px-2 py-2.5 transition-colors",
                  active ? "border-violet bg-violet text-white" : d === today ? "border-violet/40 bg-lilac-50" : "border-line hover:border-violet",
                )}
              >
                <span className={cn("text-xs", active ? "text-white/85" : "text-muted")}>{d === today ? "اليوم" : formatShortWeekday(d)}</span>
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

      <nav aria-label="تصفية الاستشارات" className="mb-6 flex flex-wrap gap-2">
        {day ? (
          <Link href="/dashboard/consultations" className="btn btn-outline btn-sm">
            <CalendarDays className="size-4" aria-hidden />
            {formatDay(day)} · عرض الكل ✕
          </Link>
        ) : (
          tabs.map((t) => (
            <Link
              key={t.key}
              href={`/dashboard/consultations?status=${t.key}`}
              aria-current={tab === t.key ? "page" : undefined}
              className={cn(
                "rounded-full border-[1.5px] px-4 py-2 text-sm font-semibold transition-colors",
                tab === t.key ? "border-night bg-night text-white" : "border-line bg-white text-night hover:border-violet",
              )}
            >
              {t.label}
            </Link>
          ))
        )}
      </nav>

      {list.length === 0 ? (
        <Panel>
          <EmptyRow>لا توجد حجوزات هنا.</EmptyRow>
        </Panel>
      ) : (
        <div className="space-y-8">
          {[...groups.entries()].map(([date, items]) => (
            <section key={date} aria-labelledby={`day-${date}`}>
              <h2 id={`day-${date}`} className="mb-3 flex items-center gap-2 font-bold text-night">
                <CalendarDays className="size-5 text-violet" aria-hidden />
                {formatDay(date)}
                {date === today && <span className="rounded-full bg-violet px-2 py-0.5 text-xs text-white">اليوم</span>}
                <span className="text-sm font-normal text-muted">· {items.length} حجز</span>
              </h2>
              <div className="space-y-3">
                {items.map((c) => (
                  <article key={c.id} className={cn("rounded-[20px] border bg-white p-5", c.status === "pending" ? "border-amber-300" : "border-line")}>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      <div className="flex shrink-0 items-center gap-2 rounded-xl bg-lilac-50 px-3 py-2 text-night lg:w-28 lg:flex-col lg:py-3">
                        <Clock className="size-4 text-violet" aria-hidden />
                        <span className="font-bold">{formatTime(c.scheduled_time)}</span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-lg font-bold text-night">{c.full_name}</h3>
                          <StatusBadge status={c.status} />
                        </div>
                        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-muted">
                          {c.company && (
                            <div className="flex items-center gap-1.5">
                              <Building2 className="size-4" aria-hidden />
                              <dt className="sr-only">الشركة</dt>
                              <dd>{c.company}</dd>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <Video className="size-4" aria-hidden />
                            <dt className="sr-only">طريقة الاجتماع</dt>
                            <dd>{channels.find((ch) => ch.value === c.channel)?.label}</dd>
                          </div>
                          {c.service_slug && (
                            <div className="flex items-center gap-1.5">
                              <dt className="sr-only">الخدمة</dt>
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
                            واتساب العميل
                          </a>
                          <a href={`tel:${c.phone.replace(/\s/g, "")}`} className="btn btn-outline btn-sm">
                            <Phone className="size-4" aria-hidden />
                            <span dir="ltr">{c.phone}</span>
                          </a>
                          {c.email && (
                            <a href={`mailto:${c.email}`} className="btn btn-outline btn-sm">
                              <Mail className="size-4" aria-hidden />
                              بريد
                            </a>
                          )}
                        </div>

                        <details className="group mt-4 rounded-xl border border-line">
                          <summary className="cursor-pointer list-none px-4 py-2.5 text-sm font-semibold text-violet marker:hidden">
                            ملاحظات وتغيير الموعد {c.admin_notes ? "· يوجد ملاحظات" : ""}
                          </summary>
                          <div className="space-y-4 border-t border-line p-4">
                            <form action={saveConsultationNotes} className="space-y-2">
                              <input type="hidden" name="id" value={c.id} />
                              <label htmlFor={`n-${c.id}`} className="block text-xs font-semibold text-muted">
                                ملاحظات داخلية (لا يراها العميل)
                              </label>
                              <textarea id={`n-${c.id}`} name="admin_notes" defaultValue={c.admin_notes ?? ""} rows={3} className="field !min-h-0 text-sm" />
                              <SubmitButton className="btn btn-outline btn-sm" pendingText="جارٍ الحفظ…">
                                حفظ الملاحظات
                              </SubmitButton>
                            </form>
                            <RescheduleForm id={c.id} date={c.scheduled_date} time={c.scheduled_time} />
                          </div>
                        </details>
                      </div>

                      <div className="flex shrink-0 flex-row items-start gap-2 lg:flex-col lg:items-stretch">
                        {c.status === "pending" && (
                          <form action={updateConsultationStatus}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="status" value="confirmed" />
                            <SubmitButton className="btn btn-primary btn-sm w-full" pendingText="…">
                              تأكيد الموعد
                            </SubmitButton>
                          </form>
                        )}
                        <StatusSelect id={c.id} status={c.status} name={c.full_name} />
                        <form action={deleteConsultation}>
                          <input type="hidden" name="id" value={c.id} />
                          <ConfirmButton className="btn btn-danger btn-sm w-full" message={`حذف حجز ${c.full_name} نهائياً؟`} aria-label={`حذف حجز ${c.full_name}`}>
                            <Trash2 className="size-4" aria-hidden />
                            <span className="lg:inline">حذف</span>
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
  );
}
