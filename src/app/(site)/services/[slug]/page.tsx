import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarCheck, Check } from "lucide-react";
import { getProjects, getService, getServices } from "@/lib/data";
import { whatsappLink } from "@/lib/site";
import { processSteps } from "@/lib/content";
import { CtaBand, ProjectCard, ServiceCard } from "@/components/site/parts";
import { ServiceIcon, WhatsAppIcon } from "@/components/icons";

export const revalidate = 60;

export async function generateStaticParams() {
  const services = await getServices();
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata(props: PageProps<"/services/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const service = await getService(slug);
  if (!service) return {};
  return {
    title: service.title,
    description: service.summary,
    openGraph: service.image_url ? { images: [service.image_url] } : undefined,
  };
}

export default async function ServicePage(props: PageProps<"/services/[slug]">) {
  const { slug } = await props.params;
  const service = await getService(slug);
  if (!service) notFound();

  const isRealId = !service.id.startsWith("default-");
  const [projects, all] = await Promise.all([
    isRealId ? getProjects({ serviceId: service.id, limit: 4 }) : Promise.resolve([]),
    getServices(),
  ]);
  const others = all.filter((s) => s.slug !== service.slug).slice(0, 3);
  const wa = whatsappLink(`مرحباً بريق، أود الاستفسار عن خدمة ${service.title}`);

  return (
    <>
      <section className="hero-glow relative -mt-[72px] overflow-hidden pt-[72px]">
        <div className="container-x grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div>
            <nav aria-label="مسار التنقل" className="text-sm text-muted">
              <Link href="/services" className="hover:text-violet">
                خدماتنا
              </Link>
              <span className="mx-2" aria-hidden>/</span>
              <span className="text-night">{service.title}</span>
            </nav>
            <span className="mt-6 flex size-14 items-center justify-center rounded-2xl bg-violet text-white">
              <ServiceIcon name={service.icon} className="size-7" aria-hidden />
            </span>
            <h1 className="mt-5 text-4xl font-bold text-night sm:text-5xl">{service.title}</h1>
            <p className="mt-5 text-lg leading-9 text-muted">{service.description || service.summary}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={`/booking?service=${service.slug}`} className="btn btn-primary">
                <CalendarCheck className="size-5" aria-hidden />
                احجز استشارة مجانية
              </Link>
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp">
                  <WhatsAppIcon className="size-5" />
                  اسأل عبر واتساب
                </a>
              )}
            </div>
          </div>
          <div className="relative aspect-[16/11] overflow-hidden rounded-[32px] border-[6px] border-white bg-night shadow-[var(--shadow-lift)]">
            {service.image_url && (
              <Image src={service.image_url} alt="" fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            )}
          </div>
        </div>
      </section>

      {service.features.length > 0 && (
        <section className="container-x py-16 sm:py-20">
          <h2 className="text-[28px] font-bold text-night sm:text-3xl">ماذا تشمل الخدمة؟</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {service.features.map((f) => (
              <li key={f} className="card flex items-center gap-4 p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lilac-50 text-violet">
                  <Check className="size-5" strokeWidth={2.5} aria-hidden />
                </span>
                <span className="text-[17px] font-semibold text-night">{f}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="bg-lilac-50/70 py-16 sm:py-20">
        <div className="container-x">
          <h2 className="text-[28px] font-bold text-night sm:text-3xl">كيف نعمل معك</h2>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, i) => (
              <li key={step.title} className="card p-6">
                <span className="text-4xl font-bold text-lilac" dir="ltr">
                  0{i + 1}
                </span>
                <h3 className="mt-3 text-lg font-bold text-night">{step.title}</h3>
                <p className="mt-1.5 text-[15px] leading-7 text-muted">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {projects.length > 0 && (
        <section className="container-x py-16 sm:py-20">
          <h2 className="text-[28px] font-bold text-night sm:text-3xl">من أعمالنا في {service.title}</h2>
          <div className="mt-10 grid gap-x-8 gap-y-12 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        </section>
      )}

      <CtaBand />

      {others.length > 0 && (
        <section className="container-x pb-20">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-[28px] font-bold text-night sm:text-3xl">خدمات أخرى</h2>
            <Link href="/services" className="inline-flex items-center gap-2 font-semibold text-violet">
              كل الخدمات <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((s) => (
              <ServiceCard key={s.id} service={s} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
