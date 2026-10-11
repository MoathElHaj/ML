import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, Check, Sparkles } from "lucide-react";
import { getServices } from "@/lib/data";
import { marketingPackages } from "@/lib/content";
import { whatsappLink } from "@/lib/site";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/site/parts";
import { ServiceIcon, WhatsAppIcon } from "@/components/icons";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "الأسعار",
  description: "باقات التسويق الرقمي الشهرية من وكالة بريق الرقمية، تبدأ من 250 ريالاً عمانياً شهرياً.",
};

export default async function PricingPage() {
  const services = await getServices();
  const quoteServices = services.filter((s) => s.slug !== "digital-marketing");

  return (
    <>
      <PageHero
        eyebrow="الأسعار"
        title="باقات التسويق والتصميم"
        intro="حلول مدروسة لكل مرحلة من مراحل نمو علامتك التجارية. اختر الباقة المناسبة وابدأ هذا الشهر."
      />

      <section className="container-x pb-20 pt-6 sm:pb-24" aria-labelledby="packages-title">
        <h2 id="packages-title" className="sr-only">
          باقات التسويق الرقمي الشهرية
        </h2>
        <div className="grid items-stretch gap-6 lg:grid-cols-3 lg:gap-5">
          {marketingPackages.map((pkg) => {
            const wa = whatsappLink(`مرحباً بريق، أرغب بالاشتراك في ${pkg.name} (${pkg.price} ريال عماني شهرياً)`);
            const href = wa ?? `/booking?service=digital-marketing`;
            return (
              <article
                key={pkg.id}
                className={cn(
                  "relative flex flex-col rounded-[28px] p-7 sm:p-8",
                  pkg.featured
                    ? "bg-night text-white shadow-[0_30px_60px_-24px_rgb(58_22_115/.6)] ring-2 ring-violet lg:-my-4 lg:py-12"
                    : "border border-line bg-white text-night shadow-[var(--shadow-soft)]",
                )}
              >
                {pkg.featured && (
                  <span className="absolute inset-x-0 -top-4 mx-auto flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-violet px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                    <Sparkles className="size-4" aria-hidden />
                    الأكثر طلباً
                  </span>
                )}
                <h3 className="text-2xl font-bold">{pkg.name}</h3>
                <p className={cn("mt-2 min-h-14 text-[15px] leading-7", pkg.featured ? "text-white/75" : "text-muted")}>{pkg.tagline}</p>

                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight">{pkg.price}</span>
                  <span className={cn("text-[15px]", pkg.featured ? "text-white/75" : "text-muted")}>ريال عماني / شهرياً</span>
                </p>

                <div className={cn("my-7 h-px", pkg.featured ? "bg-white/15" : "bg-line")} />

                <ul className="flex-1 space-y-3.5">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[15px] leading-7">
                      <span
                        className={cn(
                          "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full",
                          pkg.featured ? "bg-lilac text-night" : "bg-lilac-50 text-violet",
                        )}
                      >
                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={href}
                  target={wa ? "_blank" : undefined}
                  rel={wa ? "noopener noreferrer" : undefined}
                  className={cn("btn mt-8 w-full", pkg.featured ? "btn-light" : "btn-outline")}
                >
                  {wa && <WhatsAppIcon className="size-5" />}
                  {pkg.cta}
                </a>
              </article>
            );
          })}
        </div>
        <p className="mt-10 text-center text-[15px] text-muted">
          غير متأكد أي باقة تناسبك؟{" "}
          <Link href="/booking?service=digital-marketing" className="font-semibold text-violet underline-offset-4 hover:underline">
            احجز استشارة مجانية
          </Link>{" "}
          وسنساعدك على الاختيار.
        </p>
      </section>

      <section className="bg-lilac-50/70 py-20 sm:py-24" aria-labelledby="quote-title">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">أسعار حسب المشروع</span>
            <h2 id="quote-title" className="mt-4 text-[28px] font-bold text-night sm:text-4xl">
              أسعار التصميم والمواقع <span className="text-gradient">والتطبيقات</span>
            </h2>
            <p className="mt-4 text-[17px] leading-8 text-muted">
              كل مشروع تصميم أو موقع أو تطبيق له متطلباته الخاصة، لذلك نقدّم لك عرض سعر مفصّلاً بعد فهم احتياجك. تواصل معنا
              وسنرسل لك العرض خلال يوم عمل.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {quoteServices.map((s) => {
              const wa = whatsappLink(`مرحباً بريق، أرغب بمعرفة أسعار خدمة ${s.title}`);
              return (
                <article key={s.id} className="card flex flex-col p-7">
                  <span className="flex size-14 items-center justify-center rounded-2xl bg-violet text-white">
                    <ServiceIcon name={s.icon} className="size-7" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-night">{s.title}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-7 text-muted">{s.summary}</p>
                  <p className="mt-5 text-sm font-semibold text-violet">السعر حسب نطاق المشروع</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {wa ? (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm flex-1">
                        <WhatsAppIcon className="size-4" />
                        اطلب عرض سعر
                      </a>
                    ) : (
                      <Link href="/contact" className="btn btn-primary btn-sm flex-1">
                        اطلب عرض سعر
                      </Link>
                    )}
                    <Link href={`/services/${s.slug}`} className="btn btn-outline btn-sm" aria-label={`تفاصيل ${s.title}`}>
                      التفاصيل
                      <ArrowLeft className="size-4" aria-hidden />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-[28px] bg-night px-6 py-8 text-white sm:flex-row sm:px-10">
            <div>
              <p className="text-xl font-bold">لديك مشروع في ذهنك؟</p>
              <p className="mt-1 text-white/75">أخبرنا بفكرتك وسنقترح عليك الحل والتكلفة المناسبة.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/contact" className="btn btn-light">
                تواصل معنا
              </Link>
              <Link href="/booking" className="btn btn-ghost-light">
                <CalendarCheck className="size-5" aria-hidden />
                احجز استشارة
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
