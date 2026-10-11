"use client";

import { useActionState, useRef } from "react";
import { rescheduleConsultation, updateConsultationStatus } from "@/actions/admin";
import type { ConsultationStatus, FormState } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { statusMeta } from "./ui";
import { useT } from "./DashLang";

export function StatusSelect({ id, status, name }: { id: string; status: ConsultationStatus; name: string }) {
  const form = useRef<HTMLFormElement>(null);
  const { t, lang } = useT();
  return (
    <form ref={form} action={updateConsultationStatus}>
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`status-${id}`}>
        {t(`حالة حجز ${name}`, `Booking status for ${name}`)}
      </label>
      <select
        id={`status-${id}`}
        name="status"
        defaultValue={status}
        onChange={() => form.current?.requestSubmit()}
        className="field !min-h-10 !w-auto !py-1.5 text-sm font-semibold"
      >
        {(Object.keys(statusMeta) as ConsultationStatus[]).map((s) => (
          <option key={s} value={s}>
            {statusMeta[s][lang]}
          </option>
        ))}
      </select>
    </form>
  );
}

const initial: FormState = { ok: false };

export function RescheduleForm({ id, date, time, slots: available }: { id: string; date: string; time: string; slots: string[] }) {
  const [state, action, pending] = useActionState(rescheduleConsultation, initial);
  const { t, lang } = useT();
  const current = time.slice(0, 5);
  const slots = available.includes(current) ? available : [current, ...available];
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor={`d-${id}`} className="mb-1 block text-xs font-semibold text-muted">
          {t("التاريخ", "Date")}
        </label>
        <input id={`d-${id}`} type="date" name="scheduled_date" defaultValue={date} dir="ltr" className="field !min-h-10 !w-auto !py-1.5 text-sm" />
      </div>
      <div>
        <label htmlFor={`t-${id}`} className="mb-1 block text-xs font-semibold text-muted">
          {t("الوقت", "Time")}
        </label>
        <select id={`t-${id}`} name="scheduled_time" defaultValue={current} className="field !min-h-10 !w-auto !py-1.5 text-sm">
          {slots.map((s) => (
            <option key={s} value={s}>
              {formatTime(s, lang)}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-dark btn-sm" disabled={pending}>
        {pending ? t("جارٍ الحفظ…", "Saving…") : t("تغيير الموعد", "Reschedule")}
      </button>
      {state.message && (
        <p role="status" className={state.ok ? "w-full text-sm text-emerald-800" : "w-full text-sm text-red-800"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
