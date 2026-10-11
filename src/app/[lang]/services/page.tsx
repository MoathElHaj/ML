import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { getServices } from "@/lib/data";
import { getDict, href, langFrom } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { CtaBand, PageHero } from "@/components/site/parts";
import { ForwardArrow, ServiceIcon } from "@/components/icons";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/[lang]/services">): Promise<Metadata> {
  const lang = await langFrom(props.params);
  const t = getDict(lang).services;
  return pageMeta(lang, "/services", t.metaTitle, t.metaDescription);
}

export default async function ServicesPage(props: PageProps<"/[lang]/services">) {
  const lang = await langFrom(props.params);
  const t = getDict(lang);
  const services = await getServices(lang);
  return (
    <>
      <PageHero eyebrow={t.services.eyebrow} title={t.services.title} intro={t.services.intro} />
      <section className="container-x space-y-20 py-16 sm:py-20">
        {services.map((s, i) => (
          <article key={s.id} id={s.slug} className="grid scroll-mt-28 items-center gap-10 lg:grid-cols-2">
            <div className={i % 2 === 1 ? "lg:order-2" : undefined}>
              <div className="relative aspect-[16/11] overflow-hidden rounded-[32px] bg-night shadow-[var(--shadow-soft)]">
                {s.image_url && <Image src={s.image_url} alt="" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />}
              </div>
            </div>
            <div>
              <span className="flex size-14 items-center justify-center rounded-2xl bg-tint text-accent">
                <ServiceIcon name={s.icon} className="size-7" aria-hidden />
              </span>
              <h2 className="mt-5 text-3xl font-bold text-ink">{s.title}</h2>
              <p className="mt-4 text-[17px] leading-9 text-muted">{s.description || s.summary}</p>
              {s.features.length > 0 && (
                <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[15px] text-ink">
                      <span className="mt-1 flex size-5 shrink-0 items-center justify-center rounded-full bg-violet text-white">
                        <Check className="size-3" strokeWidth={3} aria-hidden />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={href(lang, `/services/${s.slug}`)} className="btn btn-dark">
                  {t.common.serviceDetails}
                  <ForwardArrow className="size-4" />
                </Link>
                <Link href={href(lang, `/booking?service=${s.slug}`)} className="btn btn-outline">
                  {t.common.bookConsult}
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
      <CtaBand lang={lang} title={t.services.ctaTitle} body={t.services.ctaBody} />
    </>
  );
}
