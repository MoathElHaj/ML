"use client";

import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { signIn } from "@/actions/auth";
import type { FormState } from "@/lib/types";
import { FormAlert, TextField } from "@/components/forms/Field";
import { useT } from "@/components/dashboard/DashLang";

const initial: FormState = { ok: false };

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signIn, initial);
  const { t } = useT();
  return (
    <form action={action} className="mt-8 space-y-5">
      <input type="hidden" name="next" value={next} />
      <TextField label={t("البريد الإلكتروني", "Email")} name="email" type="email" dir="ltr" autoComplete="email" required defaultValue={state.values?.email} />
      <TextField label={t("كلمة المرور", "Password")} name="password" type="password" dir="ltr" autoComplete="current-password" required />
      <FormAlert ok={false} message={state.message} />
      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        <LogIn className="size-5 rtl:-scale-x-100" aria-hidden />
        {pending ? t("جارٍ الدخول…", "Signing in…") : t("تسجيل الدخول", "Sign in")}
      </button>
    </form>
  );
}
