import Image from "next/image";
import Link from "next/link";
import { CalendarCheck, Clock } from "lucide-react";
import { ForwardArrow, ServiceIcon, WhatsAppIcon, nudge } from "@/components/icons";
import { whatsappLink } from "@/lib/site";
import { getDict, href, type Lang } from "@/lib/i18n";
import type { Post, Project, Service } from "@/lib/types";
import { cn, formatDate, readingMinutes } from "@/lib/utils";
import { Reveal } from "@/components/motion/Reveal";
import { ServiceArt, hasArt } from "@/components/art/ServiceArt";
import { RingsPattern } from "@/components/art/RingsPattern";

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
      <h2 className="mt-4 text-[28px] font-bold text-ink sm:text-4xl">
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
      <Reveal variant="stagger" className="container-x relative py-16 text-center sm:py-20">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-bold text-ink sm:text-5xl">{title}</h1>
        {intro && <p className="mx-auto mt-5 max-w-2xl text-lg leading-9 text-muted">{intro}</p>}
      </Reveal>
    </section>
  );
}

export function ServiceCard({ service, lang }: { service: Service; index?: number; lang: Lang }) {
  return (
    <Link
      href={href(lang, `/services/${service.slug}`)}
      className="card group flex h-full flex-col overflow-hidden transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden border-b border-line bg-tint">
        {hasArt(service.slug) ? (
          <ServiceArt slug={service.slug} className="transition-transform duration-700 group-hover:scale-[1.04]" />
        ) : service.image_url ? (
          <Image
            src={service.image_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 280px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : null}
        <span className="icon-wiggle absolute start-4 top-4 flex size-11 items-center justify-center rounded-2xl bg-violet text-white shadow-[0_8px_20px_-8px_rgb(97_42_174/.7)]">
          <ServiceIcon name={service.icon} className="size-5" aria-hidden />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-bold text-ink">{service.title}</h3>
        <p className="mt-2 flex-1 text-[15px] leading-7 text-muted">{service.summary}</p>
        <span className="mt-5 inline-flex items-center gap-2 text-[15px] font-semibold text-accent">
          {getDict(lang).common.discoverService}
          <ForwardArrow className={cn("size-4", nudge)} />
        </span>
      </div>
    </Link>
  );
}

export function ProjectCard({ project, large, lang }: { project: Project; large?: boolean; lang: Lang }) {
  return (
    <Link href={href(lang, `/portfolio/${project.slug}`)} className="group block">
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
        <span className="absolute bottom-4 end-4 flex size-11 translate-y-2 items-center justify-center rounded-full bg-card text-accent opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <ForwardArrow className="size-5" />
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {project.services?.title && <span className="eyebrow !py-1 !text-xs">{project.services.title}</span>}
        {project.client && <span className="text-sm text-muted">{project.client}</span>}
      </div>
      <h3 className="mt-2 text-xl font-bold text-ink transition-colors group-hover:text-accent">{project.title}</h3>
      {project.summary && <p className="mt-1 line-clamp-2 text-[15px] leading-7 text-muted">{project.summary}</p>}
    </Link>
  );
}

export function PostCard({ post, lang }: { post: Post; lang: Lang }) {
  const date = post.published_at ?? post.created_at;
  return (
    <Link href={href(lang, `/blog/${post.slug}`)} className="card group flex h-full flex-col overflow-hidden transition-shadow hover:shadow-[var(--shadow-lift)]">
      <div className="relative aspect-[16/9] overflow-hidden bg-tint">
        {post.cover_url ? (
          <Image
            src={post.cover_url}
            alt=""
            fill
            sizes="(min-width: 1024px) 380px, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <BrandCover />
        )}
        {post.category && (
          <span className="absolute start-4 top-4 rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-accent">{post.category}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-center gap-3 text-sm text-muted">
          <time dateTime={date}>{formatDate(date, lang)}</time>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" aria-hidden />
            {getDict(lang).common.readMinutes(readingMinutes(post.content))}
          </span>
        </div>
        <h3 className="mt-3 text-lg font-bold leading-8 text-ink transition-colors group-hover:text-accent">{post.title}</h3>
        {post.excerpt && <p className="mt-2 line-clamp-2 flex-1 text-[15px] leading-7 text-muted">{post.excerpt}</p>}
      </div>
    </Link>
  );
}

export function CtaBand({ lang, title, body }: { lang: Lang; title?: string; body?: string }) {
  const t = getDict(lang);
  const wa = whatsappLink(t.wa.consult);
  return (
    <section className="container-x py-16 sm:py-20">
      <Reveal className="relative overflow-hidden rounded-[32px] bg-night px-6 py-12 text-white ring-1 ring-white/5 sm:px-12 sm:py-16">
        <div className="absolute inset-y-0 end-0 w-[60%] bg-[radial-gradient(closest-side,rgb(97_42_174/.6),transparent)]" />
        <RingsPattern className="absolute -end-24 top-1/2 size-[520px] -translate-y-1/2 opacity-90 max-sm:-end-56 max-sm:opacity-40" />
        <div className="relative max-w-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[13px] font-semibold text-lilac">
            <CalendarCheck className="size-4" aria-hidden />
            {t.cta.badge}
          </span>
          <h2 className="mt-5 text-3xl font-bold sm:text-4xl">{title ?? t.cta.title}</h2>
          <p className="mt-4 text-[17px] leading-8 text-white/80">{body ?? t.cta.body}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href={href(lang, "/booking")} className="btn btn-light">
              {t.cta.primary}
              <ForwardArrow className="size-4" />
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-ghost-light">
                <WhatsAppIcon className="size-5" />
                {t.cta.whatsapp}
              </a>
            )}
          </div>
        </div>
      </Reveal>
    </section>
  );
}

export function EmptyState({ title, body, action }: { title: string; body?: string; action?: React.ReactNode }) {
  return (
    <div className="mx-auto max-w-lg rounded-[24px] border border-dashed border-line bg-tint/60 px-6 py-14 text-center">
      <h3 className="text-xl font-bold text-ink">{title}</h3>
      {body && <p className="mt-2 text-muted">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

/** Placeholder cover for posts without an image: brand gradient with the ring pattern. */
export function BrandCover({ className }: { className?: string }) {
  return (
    <div className={cn("absolute inset-0 overflow-hidden bg-gradient-to-br from-night via-deep to-violet", className)} aria-hidden>
      <RingsPattern className="absolute -end-10 -top-10 size-[280px] opacity-80" />
      <div className="grid-dots absolute inset-0 opacity-20" />
    </div>
  );
}
