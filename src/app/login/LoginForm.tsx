"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { signIn } from "@/actions/auth";
import type { FormState } from "@/lib/types";
import { FormAlert, TextField } from "@/components/forms/Field";

const initial: FormState = { ok: false };

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, initial);
  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next} />
      <TextField label="البريد الإلكتروني" name="email" type="email" dir="ltr" autoComplete="email" required defaultValue={state.values?.email} />
      <TextField label="كلمة المرور" name="password" type="password" dir="ltr" autoComplete="current-password" required />
      <FormAlert ok={false} message={state.message} />
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        <LogIn className="size-5 -scale-x-100" aria-hidden />
        {pending ? "جارٍ الدخول…" : "تسجيل الدخول"}
      </button>
    </form>
  );
}
