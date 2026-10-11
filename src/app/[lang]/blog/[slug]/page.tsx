import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock } from "lucide-react";
import { getPost, getPosts, hasEnglish } from "@/lib/data";
import { site, whatsappLink } from "@/lib/site";
import { getDict, href, langFrom } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { formatDate, readingMinutes } from "@/lib/utils";
import { Prose } from "@/components/Prose";
import { CtaBand, PostCard } from "@/components/site/parts";
import { LinkedInIcon, WhatsAppIcon, XIcon } from "@/components/icons";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/[lang]/blog/[slug]">): Promise<Metadata> {
  const lang = await langFrom(props.params);
  const { slug } = await props.params;
  const post = await getPost(slug, lang);
  if (!post) return {};
  return {
    ...pageMeta(lang, `/blog/${slug}`, post.title, post.excerpt),
    openGraph: { type: "article", publishedTime: post.published_at ?? undefined, images: [post.cover_url || "/images/blog-default.jpg"] },
  };
}

export default async function PostPage(props: PageProps<"/[lang]/blog/[slug]">) {
  const lang = await langFrom(props.params);
  const { slug } = await props.params;
  const t = getDict(lang);
  const post = await getPost(slug, lang);
  if (!post) notFound();
  // No English version yet: send English readers to the Arabic article.
  if (lang === "en" && !hasEnglish(post)) redirect(href("ar", `/blog/${slug}`));

  const more = (await getPosts(lang, 4)).filter((p) => p.id !== post.id).slice(0, 3);
  const url = `${site.url}${href(lang, `/blog/${post.slug}`)}`;
  const date = post.published_at ?? post.created_at;
  const shares = [
    { label: t.blog.shareWhatsapp, link: `https://wa.me/?text=${encodeURIComponent(`${post.title}\n${url}`)}`, Icon: WhatsAppIcon },
    { label: t.blog.shareX, link: `https://x.com/intent/post?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`, Icon: XIcon },
    { label: t.blog.shareLinkedin, link: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, Icon: LinkedInIcon },
  ];
  const wa = whatsappLink(t.wa.post(post.title));
  const author = lang === "en" && post.author_name === "فريق بريق" ? t.blog.defaultAuthor : post.author_name;

  return (
    <>
      <article>
        <header className="hero-glow relative -mt-[72px] pt-[72px]">
          <div className="container-x max-w-4xl py-12 text-center sm:py-16">
            <nav aria-label={t.nav.breadcrumb} className="text-sm text-muted">
              <Link href={href(lang, "/blog")} className="hover:text-accent">
                {t.nav.blog}
              </Link>
              {post.category && (
                <>
                  <span className="mx-2" aria-hidden>
                    /
                  </span>
                  <span>{post.category}</span>
                </>
              )}
            </nav>
            <h1 className="mt-5 text-[32px] font-bold leading-[1.45] text-ink sm:text-[44px]">{post.title}</h1>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[15px] text-muted">
              <span className="font-semibold text-ink">{author}</span>
              <span aria-hidden>·</span>
              <time dateTime={date}>{formatDate(date, lang)}</time>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" aria-hidden />
                {t.common.readMinutesLong(readingMinutes(post.content))}
              </span>
            </div>
          </div>
        </header>
        <div className="container-x max-w-5xl">
          <div className="relative aspect-[16/8] overflow-hidden rounded-[32px] bg-tint">
            <Image src={post.cover_url || "/images/blog-default.jpg"} alt="" fill priority sizes="(min-width: 1024px) 1000px, 100vw" className="object-cover" />
          </div>
        </div>
        <div className="container-x max-w-3xl py-12">
          {post.excerpt && <p className="mb-8 text-xl font-medium leading-10 text-ink">{post.excerpt}</p>}
          <Prose text={post.content} />
          <div className="mt-12 flex flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink">{t.blog.share}</span>
              {shares.map(({ label, link, Icon }) => (
                <a
                  key={label}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-full border border-line text-ink transition-colors hover:border-accent hover:text-accent"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm">
                <WhatsAppIcon className="size-4" />
                {t.blog.question}
              </a>
            )}
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="bg-tint/70 py-16">
          <div className="container-x">
            <h2 className="text-[28px] font-bold text-ink">{t.blog.more}</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => (
                <PostCard key={p.id} post={p} lang={lang} />
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaBand lang={lang} />
    </>
  );
}
