import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getPosts } from "@/lib/data";
import { CtaBand, EmptyState, PageHero, PostCard } from "@/components/site/parts";
import { formatDate, readingMinutes } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "المدونة",
  description: "مقالات ونصائح في التسويق الرقمي والتصميم وتطوير المواقع والتطبيقات من فريق بريق.",
};

export default async function BlogPage() {
  const posts = await getPosts();
  const [featured, ...rest] = posts;

  return (
    <>
      <PageHero eyebrow="المدونة" title="أفكار تلمع، ونصائح تنمّي أعمالك" intro="خلاصة خبرتنا في التسويق والتصميم والتقنية، بلغة بسيطة وخطوات عملية." />
      <section className="container-x py-14 sm:py-16">
        {!featured ? (
          <EmptyState title="لا توجد مقالات منشورة بعد" body="ننشر قريباً أولى مقالاتنا. تابعنا!" />
        ) : (
          <>
            <Link href={`/blog/${featured.slug}`} className="card group grid overflow-hidden lg:grid-cols-2">
              <div className="relative aspect-[16/10] bg-lilac-50 lg:aspect-auto lg:min-h-[340px]">
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
                  <span className="eyebrow !py-1">أحدث مقال</span>
                  {featured.category && <span>{featured.category}</span>}
                  <span aria-hidden>·</span>
                  <time dateTime={featured.published_at ?? featured.created_at}>{formatDate(featured.published_at ?? featured.created_at)}</time>
                </div>
                <h2 className="mt-4 text-2xl font-bold leading-[1.5] text-night transition-colors group-hover:text-violet sm:text-3xl">
                  {featured.title}
                </h2>
                {featured.excerpt && <p className="mt-3 line-clamp-3 text-[16px] leading-8 text-muted">{featured.excerpt}</p>}
                <span className="mt-6 inline-flex items-center gap-2 font-semibold text-violet">
                  اقرأ المقال · {readingMinutes(featured.content)} د
                  <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
                </span>
              </div>
            </Link>
            {rest.length > 0 && (
              <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </>
        )}
      </section>
      <CtaBand />
    </>
  );
}
