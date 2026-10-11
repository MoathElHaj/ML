import type { Metadata } from "next";
import { CheckCircle2, Clock, Gift, ShieldCheck } from "lucide-react";
import { getServices } from "@/lib/data";
import { booking } from "@/lib/site";
import { PageHero } from "@/components/site/parts";
import { BookingForm } from "@/components/forms/BookingForm";

export const metadata: Metadata = {
  title: "احجز استشارة مجانية",
  description: "احجز جلسة استشارية مجانية مع خبراء بريق في التسويق الرقمي والتصميم وتطوير المواقع والتطبيقات.",
};

const perks = [
  { Icon: Gift, title: "مجانية بالكامل", body: "بدون أي التزام أو رسوم." },
  { Icon: Clock, title: `${booking.durationMinutes} دقيقة مركّزة`, body: "نناقش أهدافك وتحدياتك الحالية." },
  { Icon: CheckCircle2, title: "توصيات عملية", body: "تخرج بخطوات واضحة يمكنك البدء بها فوراً." },
  { Icon: ShieldCheck, title: "سرية تامة", body: "بياناتك وأفكارك في أمان معنا." },
];

export default async function BookingPage(props: PageProps<"/booking">) {
  const { service } = await props.searchParams;
  const services = await getServices();
  const defaultService = typeof service === "string" && services.some((s) => s.slug === service) ? service : undefined;

  return (
    <>
      <PageHero
        eyebrow="استشارة مجانية"
        title="احجز استشارتك المجانية"
        intro="اختر اليوم والوقت المناسبين لك، وسيتواصل معك أحد خبرائنا لتأكيد الموعد."
      />
      <section className="container-x grid gap-10 py-14 sm:py-16 lg:grid-cols-[1fr_1.7fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-2xl font-bold text-night">ماذا ستحصل في الجلسة؟</h2>
          <ul className="mt-6 space-y-4">
            {perks.map(({ Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-lilac-50 text-violet">
                  <Icon className="size-6" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-night">{title}</p>
                  <p className="text-[15px] text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </aside>
        <BookingForm services={services.map((s) => ({ slug: s.slug, title: s.title }))} defaultService={defaultService} />
      </section>
    </>
  );
}
