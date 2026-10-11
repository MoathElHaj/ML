import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock } from "lucide-react";
import { getPost, getPosts } from "@/lib/data";
import { site, whatsappLink } from "@/lib/site";
import { formatDate, readingMinutes } from "@/lib/utils";
import { Prose } from "@/components/Prose";
import { CtaBand, PostCard } from "@/components/site/parts";
import { WhatsAppIcon, XIcon, LinkedInIcon } from "@/components/icons";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/blog/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      publishedTime: post.published_at ?? undefined,
      images: [post.cover_url || "/images/blog-default.jpg"],
    },
  };
}

export default async function PostPage(props: PageProps<"/blog/[slug]">) {
  const { slug } = await props.params;
  const post = await getPost(slug);
  if (!post) notFound();
  const more = (await getPosts(4)).filter((p) => p.id !== post.id).slice(0, 3);

  const url = `${site.url}/blog/${post.slug}`;
  const shares = [
    { label: "شارك عبر واتساب", href: `https://wa.me/?text=${encodeURIComponent(`${post.title}\n${url}`)}`, Icon: WhatsAppIcon },
    { label: "شارك على إكس", href: `https://x.com/intent/post?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(url)}`, Icon: XIcon },
    { label: "شارك على لينكدإن", href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, Icon: LinkedInIcon },
  ];
  const wa = whatsappLink(`مرحباً بريق، قرأت مقال «${post.title}» وأود الاستفسار`);

  return (
    <>
      <article>
        <header className="hero-glow relative -mt-[72px] pt-[72px]">
          <div className="container-x max-w-4xl py-12 text-center sm:py-16">
            <nav aria-label="مسار التنقل" className="text-sm text-muted">
              <Link href="/blog" className="hover:text-violet">
                المدونة
              </Link>
              {post.category && (
                <>
                  <span className="mx-2" aria-hidden>/</span>
                  <span>{post.category}</span>
                </>
              )}
            </nav>
            <h1 className="mt-5 text-[32px] font-bold leading-[1.45] text-night sm:text-[44px]">{post.title}</h1>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-[15px] text-muted">
              <span className="font-semibold text-night">{post.author_name}</span>
              <span aria-hidden>·</span>
              <time dateTime={post.published_at ?? post.created_at}>{formatDate(post.published_at ?? post.created_at)}</time>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="size-4" aria-hidden />
                {readingMinutes(post.content)} دقائق قراءة
              </span>
            </div>
          </div>
        </header>
        <div className="container-x max-w-5xl">
          <div className="relative aspect-[16/8] overflow-hidden rounded-[32px] bg-lilac-50">
            <Image src={post.cover_url || "/images/blog-default.jpg"} alt="" fill priority sizes="(min-width: 1024px) 1000px, 100vw" className="object-cover" />
          </div>
        </div>
        <div className="container-x max-w-3xl py-12">
          {post.excerpt && <p className="mb-8 text-xl leading-10 font-medium text-deep">{post.excerpt}</p>}
          <Prose text={post.content} />
          <div className="mt-12 flex flex-col gap-6 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-night">شارك المقال:</span>
              {shares.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex size-10 items-center justify-center rounded-full border border-line text-night transition-colors hover:border-violet hover:text-violet"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm">
                <WhatsAppIcon className="size-4" />
                لديك سؤال؟ راسلنا
              </a>
            )}
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="bg-lilac-50/70 py-16">
          <div className="container-x">
            <h2 className="text-[28px] font-bold text-night">مقالات أخرى</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
      <CtaBand />
    </>
  );
}
