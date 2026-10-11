import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, Clock } from "lucide-react";
import { ServiceIcon, WhatsAppIcon } from "@/components/icons";
import { whatsappLink } from "@/lib/site";
import type { Post, Project, Service } from "@/lib/types";
import { cn, formatDate, readingMinutes } from "@/lib/utils";

export function SectionHeading({
  eyebrow,
  title,
  highlight,
  intro,
  align = "center",
  className,
}: {
  eyebrow?: string;
  title: string;
  highlight?: string;
  intro?: string;
  align?: "center" | "start";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="mt-4 text-[28px] font-bold text-night sm:text-4xl">
        {title} {highlight && <span className="text-gradient">{highlight}</span>}
      </h2>
      {intro && <p className="mt-4 text-[17px] leading-8 text-muted">{intro}</p>}
    </div>
  );
}

export function PageHero({ eyebrow, title, intro }: { eyebrow: string; title: string; intro?: string }) {
  return (
    <section className="hero-glow relative -mt-[72px] overflow-hidden pt-[72px]">
      <div className="grid-dots pointer-events-none absolute inset-0 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
      <div className="container-x relative py-16 text-center sm:py-20">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold text-night sm:text-5xl">{title}</h1>
        {intro && <p className="mx-auto mt-5 max-w-2xl text-lg leading-9 text-muted">{intro}</p>}
      </div>
    </section>
  );
}

export function ServiceCard({ service, index }: { service: Service; index?: number }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="card group flex h-full flex-col overflow-hidden transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-night">
        {service.image_url && (
          <Image
            src={service.image_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <span className="absolute start-4 top-4 flex size-12 items-center justify-center rounded-2xl bg-white/95 text-violet shadow-md">
          <ServiceIcon name={service.icon} className="size-6" aria-hidden />
        </span>
        {index !== undefined && (
          <span className="absolute end-4 top-4 text-sm font-semibold text-white/80" dir="ltr">
            0{index + 1}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-night">{service.title}</h3>
        <p className="mt-2 flex-1 text-[15px] leading-7 text-muted">{service.summary}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-[15px] font-semibold text-violet">
          اكتشف الخدمة
          <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-1" aria-hidden />
        </span>
      </div>
    </Link>
  );
}

export function ProjectCard({ project, large }: { project: Project; large?: boolean }) {
  return (
    <Link href={`/portfolio/${project.slug}`} className="group block">
      <div
        className={cn(
          "relative overflow-hidden rounded-[24px] bg-gradient-to-br from-deep to-violet",
          large ? "aspect-[16/11]" : "aspect-[4/3]",
        )}
      >
        {project.cover_url ? (
          <Image
            src={project.cover_url}
            alt={project.title}
            fill
            sizes="(min-width: 1024px) 560px, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="grid-dots absolute inset-0 opacity-40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-night/70 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <span className="absolute bottom-4 end-4 flex size-11 translate-y-2 items-center justify-center rounded-full bg-white text-violet opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowLeft className="size-5" aria-hidden />
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {project.services?.title && <span className="eyebrow !py-1 !text-xs">{project.services.title}</span>}
        {project.client && <span className="text-sm text-muted">{project.client}</span>}
      </div>
      <h3 className="mt-2 text-xl font-bold text-night transition-colors group-hover:text-violet">{project.title}</h3>
      {project.summary && <p className="mt-1 line-clamp-2 text-[15px] leading-7 text-muted">{project.summary}</p>}
    </Link>
  );
}

export function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/blog/${post.slug}`} className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-lilac-50">
        <Image
          src={post.cover_url || "/images/blog-default.jpg"}
          alt=""
          fill
          sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {post.category && (
          <span className="absolute start-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-violet">
            {post.category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3 text-sm text-muted">
          <time dateTime={post.published_at ?? post.created_at}>{formatDate(post.published_at ?? post.created_at)}</time>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {readingMinutes(post.content)} د قراءة
          </span>
        </div>
        <h3 className="mt-3 text-lg font-bold leading-8 text-night transition-colors group-hover:text-violet">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 flex-1 text-[15px] leading-7 text-muted">{post.excerpt}</p>}
      </div>
    </Link>
  );
}

export function CtaBand({
  title = "احجز استشارتك المجانية اليوم",
  body = "جلسة 30 دقيقة مع خبرائنا نحلل فيها وضعك الرقمي ونقترح خطوات عملية لنمو أعمالك، بلا أي التزام.",
}: {
  title?: string;
  body?: string;
}) {
  const wa = whatsappLink("مرحباً بريق، أود حجز استشارة مجانية");
  return (
    <section className="container-x py-16 sm:py-20">
      <div className="relative overflow-hidden rounded-[32px] bg-night px-6 py-12 text-white sm:px-12 sm:py-16">
        <Image src="/images/cta.jpg" alt="" fill sizes="100vw" className="object-cover opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-l from-night via-night/85 to-night/30" />
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold text-lilac">
            <CalendarCheck className="size-4" aria-hidden />
            استشارة مجانية · 30 دقيقة
          </span>
          <h2 className="mt-5 text-3xl font-bold sm:text-4xl">{title}</h2>
          <p className="mt-4 text-[17px] leading-8 text-white/80">{body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/booking" className="btn btn-light">
              احجز موعدك الآن
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light">
                <WhatsAppIcon className="size-5" />
                تواصل عبر واتساب
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg rounded-[24px] border border-dashed border-line bg-lilac-50/60 px-6 py-14 text-center">
      <h3 className="text-xl font-bold text-night">{title}</h3>
      {body && <p className="mt-2 text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
