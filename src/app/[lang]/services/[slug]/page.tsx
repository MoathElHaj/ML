import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck, Check } from "lucide-react";
import { getProjects, getService, getServices } from "@/lib/data";
import { whatsappLink } from "@/lib/site";
import { getProcessSteps } from "@/lib/content";
import { getDict, href, langFrom, locales } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { CtaBand, ProjectCard, ServiceCard } from "@/components/site/parts";
import { ForwardArrow, ServiceIcon, WhatsAppIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/Reveal";

export const revalidate = 60;

export async function generateStaticParams() {
  const services = await getServices();
  return locales.flatMap((lang) => services.map((s) => ({ lang, slug: s.slug })));
}

export async function generateMetadata(props: PageProps<"/[lang]/services/[slug]">): Promise<Metadata> {
  const lang = await langFrom(props.params);
  const { slug } = await props.params;
  const service = await getService(slug, lang);
  if (!service) return {};
  return pageMeta(lang, `/services/${slug}`, service.title, service.summary, service.image_url);
}

export default async function ServicePage(props: PageProps<"/[lang]/services/[slug]">) {
  const lang = await langFrom(props.params);
  const { slug } = await props.params;
  const t = getDict(lang);
  const service = await getService(slug, lang);
  if (!service) notFound();

  const isRealId = !service.id.startsWith("default-");
  const [projects, all] = await Promise.all([
    isRealId ? getProjects({ lang, serviceId: service.id, limit: 4 }) : Promise.resolve([]),
    getServices(lang),
  ]);
  const others = all.filter((s) => s.slug !== service.slug).slice(0, 3);
  const wa = whatsappLink(t.wa.service(service.title));

  return (
    <>
      <section className="hero-glow relative -mt-[72px] overflow-hidden pt-[72px]">
        <div className="container-x grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <nav aria-label={t.nav.breadcrumb} className="text-sm text-muted">
              <Link href={href(lang, "/services")} className="hover:text-accent">
                {t.nav.services}
              </Link>
              <span className="mx-2" aria-hidden>
                /
              </span>
              <span className="text-ink">{service.title}</span>
            </nav>
            <span className="mt-6 flex size-14 items-center justify-center rounded-2xl bg-violet text-white">
              <ServiceIcon name={service.icon} className="size-7" aria-hidden />
            </span>
            <h1 className="mt-5 text-4xl font-bold text-ink sm:text-5xl">{service.title}</h1>
            <p className="mt-5 text-lg leading-9 text-muted">{service.description || service.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={href(lang, `/booking?service=${service.slug}`)} className="btn btn-primary">
                <CalendarCheck className="size-5" aria-hidden />
                {t.nav.book}
              </Link>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <WhatsAppIcon className="size-5" />
                  {t.services.askWhatsapp}
                </a>
              )}
            </div>
          </div>
          <div className="relative aspect-[16/11] overflow-hidden rounded-[32px] border-[6px] border-card bg-night shadow-[var(--shadow-lift)]">
            {service.image_url && <Image src={service.image_url} alt="" fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />}
          </div>
        </div>
      </section>

      {service.features.length > 0 && (
        <section className="container-x py-16 sm:py-20">
          <h2 className="text-[28px] font-bold text-ink sm:text-3xl">{t.services.includes}</h2>
          <Reveal as="ul" variant="stagger" className="mt-8 grid gap-4 sm:grid-cols-2">
            {service.features.map((f) => (
              <li key={f} className="card flex items-center gap-4 p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint text-accent">
                  <Check className="size-5" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="text-[17px] font-semibold text-ink">{f}</span>
              </li>
            ))}
          </Reveal>
        </section>
      )}

      <section className="bg-tint/70 py-16 sm:py-20">
        <div className="container-x">
          <h2 className="text-[28px] font-bold text-ink sm:text-3xl">{t.services.howWeWork}</h2>
          <Reveal as="ol" variant="stagger" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {getProcessSteps(lang).map((step, i) => (
              <li key={step.title} className="card p-6">
                <span className="text-4xl font-bold text-lilac" dir="ltr">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-lg font-bold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-[15px] leading-7 text-muted">{step.body}</p>
              </li>
            ))}
          </Reveal>
        </div>
      </section>

      {projects.length > 0 && (
        <section className="container-x py-16 sm:py-20">
          <h2 className="text-[28px] font-bold text-ink sm:text-3xl">{t.services.workIn(service.title)}</h2>
          <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} lang={lang} />
            ))}
          </div>
        </section>
      )}

      <CtaBand lang={lang} />

      {others.length > 0 && (
        <section className="container-x pb-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[28px] font-bold text-ink sm:text-3xl">{t.services.others}</h2>
            <Link href={href(lang, "/services")} className="inline-flex items-center gap-2 font-semibold text-accent">
              {t.common.allServices} <ForwardArrow className="size-4" />
            </Link>
          </div>
          <Reveal variant="stagger" className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s) => (
              <ServiceCard key={s.id} service={s} lang={lang} />
            ))}
          </Reveal>
        </section>
      )}
    </>
  );
}
