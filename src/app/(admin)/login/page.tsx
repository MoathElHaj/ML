import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  robots: { index: false },
};

export default async function LoginPage(props: PageProps<"/login">) {
  const { next } = await props.searchParams;
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <div className="hero-glow flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Link href="/" aria-label="بريق — الموقع">
            <Image src="/images/logo.png" alt="بريق" width={1136} height={476} priority className="h-12 w-auto" />
          </Link>
          <h1 className="mt-10 text-3xl font-bold text-night">لوحة تحكم بريق</h1>
          <p className="mt-2 text-muted">سجّل الدخول لإدارة الخدمات والأعمال والمدونة والحجوزات.</p>
          <LoginForm next={typeof next === "string" ? next : "/dashboard"} />
          <Link href="/" className="mt-8 inline-block text-sm font-semibold text-violet hover:underline">
            ← العودة إلى الموقع
          </Link>
        </div>
      </div>
      <div className="relative hidden bg-night lg:block">
        <Image src="/images/service-web.jpg" alt="" fill sizes="50vw" className="object-cover opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-t from-night via-night/30 to-transparent" />
        <div className="absolute bottom-12 start-12 end-12 text-white">
          <p className="text-3xl font-bold">نلمّع حضورك، وننمّي أعمالك.</p>
          <p className="mt-2 text-white/75" dir="ltr">
            Bariq Digital Agency
          </p>
        </div>
      </div>
    </main>
  );
}
