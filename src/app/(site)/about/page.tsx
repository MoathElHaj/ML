import type { Metadata } from "next";
import Image from "next/image";
import { Eye, Gem, Target } from "lucide-react";
import { getServices } from "@/lib/data";
import { processSteps, values } from "@/lib/content";
import { CtaBand, PageHero, ServiceCard } from "@/components/site/parts";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "من نحن",
  description: "تعرّف على وكالة بريق الرقمية: رؤيتنا ورسالتنا وقيمنا وطريقة عملنا.",
};

const pillars = [
  { Icon: Eye, title: "رؤيتنا", body: "أن نكون الشريك الرقمي الأول للعلامات الطموحة في المنطقة، وأن يرتبط اسم بريق بكل حضور رقمي لامع." },
  { Icon: Target, title: "رسالتنا", body: "نساعد الشركات ورواد الأعمال على النمو عبر حلول تسويقية وتقنية متكاملة، مبنية على فهم عميق ونتائج قابلة للقياس." },
  { Icon: Gem, title: "ما يميزنا", body: "فريق واحد يجمع التسويق والتصميم والتطوير، فتصلك نتيجة متناسقة وسريعة دون تشتت بين أكثر من جهة." },
];

export default async function AboutPage() {
  const services = await getServices();
  return (
    <>
      <PageHero
        eyebrow="من نحن"
        title="نحن بريق: نلمّع حضورك ونصنع نموك"
        intro="وكالة رقمية تؤمن بأن كل علامة تجارية تستحق أن تلمع. نجمع الإبداع بالتقنية والبيانات لنبني لك حضوراً رقمياً يحقق أهدافك."
      />

      <section className="container-x grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-night">
          <Image src="/images/about.jpg" alt="" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
        </div>
        <div>
          <h2 className="text-[28px] font-bold text-night sm:text-4xl">
            قصتنا مع <span className="text-gradient">البريق</span>
          </h2>
          <div className="mt-5 space-y-4 text-[17px] leading-9 text-muted">
            <p>
              اسم «بريق» يعني اللمعة التي تلفت النظر، وهذا بالضبط ما نصنعه لعملائنا. بدأنا بفكرة بسيطة: أن تحصل الشركات على
              خدمات رقمية متكاملة بجودة عالية من فريق واحد يفهم أعمالها.
            </p>
            <p>
              اليوم نعمل مع علامات تجارية في مجالات مختلفة، نخطط حملاتها ونصمم هوياتها ونطوّر مواقعها وتطبيقاتها، ونرافقها
              بعد الإطلاق لنقيس النتائج ونحسّنها.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-lilac-50/70 py-16 sm:py-20">
        <div className="container-x grid gap-6 md:grid-cols-3">
          {pillars.map(({ Icon, title, body }) => (
            <div key={title} className="card p-8">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-violet text-white">
                <Icon className="size-7" aria-hidden />
              </span>
              <h2 className="mt-5 text-2xl font-bold text-night">{title}</h2>
              <p className="mt-3 text-[16px] leading-8 text-muted">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x py-16 sm:py-20">
        <h2 className="text-center text-[28px] font-bold text-night sm:text-4xl">
          قيمنا <span className="text-gradient">في العمل</span>
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {values.map((v, i) => (
            <div key={v.title} className="rounded-[24px] border border-line p-7">
              <span className="text-4xl font-bold text-lilac" dir="ltr">
                0{i + 1}
              </span>
              <h3 className="mt-3 text-xl font-bold text-night">{v.title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-muted">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-night py-16 text-white sm:py-20">
        <div className="container-x">
          <h2 className="text-[28px] font-bold sm:text-4xl">طريقتنا في العمل</h2>
          <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((s, i) => (
              <li key={s.title} className="border-t border-white/15 pt-6">
                <span className="text-sm font-semibold text-lilac">الخطوة {i + 1}</span>
                <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-white/75">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="container-x pt-16 sm:pt-20">
        <h2 className="text-[28px] font-bold text-night sm:text-4xl">ماذا نقدم</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} />
          ))}
        </div>
      </section>

      <CtaBand title="لنتعرّف على مشروعك" />
    </>
  );
}
