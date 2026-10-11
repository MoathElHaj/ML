import type { Metadata } from "next";
import Link from "next/link";
import { getProjects, getServices } from "@/lib/data";
import { getDict, href, langFrom } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { CtaBand, EmptyState, PageHero, ProjectCard } from "@/components/site/parts";
import { cn } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/[lang]/portfolio">): Promise<Metadata> {
  const lang = await langFrom(props.params);
  const t = getDict(lang).portfolio;
  return pageMeta(lang, "/portfolio", t.metaTitle, t.metaDescription);
}

export default async function PortfolioPage(props: PageProps<"/[lang]/portfolio">) {
  const lang = await langFrom(props.params);
  const t = getDict(lang);
  const { service } = await props.searchParams;
  const filter = typeof service === "string" ? service : "";
  const [projects, services] = await Promise.all([getProjects({ lang }), getServices(lang)]);
  const shown = filter ? projects.filter((p) => p.services?.slug === filter) : projects;

  return (
    <>
      <PageHero eyebrow={t.portfolio.eyebrow} title={t.portfolio.title} intro={t.portfolio.intro} />
      <section className="container-x py-14 sm:py-16">
        {projects.length > 0 && (
          <nav aria-label={t.portfolio.filterAria} className="-mx-1 mb-10 flex gap-2 overflow-x-auto px-1 pb-1">
            {[{ slug: "", title: t.portfolio.all }, ...services].map((s) => (
              <Link
                key={s.slug}
                href={href(lang, s.slug ? `/portfolio?service=${s.slug}` : "/portfolio")}
                scroll={false}
                aria-current={filter === s.slug ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full border-[1.5px] px-5 py-2.5 text-[15px] font-semibold transition-colors",
                  filter === s.slug ? "border-violet bg-violet text-white" : "border-line bg-card text-ink hover:border-accent",
                )}
              >
                {s.title}
              </Link>
            ))}
          </nav>
        )}
        {shown.length > 0 ? (
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => (
              <ProjectCard key={p.id} project={p} lang={lang} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={filter ? t.portfolio.emptyFiltered : t.portfolio.empty}
            body={t.portfolio.emptyBody}
            action={
              <Link href={href(lang, "/booking")} className="btn btn-primary">
                {t.nav.book}
              </Link>
            }
          />
        )}
      </section>
      <CtaBand lang={lang} title={t.portfolio.ctaTitle} />
    </>
  );
}
