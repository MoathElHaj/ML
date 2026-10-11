"use server";

import { redirect } from "next/navigation";
import { createSessionClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/types";

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  if (!email || !password) return { ok: false, message: "أدخل البريد الإلكتروني وكلمة المرور.", values: { email } };

  const supabase = await createSessionClient();
  if (!supabase) return { ok: false, message: "لم يتم ربط Supabase بعد. أضف مفاتيح المشروع في ملف ‎.env.local." };

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: "بيانات الدخول غير صحيحة.", values: { email } };

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { ok: false, message: "هذا الحساب لا يملك صلاحية الدخول إلى لوحة التحكم.", values: { email } };
  }
  redirect(next.startsWith("/dashboard") ? next : "/dashboard");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase?.auth.signOut();
  redirect("/login");
}
