import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./LoginForm";
import { RingsPattern } from "@/components/art/RingsPattern";
import { LangSwitch } from "@/components/dashboard/LangSwitch";
import { getDashT } from "@/lib/dash";
import { redirect } from "next/navigation";
import { LogOut, ShieldAlert } from "lucide-react";
import { createSessionClient, getAdmin } from "@/lib/supabase/server";
import { signOut } from "@/actions/auth";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getDashT();
  return { title: t("تسجيل الدخول", "Sign in"), robots: { index: false } };
}

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;
  const { t } = await getDashT();
  const target = typeof next === "string" && next.startsWith("/dashboard") ? next : "/dashboard";
  if (await getAdmin()) redirect(target);
  // Signed in, but not an active team member (paused, removed, or never added).
  const session = await createSessionClient();
  const strayUser = session ? (await session.auth.getUser()).data.user : null;
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="hero-glow flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6 flex justify-end">
            <LangSwitch className="border border-line bg-white text-night hover:border-violet" />
          </div>
          <Link href="/" aria-label={t("بريق — الموقع", "Bariq — website")}>
            <Image src="/images/logo.png" alt={t("بريق", "Bariq")} width={1136} height={476} priority className="h-12 w-auto" />
          </Link>
          <h1 className="mt-10 text-3xl font-bold text-night">{t("لوحة تحكم بريق", "Bariq Dashboard")}</h1>
          <p className="mt-2 text-muted">{t("سجّل الدخول لإدارة الخدمات والأعمال والمدونة والحجوزات.", "Sign in to manage services, portfolio, blog and bookings.")}</p>
          {strayUser ? (
            <div className="mt-8 space-y-4">
              <p role="alert" className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
                <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
                <span>
                  {t("الحساب", "The account")} <strong dir="ltr">{strayUser.email}</strong>{" "}
                  {t("لا يملك صلاحية الدخول إلى لوحة التحكم، أو تم إيقافه. تواصل مع مالك الحساب.", "has no dashboard access or was paused. Contact the account owner.")}
                </span>
              </p>
              <form action={signOut}>
                <button type="submit" className="btn btn-outline w-full">
                  <LogOut className="size-5 rtl:-scale-x-100" aria-hidden />
                  {t("تسجيل الخروج والدخول بحساب آخر", "Sign out and use another account")}
                </button>
              </form>
            </div>
          ) : (
            <LoginForm next={target} />
          )}
          <Link href="/" className="mt-8 inline-block text-sm font-semibold text-violet hover:underline">
            {t("← العودة إلى الموقع", "← Back to website")}
          </Link>
        </div>
      </div>
      <div className="relative hidden bg-night lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(70%_60%_at_50%_40%,#3a1673,#230b4b)]" />
        <RingsPattern className="absolute left-1/2 top-[40%] size-[560px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-12 start-12 end-12 text-white">
          <p className="text-3xl font-bold">{t("نلمّع حضورك، وننمّي أعمالك.", "We polish your presence and grow your business.")}</p>
          <p className="mt-2 text-white/75" dir="ltr">
            Bariq Digital Agency
          </p>
        </div>
      </div>
    </main>
  );
}
