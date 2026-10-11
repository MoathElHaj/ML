import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Check, Sparkles } from "lucide-react";
import { getServices } from "@/lib/data";
import { getMarketingPackages } from "@/lib/content";
import { whatsappLink } from "@/lib/site";
import { getDict, href, langFrom } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { PageHero } from "@/components/site/parts";
import { ForwardArrow, ServiceIcon, WhatsAppIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/Reveal";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/[lang]/pricing">): Promise<Metadata> {
  const lang = await langFrom(props.params);
  const t = getDict(lang).pricing;
  return pageMeta(lang, "/pricing", t.metaTitle, t.metaDescription);
}

export default async function PricingPage(props: PageProps<"/[lang]/pricing">) {
  const lang = await langFrom(props.params);
  const t = getDict(lang);
  const p = t.pricing;
  const services = await getServices(lang);
  const quoteServices = services.filter((s) => s.slug !== "digital-marketing");

  return (
    <>
      <PageHero eyebrow={p.eyebrow} title={p.title} intro={p.intro} />

      <section className="container-x pb-20 pt-6 sm:pb-24" aria-labelledby="packages-title">
        <h2 id="packages-title" className="sr-only">
          {p.packagesSr}
        </h2>
        <Reveal variant="stagger" className="grid items-stretch gap-6 lg:grid-cols-3 lg:gap-5">
          {getMarketingPackages(lang).map((pkg) => {
            const wa = whatsappLink(t.wa.package(pkg.name, pkg.price));
            const link = wa ?? href(lang, "/booking?service=digital-marketing");
            return (
              <article
                key={pkg.id}
                className={cn(
                  "relative flex flex-col rounded-[28px] p-7 transition-[translate,box-shadow] duration-300 hover:-translate-y-1.5 sm:p-8",
                  pkg.featured
                    ? "animate-glow bg-night text-white ring-2 ring-violet motion-reduce:animate-none lg:-my-4 lg:py-12 dark:bg-deep"
                    : "border border-line bg-card text-ink shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-lift)]",
                )}
              >
                {pkg.featured && (
                  <span className="absolute inset-x-0 -top-4 mx-auto flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full bg-violet px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                    <Sparkles className="size-4" aria-hidden />
                    {p.popular}
                  </span>
                )}
                <h3 className="text-2xl font-bold">{pkg.name}</h3>
                <p className={cn("mt-2 min-h-14 text-[15px] leading-7", pkg.featured ? "text-white/75" : "text-muted")}>{pkg.tagline}</p>

                <p className="mt-6 flex items-baseline gap-2">
                  <span className="text-5xl font-bold tracking-tight">{pkg.price}</span>
                  <span className={cn("text-[15px]", pkg.featured ? "text-white/75" : "text-muted")}>{p.perMonth}</span>
                </p>

                <div className={cn("my-7 h-px", pkg.featured ? "bg-white/15" : "bg-line")} />

                <ul className="flex-1 space-y-3.5">
                  {pkg.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-[15px] leading-7">
                      <span
                        className={cn(
                          "mt-1 flex size-5 shrink-0 items-center justify-center rounded-full",
                          pkg.featured ? "bg-lilac text-night" : "bg-tint text-accent",
                        )}
                      >
                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href={link}
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
        </Reveal>
        <p className="mt-10 text-center text-[15px] text-muted">
          {p.unsure}{" "}
          <Link href={href(lang, "/booking?service=digital-marketing")} className="font-semibold text-accent underline-offset-4 hover:underline">
            {p.unsureLink}
          </Link>{" "}
          {p.unsureEnd}
        </p>
      </section>

      <section className="bg-tint/70 py-20 sm:py-24" aria-labelledby="quote-title">
        <div className="container-x">
          <div className="mx-auto max-w-2xl text-center">
            <span className="eyebrow">{p.quoteEyebrow}</span>
            <h2 id="quote-title" className="mt-4 text-[28px] font-bold text-ink sm:text-4xl">
              {p.quoteTitle} <span className="text-gradient">{p.quoteHighlight}</span>
            </h2>
            <p className="mt-4 text-[17px] leading-8 text-muted">{p.quoteIntro}</p>
          </div>

          <Reveal variant="stagger" className="mt-12 grid gap-6 md:grid-cols-3">
            {quoteServices.map((s) => {
              const wa = whatsappLink(t.wa.quote(s.title));
              return (
                <article key={s.id} className="card group flex flex-col p-7">
                  <span className="icon-wiggle flex size-14 items-center justify-center rounded-2xl bg-violet text-white">
                    <ServiceIcon name={s.icon} className="size-7" aria-hidden />
                  </span>
                  <h3 className="mt-5 text-xl font-bold text-ink">{s.title}</h3>
                  <p className="mt-2 flex-1 text-[15px] leading-7 text-muted">{s.summary}</p>
                  <p className="mt-5 text-sm font-semibold text-accent">{p.byScope}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {wa ? (
                      <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm flex-1">
                        <WhatsAppIcon className="size-4" />
                        {p.requestQuote}
                      </a>
                    ) : (
                      <Link href={href(lang, "/contact")} className="btn btn-primary btn-sm flex-1">
                        {p.requestQuote}
                      </Link>
                    )}
                    <Link href={href(lang, `/services/${s.slug}`)} className="btn btn-outline btn-sm">
                      {t.common.details}
                      <ForwardArrow className="size-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </Reveal>

          <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-[28px] bg-night px-6 py-8 text-white ring-1 ring-white/5 sm:flex-row sm:px-10">
            <div>
              <p className="text-xl font-bold">{p.projectTitle}</p>
              <p className="mt-1 text-white/75">{p.projectBody}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href={href(lang, "/contact")} className="btn btn-light">
                {t.nav.contact}
              </Link>
              <Link href={href(lang, "/booking")} className="btn btn-ghost-light">
                <CalendarCheck className="size-5" aria-hidden />
                {t.nav.bookShort}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
