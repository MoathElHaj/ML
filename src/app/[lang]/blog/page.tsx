import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getPosts } from "@/lib/data";
import { getDict, href, langFrom } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { CtaBand, EmptyState, PageHero, PostCard } from "@/components/site/parts";
import { ForwardArrow, nudge } from "@/components/icons";
import { cn, formatDate, readingMinutes } from "@/lib/utils";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/[lang]/blog">): Promise<Metadata> {
  const lang = await langFrom(props.params);
  const t = getDict(lang).blog;
  return pageMeta(lang, "/blog", t.metaTitle, t.metaDescription);
}

export default async function BlogPage(props: PageProps<"/[lang]/blog">) {
  const lang = await langFrom(props.params);
  const t = getDict(lang);
  const posts = await getPosts(lang);
  const [featured, ...rest] = posts;

  return (
    <>
      <PageHero eyebrow={t.blog.eyebrow} title={t.blog.title} intro={t.blog.intro} />
      <section className="container-x py-14 sm:py-16">
        {!featured ? (
          <EmptyState
            title={t.blog.empty}
            body={t.blog.emptyBody}
            action={
              lang === "en" ? (
                <a href={href("ar", "/blog")} hrefLang="ar" className="btn btn-outline">
                  {t.blog.otherLang}
                </a>
              ) : undefined
            }
          />
        ) : (
          <>
            <Link href={href(lang, `/blog/${featured.slug}`)} className="card group grid overflow-hidden lg:grid-cols-2">
              <div className="relative aspect-[16/10] bg-tint lg:aspect-auto lg:min-h-[340px]">
                <Image
                  src={featured.cover_url || "/images/blog-default.jpg"}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 1024px) 580px, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col justify-center p-7 sm:p-10">
                <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
                  <span className="eyebrow !py-1">{t.blog.latest}</span>
                  {featured.category && <span>{featured.category}</span>}
                  <span aria-hidden>·</span>
                  <time dateTime={featured.published_at ?? featured.created_at}>{formatDate(featured.published_at ?? featured.created_at, lang)}</time>
                </div>
                <h2 className="mt-4 text-2xl font-bold leading-[1.5] text-ink transition-colors group-hover:text-accent sm:text-3xl">{featured.title}</h2>
                {featured.excerpt && <p className="mt-3 line-clamp-3 text-[16px] leading-8 text-muted">{featured.excerpt}</p>}
                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-accent">
                  {t.blog.read} · {t.common.readMinutes(readingMinutes(featured.content))}
                  <ForwardArrow className={cn("size-4", nudge)} />
                </span>
              </div>
            </Link>
            {rest.length > 0 && (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <PostCard key={p.id} post={p} lang={lang} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <CtaBand lang={lang} />
    </>
  );
}
