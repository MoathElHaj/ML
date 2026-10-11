"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, Loader2 } from "lucide-react";
import { bookConsultation, getBookedSlots } from "@/actions/public";
import { booking, whatsappLink } from "@/lib/site";
import { getDict, href, type Lang } from "@/lib/i18n";
import type { FormState } from "@/lib/types";
import { addDays, cn, dayOfMonth, formatDay, formatShortMonth, formatShortWeekday, formatTime, todayIn, weekdayOf } from "@/lib/utils";
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

export function BookingForm({
  lang,
  services,
  defaultService,
}: {
  lang: Lang;
  services: { slug: string; title: string }[];
  defaultService?: string;
}) {
  const t = getDict(lang);
  const b = t.booking;
  const f = t.form;
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
    const wa = whatsappLink(t.wa.booked(day ? formatDay(day, lang) : "", time ? formatTime(time, lang) : ""));
    return (
      <div className="card px-6 py-12 text-center sm:px-10">
        <CheckCircle2 className="mx-auto size-14 text-accent" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold text-ink">{b.successTitle}</h2>
        <p className="mx-auto mt-3 max-w-md text-muted">
          {state.message}
          {day && time && (
            <>
              <br />
              {b.requested}{" "}
              <strong className="text-ink">
                {formatDay(day, lang)} — {formatTime(time, lang)}
              </strong>
            </>
          )}
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={href(lang, "/")} className="btn btn-outline">
            {b.backHome}
          </Link>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
              <WhatsAppIcon className="size-5" />
              {b.confirmWa}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="card relative min-w-0 space-y-8 p-6 sm:p-8" noValidate>
      <Honeypot />
      <input type="hidden" name="lang" value={lang} />
      <input type="hidden" name="scheduled_date" value={day} />
      <input type="hidden" name="scheduled_time" value={time} />

      <fieldset>
        <legend className="flex items-center gap-2 text-lg font-bold text-ink">
          <span className="flex size-7 items-center justify-center rounded-full bg-violet text-sm text-white">1</span>
          {b.step1}
        </legend>
        <div className="-mx-1 mt-4 flex snap-x gap-2 overflow-x-auto px-1 pb-2" role="radiogroup" aria-label={b.daysAria}>
          {days.map((d) => {
            const selected = d === day;
            const month = formatShortMonth(d, lang);
            return (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={formatDay(d, lang)}
                onClick={() => {
                  setDay(d);
                  setTime("");
                }}
                className={cn(
                  "flex min-w-[76px] snap-start flex-col items-center rounded-2xl border-[1.5px] px-3 py-3 transition-colors",
                  selected ? "border-violet bg-violet text-white" : "border-line bg-card text-ink hover:border-accent",
                )}
              >
                <span className={cn("text-xs", selected ? "text-white/85" : "text-muted")}>{formatShortWeekday(d, lang)}</span>
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
        <legend className="flex items-center gap-2 text-lg font-bold text-ink">
          <span className={cn("flex size-7 items-center justify-center rounded-full text-sm text-white", day ? "bg-violet" : "bg-muted/50")}>2</span>
          {b.step2}
          {loadingSlots && <Loader2 className="size-4 animate-spin text-accent" aria-label={b.loading} />}
        </legend>
        {!day ? (
          <p className="mt-3 text-[15px] text-muted">{b.pickDayFirst}</p>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={b.timesAria}>
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
                    isTaken && "cursor-not-allowed border-dashed border-line bg-tint text-muted line-through",
                    !isTaken && selected && "border-violet bg-violet text-white",
                    !isTaken && !selected && "border-line bg-card text-ink hover:border-accent",
                  )}
                >
                  {formatTime(s, lang)}
                </button>
              );
            })}
          </div>
        )}
        {e.scheduled_time && <p className="field-error">{e.scheduled_time}</p>}
        <p className="field-hint">{b.slotHint(booking.durationMinutes)}</p>
      </fieldset>

      <fieldset>
        <legend className="flex items-center gap-2 text-lg font-bold text-ink">
          <span className="flex size-7 items-center justify-center rounded-full bg-violet text-sm text-white">3</span>
          {b.step3}
        </legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <TextField label={f.fullName} name="full_name" defaultValue={v.full_name} required autoComplete="name" error={e.full_name} />
          <TextField label={b.phone} name="phone" defaultValue={v.phone} type="tel" dir="ltr" inputMode="tel" required autoComplete="tel" placeholder={f.phonePlaceholder} error={e.phone} />
          <TextField label={f.email} name="email" defaultValue={v.email} type="email" dir="ltr" autoComplete="email" error={e.email} />
          <TextField label={b.company} name="company" defaultValue={v.company} autoComplete="organization" error={e.company} />
          <SelectField label={b.service} name="service_slug" defaultValue={v.service_slug ?? defaultService ?? ""} error={e.service_slug}>
            <option value="">{b.noService}</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </SelectField>
          <SelectField label={b.channel} name="channel" defaultValue={v.channel ?? "online"} error={e.channel}>
            {(["online", "phone", "office"] as const).map((c) => (
              <option key={c} value={c}>
                {b.channels[c]}
              </option>
            ))}
          </SelectField>
          <TextArea label={b.message} name="message" defaultValue={v.message} rows={4} error={e.message} className="sm:col-span-2" />
        </div>
      </fieldset>

      <div className="space-y-4 border-t border-line pt-6">
        <FormAlert ok={false} message={state.message} />
        <button type="submit" className="btn btn-primary w-full" disabled={pending || !day || !time}>
          <CalendarCheck className="size-5" aria-hidden />
          {pending ? b.submitting : day && time ? b.submit(formatDay(day, lang), formatTime(time, lang)) : b.submitDisabled}
        </button>
      </div>
    </form>
  );
}
