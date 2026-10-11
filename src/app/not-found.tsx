import Link from "next/link";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="hero-glow -mt-[72px] pt-[72px]">
        <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
          <p className="text-7xl font-bold text-lilac" dir="ltr">
            404
          </p>
          <h1 className="mt-4 text-3xl font-bold text-night">الصفحة غير موجودة</h1>
          <p className="mt-3 max-w-md text-muted">ربما نُقلت الصفحة أو تغيّر رابطها. جرّب العودة للرئيسية أو تصفّح خدماتنا.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="btn btn-primary">
              الصفحة الرئيسية
            </Link>
            <Link href="/services" className="btn btn-outline">
              خدماتنا
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
