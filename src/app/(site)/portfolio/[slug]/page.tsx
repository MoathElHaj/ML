import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getProject } from "@/lib/data";
import { Prose } from "@/components/Prose";
import { CtaBand } from "@/components/site/parts";

export const revalidate = 60;

export async function generateMetadata(props: PageProps<"/portfolio/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
    openGraph: project.cover_url ? { images: [project.cover_url] } : undefined,
  };
}

export default async function ProjectPage(props: PageProps<"/portfolio/[slug]">) {
  const { slug } = await props.params;
  const project = await getProject(slug);
  if (!project) notFound();

  return (
    <>
      <section className="hero-glow relative -mt-[72px] pt-[72px]">
        <div className="container-x py-12 sm:py-16">
          <nav aria-label="مسار التنقل" className="text-sm text-muted">
            <Link href="/portfolio" className="hover:text-violet">
              أعمالنا
            </Link>
            <span className="mx-2" aria-hidden>/</span>
            <span className="text-night">{project.title}</span>
          </nav>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold text-night sm:text-5xl">{project.title}</h1>
          {project.summary && <p className="mt-4 max-w-2xl text-lg leading-9 text-muted">{project.summary}</p>}
          <dl className="mt-8 flex flex-wrap gap-3">
            {project.client && (
              <div className="card px-5 py-3">
                <dt className="text-xs text-muted">العميل</dt>
                <dd className="font-semibold text-night">{project.client}</dd>
              </div>
            )}
            {project.services?.title && (
              <div className="card px-5 py-3">
                <dt className="text-xs text-muted">الخدمة</dt>
                <dd className="font-semibold text-night">
                  <Link href={`/services/${project.services.slug}`} className="hover:text-violet">
                    {project.services.title}
                  </Link>
                </dd>
              </div>
            )}
            {project.tags.length > 0 && (
              <div className="card px-5 py-3">
                <dt className="text-xs text-muted">المجال</dt>
                <dd className="font-semibold text-night">{project.tags.join("، ")}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <section className="container-x pb-8">
        {project.cover_url && (
          <div className="relative aspect-[16/9] overflow-hidden rounded-[32px] bg-lilac-50 shadow-[var(--shadow-soft)]">
            <Image src={project.cover_url} alt={project.title} fill priority sizes="(min-width: 1200px) 1150px, 100vw" className="object-cover" />
          </div>
        )}
        <div className="mx-auto mt-12 max-w-3xl">
          {project.description && <Prose text={project.description} />}
          {project.link_url && (
            <a href={project.link_url} target="_blank" rel="noopener noreferrer" className="btn btn-dark mt-4">
              زيارة المشروع
              <ExternalLink className="size-4" aria-hidden />
            </a>
          )}
        </div>
      </section>
      <CtaBand title="هل تريد نتيجة مشابهة؟" />
    </>
  );
}
