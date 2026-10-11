import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getProject } from "@/lib/data";
import { getDict, href, langFrom } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { Prose } from "@/components/Prose";
import { CtaBand } from "@/components/site/parts";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbSchema, projectSchema } from "@/lib/schema";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/[lang]/portfolio/[slug]">): Promise<Metadata> {
  const lang = await langFrom(props.params);
  const { slug } = await props.params;
  const project = await getProject(slug, lang);
  if (!project) return {};
  return pageMeta(lang, `/portfolio/${slug}`, project.title, project.summary, project.cover_url);
}

export default async function ProjectPage(props: PageProps<"/[lang]/portfolio/[slug]">) {
  const lang = await langFrom(props.params);
  const { slug } = await props.params;
  const t = getDict(lang);
  const project = await getProject(slug, lang);
  if (!project) notFound();

  return (
    <>
      <JsonLd
        data={[
          projectSchema(lang, project),
          breadcrumbSchema([
            { name: t.nav.home, path: href(lang, "/") },
            { name: t.nav.portfolio, path: href(lang, "/portfolio") },
            { name: project.title, path: href(lang, `/portfolio/${project.slug}`) },
          ]),
        ]}
      />
      <section className="hero-glow relative -mt-[72px] pt-[72px]">
        <div className="container-x py-12 sm:py-16">
          <nav aria-label={t.nav.breadcrumb} className="text-sm text-muted">
            <Link href={href(lang, "/portfolio")} className="hover:text-accent">
              {t.nav.portfolio}
            </Link>
            <span className="mx-2" aria-hidden>
              /
            </span>
            <span className="text-ink">{project.title}</span>
          </nav>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold text-ink sm:text-5xl">{project.title}</h1>
          {project.summary && <p className="mt-4 max-w-2xl text-lg leading-9 text-muted">{project.summary}</p>}
          <dl className="mt-8 flex flex-wrap gap-3">
            {project.client && (
              <div className="card px-5 py-3">
                <dt className="text-xs text-muted">{t.portfolio.client}</dt>
                <dd className="font-semibold text-ink">{project.client}</dd>
              </div>
            )}
            {project.services?.title && (
              <div className="card px-5 py-3">
                <dt className="text-xs text-muted">{t.portfolio.service}</dt>
                <dd className="font-semibold text-ink">
                  <Link href={href(lang, `/services/${project.services.slug}`)} className="hover:text-accent">
                    {project.services.title}
                  </Link>
                </dd>
              </div>
            )}
            {project.tags.length > 0 && (
              <div className="card px-5 py-3">
                <dt className="text-xs text-muted">{t.portfolio.field}</dt>
                <dd className="font-semibold text-ink">{project.tags.join(lang === "ar" ? "، " : ", ")}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <section className="container-x pb-8">
        {project.cover_url && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-[32px] bg-tint shadow-[var(--shadow-soft)]">
            <Image src={project.cover_url} alt={project.title} fill priority sizes="(min-width: 1200px) 1150px, 100vw" className="object-cover" />
          </div>
        )}
        <div className="mx-auto mt-12 max-w-3xl">
          {project.description && <Prose text={project.description} />}
          {project.link_url && (
            <a href={project.link_url} target="_blank" rel="noopener noreferrer" className="btn btn-dark mt-4">
              {t.portfolio.visit}
              <ExternalLink className="size-4" aria-hidden />
            </a>
          )}
        </div>
      </section>
      <CtaBand lang={lang} title={t.portfolio.similar} />
    </>
  );
}
