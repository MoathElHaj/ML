"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";
import { bookConsultation, getBookedSlots } from "@/actions/public";
import { booking, channels, whatsappLink } from "@/lib/site";
import type { FormState } from "@/lib/types";
import { addDays, cn, dayOfMonth, formatDay, formatShortWeekday, formatTime, parseDay, todayIn, weekdayOf } from "@/lib/utils";
import { FormAlert, Honeypot, SelectField, TextArea, TextField } from "./Field";
import { WhatsAppIcon } from "@/components/icons";

const initial: FormState = { ok: false };

function availableDays() {
  const today = todayIn(booking.timeZone);
  const days: string[] = [];
  for (let i = 1; i <= booking.daysAhead; i++) {
    const d = addDays(today, i);
    if (booking.workingDays.includes(weekdayOf(d))) days.push(d);
  }
  return days;
}

export function BookingForm({ services, defaultService }: { services: { slug: string; title: string }[]; defaultService?: string }) {
  const [state, action, pending] = useActionState(bookConsultation, initial);
  const [days] = useState(availableDays);
  const [day, setDay] = useState("");
  const [picked, setPicked] = useState("");
  const [taken, setTaken] = useState<string[]>([]);
  const [loadingSlots, startLoading] = useTransition();
  const e = state.errors ?? {};
  const v = state.values ?? {};

  useEffect(() => {
    if (!day) return;
    startLoading(async () => {
      setTaken(await getBookedSlots(day));
    });
  }, [day]);

  // A slot taken by someone else since the page loaded: refresh the taken list.
  useEffect(() => {
    if (e.scheduled_time && day) getBookedSlots(day).then(setTaken);
  }, [e.scheduled_time, day]);

  const time = taken.includes(picked) ? "" : picked;
  const setTime = setPicked;

  if (state.ok) {
    const wa = whatsappLink(`مرحباً بريق، حجزت استشارة يوم ${day ? formatDay(day) : ""} الساعة ${time ? formatTime(time) : ""}`);
    return (
      <div className="card px-6 py-12 text-center sm:px-10">
        <CheckCircle2 className="mx-auto size-14 text-violet" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold text-night">تم استلام طلب الحجز</h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          {state.message}
          {day && time && (
            <>
              <br />
              الموعد المطلوب: <strong className="text-night">{formatDay(day)} — {formatTime(time)}</strong>
            </>
          )}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-outline">
            العودة للرئيسية
          </Link>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <WhatsAppIcon className="size-5" />
              أكّد عبر واتساب
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="card relative min-w-0 space-y-8 p-6 sm:p-8" noValidate>
      <Honeypot />
      <input type="hidden" name="scheduled_date" value={day} />
      <input type="hidden" name="scheduled_time" value={time} />

      <fieldset>
        <legend className="flex items-center gap-2 text-lg font-bold text-night">
          <span className="flex size-7 items-center justify-center rounded-full bg-violet text-sm text-white">1</span>
          اختر اليوم
        </legend>
        <div className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2" role="radiogroup" aria-label="أيام متاحة">
          {days.map((d) => {
            const selected = d === day;
            const month = parseDay(d).toLocaleDateString("ar-u-nu-latn", { month: "short" });
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={formatDay(d)}
                onClick={() => {
                  setDay(d);
                  setTime("");
                }}
                className={cn(
                  "flex min-w-[76px] snap-start flex-col items-center rounded-2xl border-[1.5px] px-3 py-3 transition-colors",
                  selected ? "border-violet bg-violet text-white" : "border-line bg-white text-night hover:border-violet",
                )}
              >
                <span className={cn("text-xs", selected ? "text-white/85" : "text-muted")}>{formatShortWeekday(d)}</span>
                <span className="text-xl font-bold leading-8">{dayOfMonth(d)}</span>
                <span className={cn("text-xs", selected ? "text-white/85" : "text-muted")}>
                  {month}
                </span>
              </button>
            );
          })}
        </div>
        {e.scheduled_date && <p className="field-error">{e.scheduled_date}</p>}
      </fieldset>

      <fieldset disabled={!day}>
        <legend className="flex items-center gap-2 text-lg font-bold text-night">
          <span className={cn("flex size-7 items-center justify-center rounded-full text-sm text-white", day ? "bg-violet" : "bg-[#a99bc4]")}>2</span>
          اختر الوقت
          {loadingSlots && <Loader2 className="size-4 animate-spin text-violet" aria-label="جارٍ التحميل" />}
        </legend>
        {!day ? (
          <p className="mt-3 text-[15px] text-muted">اختر يوماً أولاً لعرض الأوقات المتاحة.</p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="أوقات متاحة">
            {booking.slots.map((s) => {
              const isTaken = taken.includes(s);
              const selected = s === time;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={isTaken || loadingSlots}
                  onClick={() => setTime(s)}
                  className={cn(
                    "min-h-12 rounded-xl border-[1.5px] text-[15px] font-semibold transition-colors",
                    isTaken && "cursor-not-allowed border-dashed border-line bg-lilac-50 text-[#8c80a6] line-through",
                    !isTaken && selected && "border-violet bg-violet text-white",
                    !isTaken && !selected && "border-line bg-white text-night hover:border-violet",
                  )}
                >
                  {formatTime(s)}
                </button>
              );
            })}
          </div>
        )}
        {e.scheduled_time && <p className="field-error">{e.scheduled_time}</p>}
        <p className="field-hint">مدة الجلسة {booking.durationMinutes} دقيقة. الأوقات المشطوبة محجوزة.</p>
      </fieldset>

      <fieldset>
        <legend className="flex items-center gap-2 text-lg font-bold text-night">
          <span className="flex size-7 items-center justify-center rounded-full bg-violet text-sm text-white">3</span>
          بياناتك
        </legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <TextField label="الاسم الكامل" name="full_name" defaultValue={v.full_name} required autoComplete="name" error={e.full_name} />
          <TextField label="رقم الهاتف / واتساب" name="phone" defaultValue={v.phone} type="tel" dir="ltr" inputMode="tel" required autoComplete="tel" placeholder="+968 …" error={e.phone} />
          <TextField label="البريد الإلكتروني" name="email" defaultValue={v.email} type="email" dir="ltr" autoComplete="email" error={e.email} />
          <TextField label="اسم الشركة / المشروع" name="company" defaultValue={v.company} autoComplete="organization" error={e.company} />
          <SelectField label="الخدمة المطلوبة" name="service_slug" defaultValue={v.service_slug ?? defaultService ?? ""} error={e.service_slug}>
            <option value="">لم أحدد بعد</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </SelectField>
          <SelectField label="طريقة الاجتماع" name="channel" defaultValue={v.channel ?? "online"} error={e.channel}>
            {channels.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </SelectField>
          <TextArea label="حدّثنا باختصار عن مشروعك" name="message" defaultValue={v.message} rows={4} error={e.message} className="sm:col-span-2" />
        </div>
      </fieldset>

      <div className="space-y-4 border-t border-line pt-6">
        <FormAlert ok={false} message={state.message} />
        <button type="submit" className="btn btn-primary w-full" disabled={pending || !day || !time}>
          <CalendarCheck className="size-5" aria-hidden />
          {pending ? "جارٍ تأكيد الحجز…" : day && time ? `احجز ${formatDay(day)} — ${formatTime(time)}` : "اختر اليوم والوقت للمتابعة"}
        </button>
      </div>
    </form>
  );
}
