import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Check, Mail, Sparkles } from "lucide-react";
import { getPosts, getProjects, getServices } from "@/lib/data";
import { getProcessSteps, getValues } from "@/lib/content";
import { site, whatsappLink } from "@/lib/site";
import { getDict, href, isLang, type Lang } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { CtaBand, PostCard, ProjectCard, SectionHeading, ServiceCard } from "@/components/site/parts";
import { ContactForm } from "@/components/forms/ContactForm";
import { ForwardArrow, WhatsAppIcon } from "@/components/icons";
import { Hero } from "@/components/site/hero/Hero";
import { AboutArt } from "@/components/art/AboutArt";
import { Reveal } from "@/components/motion/Reveal";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await props.params;
  const l: Lang = isLang(lang) ? lang : "ar";
  const t = getDict(l).meta;
  return { ...pageMeta(l, "/", t.title, t.description), title: { absolute: t.title } };
}

export default async function HomePage(props: PageProps<"/[lang]">) {
  const { lang: raw } = await props.params;
  const lang: Lang = isLang(raw) ? raw : "ar";
  const t = getDict(lang);
  const h = t.home;
  const [services, projects, posts] = await Promise.all([getServices(lang), getProjects({ lang, limit: 4 }), getPosts(lang, 3)]);
  const wa = whatsappLink(t.wa.general);
  const values = getValues(lang);

  return (
    <>
      <Hero lang={lang} servicesCount={services.length} />

      {/* Skills marquee */}
      <section aria-label={h.skillsAria} className="overflow-hidden bg-night py-5 text-white" dir="rtl">
        <div className="animate-marquee flex w-max gap-3">
          {[...h.skills, ...h.skills].map((s, i) => (
            <span
              key={i}
              aria-hidden={i >= h.skills.length}
              dir={lang === "ar" ? "rtl" : "ltr"}
              className="flex items-center gap-3 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[15px] font-medium"
            >
              <Sparkles className="size-4 text-lilac" aria-hidden />
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="container-x py-20 sm:py-24" aria-labelledby="services-title">
        <Reveal className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="eyebrow">{h.servicesEyebrow}</span>
            <h2 id="services-title" className="mt-4 text-[28px] font-bold text-ink sm:text-4xl">
              {h.servicesTitle} <span className="text-gradient">{h.servicesHighlight}</span>
            </h2>
            <p className="mt-4 text-[17px] leading-8 text-muted">{h.servicesIntro}</p>
          </div>
          <Link href={href(lang, "/services")} className="btn btn-outline shrink-0">
            {t.common.allServices}
            <ForwardArrow className="size-4" />
          </Link>
        </Reveal>
        <Reveal variant="stagger" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i} lang={lang} />
          ))}
        </Reveal>
      </section>

      {/* About */}
      <section className="bg-tint/70 py-20 sm:py-24" aria-labelledby="about-title">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <Reveal className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-night shadow-[var(--shadow-lift)]">
              <AboutArt />
            </div>
            <div className="absolute -bottom-6 end-6 rounded-2xl bg-violet px-6 py-4 text-white shadow-[var(--shadow-lift)]">
              <p className="text-sm text-white/80">{h.sloganLabel}</p>
              <p className="text-lg font-bold">{t.brand.slogan}</p>
            </div>
          </Reveal>
          <Reveal>
            <span className="eyebrow">{h.aboutEyebrow}</span>
            <h2 id="about-title" className="mt-4 text-[28px] font-bold text-ink sm:text-4xl">
              {h.aboutTitle} <span className="text-gradient">{h.aboutHighlight}</span>
            </h2>
            <p className="mt-5 text-[17px] leading-9 text-muted">{h.aboutBody}</p>
            <Reveal as="ul" variant="stagger" className="mt-8 grid gap-4 sm:grid-cols-2">
              {values.map((v) => (
                <li key={v.title} className="flex gap-3">
                  <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-violet text-white">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{v.title}</p>
                    <p className="text-[15px] leading-7 text-muted">{v.body}</p>
                  </div>
                </li>
              ))}
            </Reveal>
            <Link href={href(lang, "/about")} className="btn btn-dark mt-9">
              {h.aboutMore}
              <ForwardArrow className="size-4" />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* Process */}
      <section className="container-x py-20 sm:py-24" aria-labelledby="process-title">
        <Reveal>
          <SectionHeading eyebrow={h.processEyebrow} title={h.processTitle} highlight={h.processHighlight} />
        </Reveal>
        <Reveal as="ol" variant="stagger" className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {getProcessSteps(lang).map((step, i) => (
            <li key={step.title} className="card group relative p-7 transition-[translate,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]">
              <span className="icon-wiggle inline-block text-5xl font-bold text-lilac" dir="ltr">
                0{i + 1}
              </span>
              <h3 className="mt-4 text-xl font-bold text-ink">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-muted">{step.body}</p>
            </li>
          ))}
        </Reveal>
      </section>

      {/* Portfolio */}
      {projects.length > 0 && (
        <section className="bg-tint/70 py-20 sm:py-24" aria-labelledby="work-title">
          <div className="container-x">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <span className="eyebrow">{h.workEyebrow}</span>
                <h2 id="work-title" className="mt-4 text-[28px] font-bold text-ink sm:text-4xl">
                  {h.workTitle} <span className="text-gradient">{h.workHighlight}</span>
                </h2>
              </div>
              <Link href={href(lang, "/portfolio")} className="btn btn-outline shrink-0">
                {t.common.allWork}
                <ForwardArrow className="size-4" />
              </Link>
            </div>
            <Reveal variant="stagger" className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} large lang={lang} />
              ))}
            </Reveal>
          </div>
        </section>
      )}

      <CtaBand lang={lang} />

      {/* Blog */}
      {posts.length > 0 && (
        <section className="container-x pb-20 sm:pb-24" aria-labelledby="blog-title">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="eyebrow">{h.blogEyebrow}</span>
              <h2 id="blog-title" className="mt-4 text-[28px] font-bold text-ink sm:text-4xl">
                {h.blogTitle} <span className="text-gradient">{h.blogHighlight}</span>
              </h2>
            </div>
            <Link href={href(lang, "/blog")} className="btn btn-outline shrink-0">
              {t.common.allPosts}
              <ForwardArrow className="size-4" />
            </Link>
          </div>
          <Reveal variant="stagger" className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} lang={lang} />
            ))}
          </Reveal>
        </section>
      )}

      {/* Contact */}
      <section className="bg-tint/70 py-20 sm:py-24" aria-labelledby="contact-title">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <Reveal>
            <span className="eyebrow">{h.contactEyebrow}</span>
            <h2 id="contact-title" className="mt-4 text-[28px] font-bold text-ink sm:text-4xl">
              {h.contactTitle} <span className="text-gradient">{h.contactHighlight}</span>
            </h2>
            <p className="mt-4 text-[17px] leading-8 text-muted">{h.contactIntro}</p>
            <Reveal variant="stagger" className="mt-8 space-y-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-4 transition-colors hover:border-whatsapp-dark">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-whatsapp-dark text-white">
                    <WhatsAppIcon className="size-6" />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{h.waCard}</p>
                    <p className="text-sm text-muted">{h.waCardSub}</p>
                  </div>
                </a>
              )}
              {site.email && (
                <a href={`mailto:${site.email}`} className="card flex items-center gap-4 p-4 transition-colors hover:border-accent">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-tint text-accent">
                    <Mail className="size-6" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{h.emailCard}</p>
                    <p className="text-sm text-muted">{site.email}</p>
                  </div>
                </a>
              )}
              <Link href={href(lang, "/booking")} className="card flex items-center gap-4 p-4 transition-colors hover:border-accent">
                <span className="flex size-12 items-center justify-center rounded-xl bg-violet text-white">
                  <CalendarCheck className="size-6" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-ink">{h.consultCard}</p>
                  <p className="text-sm text-muted">{h.consultCardSub}</p>
                </div>
              </Link>
            </Reveal>
          </Reveal>
          <Reveal className="card p-6 sm:p-8">
            <ContactForm lang={lang} />
          </Reveal>
        </div>
      </section>
    </>
  );
}
