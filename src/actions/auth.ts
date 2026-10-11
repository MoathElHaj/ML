"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSessionClient, getAdmin } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { DASH_LANG_COOKIE, dashLangFrom } from "@/lib/dash-i18n";
import type { FormState } from "@/lib/types";

const YEAR = 60 * 60 * 24 * 365;

async function rememberLang(lang: "ar" | "en") {
  (await cookies()).set(DASH_LANG_COOKIE, lang, { path: "/", maxAge: YEAR, sameSite: "lax" });
}

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const { t } = await getDashT();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/dashboard");
  if (!email || !password) return { ok: false, message: t("أدخل البريد الإلكتروني وكلمة المرور.", "Enter your email and password."), values: { email } };

  const supabase = await createSessionClient();
  if (!supabase) return { ok: false, message: t("لم يتم ربط Supabase بعد. أضف مفاتيح المشروع في ملف ‎.env.local.", "Supabase isn't connected yet. Add the project keys to .env.local.") };

  const { data: auth, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, message: t("بيانات الدخول غير صحيحة.", "Incorrect email or password."), values: { email } };

  const { data: member } = await supabase.from("admins").select("is_active, dashboard_lang").eq("user_id", auth.user.id).maybeSingle();
  if (!member) {
    await supabase.auth.signOut();
    return { ok: false, message: t("هذا الحساب لا يملك صلاحية الدخول إلى لوحة التحكم.", "This account doesn't have access to the dashboard."), values: { email } };
  }
  if (!member.is_active) {
    await supabase.auth.signOut();
    return { ok: false, message: t("تم إيقاف هذا الحساب. تواصل مع مدير الحساب.", "This account has been deactivated. Contact your admin."), values: { email } };
  }
  await rememberLang(dashLangFrom(member.dashboard_lang));
  redirect(next.startsWith("/dashboard") ? next : "/dashboard");
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase?.auth.signOut();
  redirect("/login");
}

/** Switches the dashboard language for this browser and saves it to the member's profile. */
export async function setDashLang(formData: FormData) {
  const lang = dashLangFrom(String(formData.get("lang")));
  await rememberLang(lang);
  const admin = await getAdmin();
  if (admin) await admin.supabase.rpc("set_dashboard_lang", { p_lang: lang });
}
