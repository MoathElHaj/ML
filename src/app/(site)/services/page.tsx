import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";
import { getServices } from "@/lib/data";
import { CtaBand, PageHero } from "@/components/site/parts";
import { ServiceIcon } from "@/components/icons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "خدماتنا",
  description: "التسويق الرقمي، تصميم الجرافيك، تطوير المواقع وتطبيقات الموبايل من وكالة بريق الرقمية.",
};

export default async function ServicesPage() {
  const services = await getServices();
  return (
    <>
      <PageHero
        eyebrow="خدماتنا"
        title="حلول رقمية متكاملة تنمو معك"
        intro="من بناء الهوية حتى إطلاق التطبيق وإدارة الحملات: اختر الخدمة التي تحتاجها، أو دعنا نصمم لك باقة متكاملة."
      />
      <section className="container-x space-y-20 py-16 sm:py-20">
        {services.map((s, i) => (
          <article key={s.id} id={s.slug} className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-2">
            <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
              <div className="relative aspect-[16/11] overflow-hidden rounded-[32px] bg-night shadow-[var(--shadow-soft)]">
                {s.image_url && <Image src={s.image_url} alt="" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />}
              </div>
            </div>
            <div>
              <span className="flex size-14 items-center justify-center rounded-2xl bg-lilac-50 text-violet">
                <ServiceIcon name={s.icon} className="size-7" aria-hidden />
              </span>
              <h2 className="mt-5 text-3xl font-bold text-night">{s.title}</h2>
              <p className="mt-4 text-[17px] leading-9 text-muted">{s.description || s.summary}</p>
              {s.features.length > 0 && (
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[15px] text-night">
                      <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-violet text-white">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`/services/${s.slug}`} className="btn btn-dark">
                  تفاصيل الخدمة
                  <ArrowLeft className="size-4" aria-hidden />
                </Link>
                <Link href={`/booking?service=${s.slug}`} className="btn btn-outline">
                  احجز استشارة
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
      <CtaBand title="لست متأكداً من الخدمة المناسبة؟" body="احجز استشارة مجانية وسنساعدك على تحديد ما تحتاجه علامتك فعلاً، وبأي ترتيب." />
    </>
  );
}
