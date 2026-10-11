"use client";

import { useActionState, useRef } from "react";
import { rescheduleConsultation, updateConsultationStatus } from "@/actions/admin";
import { booking } from "@/lib/site";
import type { ConsultationStatus, FormState } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { statusMeta } from "./ui";

export function StatusSelect({ id, status, name }: { id: string; status: ConsultationStatus; name: string }) {
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} action={updateConsultationStatus}>
      <input type="hidden" name="id" value={id} />
      <label className="sr-only" htmlFor={`status-${id}`}>
        حالة حجز {name}
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
            {statusMeta[s].label}
          </option>
        ))}
      </select>
    </form>
  );
}

const initial: FormState = { ok: false };

export function RescheduleForm({ id, date, time }: { id: string; date: string; time: string }) {
  const [state, action, pending] = useActionState(rescheduleConsultation, initial);
  const current = time.slice(0, 5);
  const slots = booking.slots.includes(current) ? booking.slots : [current, ...booking.slots];
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="id" value={id} />
      <div>
        <label htmlFor={`d-${id}`} className="mb-1 block text-xs font-semibold text-muted">
          التاريخ
        </label>
        <input id={`d-${id}`} type="date" name="scheduled_date" defaultValue={date} dir="ltr" className="field !min-h-10 !w-auto !py-1.5 text-sm" />
      </div>
      <div>
        <label htmlFor={`t-${id}`} className="mb-1 block text-xs font-semibold text-muted">
          الوقت
        </label>
        <select id={`t-${id}`} name="scheduled_time" defaultValue={current} className="field !min-h-10 !w-auto !py-1.5 text-sm">
          {slots.map((s) => (
            <option key={s} value={s}>
              {formatTime(s)}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className="btn btn-dark btn-sm" disabled={pending}>
        {pending ? "جارٍ الحفظ…" : "تغيير الموعد"}
      </button>
      {state.message && (
        <p role="status" className={state.ok ? "w-full text-sm text-emerald-800" : "w-full text-sm text-red-800"}>
          {state.message}
        </p>
      )}
    </form>
  );
}
