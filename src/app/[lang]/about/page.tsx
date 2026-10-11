import type { Metadata } from "next";
import { Eye, Gem, Target } from "lucide-react";
import { getServices } from "@/lib/data";
import { getProcessSteps, getValues } from "@/lib/content";
import { getDict, langFrom } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { CtaBand, PageHero, ServiceCard } from "@/components/site/parts";
import { Reveal } from "@/components/motion/Reveal";
import { AboutArt } from "@/components/art/AboutArt";

export const revalidate = 60;

const pillarIcons = [Eye, Target, Gem];

export async function generateMetadata(props: PageProps<"/[lang]/about">): Promise<Metadata> {
  const lang = await langFrom(props.params);
  const t = getDict(lang).about;
  return pageMeta(lang, "/about", t.metaTitle, t.metaDescription);
}

export default async function AboutPage(props: PageProps<"/[lang]/about">) {
  const lang = await langFrom(props.params);
  const t = getDict(lang).about;
  const services = await getServices(lang);
  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} intro={t.intro} />

      <Reveal as="section" variant="stagger" className="container-x grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-night shadow-[var(--shadow-lift)]">
          <AboutArt />
        </div>
        <div>
          <h2 className="text-[28px] font-bold text-ink sm:text-4xl">
            {t.storyTitle} <span className="text-gradient">{t.storyHighlight}</span>
          </h2>
          <div className="mt-5 space-y-4 text-[17px] leading-9 text-muted">
            {t.story.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>
      </Reveal>

      <section className="bg-tint/70 py-16 sm:py-20">
        <Reveal variant="stagger" className="container-x grid gap-6 md:grid-cols-3">
          {t.pillars.map(({ title, body }, i) => {
            const Icon = pillarIcons[i];
            return (
              <div key={title} className="card group p-8">
                <span className="icon-wiggle flex size-14 items-center justify-center rounded-2xl bg-violet text-white">
                  <Icon className="size-7" aria-hidden />
                </span>
                <h2 className="mt-5 text-2xl font-bold text-ink">{title}</h2>
                <p className="mt-3 text-[16px] leading-8 text-muted">{body}</p>
              </div>
            );
          })}
        </Reveal>
      </section>

      <section className="container-x py-16 sm:py-20">
        <h2 className="text-center text-[28px] font-bold text-ink sm:text-4xl">
          {t.valuesTitle} <span className="text-gradient">{t.valuesHighlight}</span>
        </h2>
        <Reveal variant="stagger" className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {getValues(lang).map((v, i) => (
            <div key={v.title} className="rounded-[24px] border border-line p-7">
              <span className="text-4xl font-bold text-lilac" dir="ltr">
                0{i + 1}
              </span>
              <h3 className="mt-3 text-xl font-bold text-ink">{v.title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-muted">{v.body}</p>
            </div>
          ))}
        </Reveal>
      </section>

      <section className="bg-night py-16 text-white sm:py-20">
        <div className="container-x">
          <h2 className="text-[28px] font-bold sm:text-4xl">{t.processTitle}</h2>
          <Reveal as="ol" variant="stagger" className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {getProcessSteps(lang).map((s, i) => (
              <li key={s.title} className="border-t border-white/15 pt-6">
                <span className="text-sm font-semibold text-lilac">{t.step(i + 1)}</span>
                <h3 className="mt-2 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-[15px] leading-7 text-white/75">{s.body}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      <section className="container-x pt-16 sm:pt-20">
        <h2 className="text-[28px] font-bold text-ink sm:text-4xl">{t.offer}</h2>
        <Reveal variant="stagger" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <ServiceCard key={s.id} service={s} lang={lang} />
          ))}
        </Reveal>
      </section>

      <CtaBand lang={lang} title={t.ctaTitle} />
    </>
  );
}
