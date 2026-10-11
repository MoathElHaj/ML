"use client";

import { useActionState } from "react";
import { Send } from "lucide-react";
import { sendMessage } from "@/actions/public";
import type { FormState } from "@/lib/types";
import { FormAlert, Honeypot, TextArea, TextField } from "./Field";

const initial: FormState = { ok: false };

export function ContactForm() {
  const [state, action, pending] = useActionState(sendMessage, initial);
  const e = state.errors ?? {};
  const v = state.values ?? {};

  if (state.ok && state.message) {
    return (
      <div className="card p-8 text-center">
        <FormAlert ok message={state.message} />
      </div>
    );
  }

  return (
    <form action={action} className="relative grid gap-5 sm:grid-cols-2" noValidate>
      <Honeypot />
      <TextField label="الاسم الكامل" name="full_name" defaultValue={v.full_name} required autoComplete="name" error={e.full_name} className="sm:col-span-2" />
      <TextField label="رقم الهاتف" name="phone" defaultValue={v.phone} type="tel" dir="ltr" inputMode="tel" autoComplete="tel" placeholder="+968 …" error={e.phone} />
      <TextField label="البريد الإلكتروني" name="email" defaultValue={v.email} type="email" dir="ltr" autoComplete="email" error={e.email} />
      <TextField label="الموضوع" name="subject" defaultValue={v.subject} error={e.subject} className="sm:col-span-2" />
      <TextArea label="رسالتك" name="body" defaultValue={v.body} required rows={5} error={e.body} className="sm:col-span-2" />
      <div className="space-y-4 sm:col-span-2">
        {!state.ok && <FormAlert ok={false} message={state.message} />}
        <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
          <Send className="size-4 -scale-x-100" aria-hidden />
          {pending ? "جارٍ الإرسال…" : "أرسل الرسالة"}
        </button>
      </div>
    </form>
  );
}
