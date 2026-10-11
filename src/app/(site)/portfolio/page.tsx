import type { Metadata } from "next";
import Link from "next/link";
import { getProjects, getServices } from "@/lib/data";
import { CtaBand, EmptyState, PageHero, ProjectCard } from "@/components/site/parts";
import { cn } from "@/lib/utils";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "أعمالنا",
  description: "نماذج من مشاريع وكالة بريق الرقمية في التسويق والتصميم وتطوير المواقع والتطبيقات.",
};

export default async function PortfolioPage(props: PageProps<"/portfolio">) {
  const { service } = await props.searchParams;
  const filter = typeof service === "string" ? service : "";
  const [projects, services] = await Promise.all([getProjects(), getServices()]);
  const shown = filter ? projects.filter((p) => p.services?.slug === filter) : projects;

  return (
    <>
      <PageHero eyebrow="أعمالنا" title="مشاريع صنعنا لها بريقها" intro="نماذج من أعمالنا مع عملائنا في مختلف القطاعات." />
      <section className="container-x py-14 sm:py-16">
        {projects.length > 0 && (
          <nav aria-label="تصفية حسب الخدمة" className="-mx-1 mb-10 flex gap-2 overflow-x-auto px-1 pb-1">
            {[{ slug: "", title: "الكل" }, ...services].map((s) => (
              <Link
                key={s.slug}
                href={s.slug ? `/portfolio?service=${s.slug}` : "/portfolio"}
                scroll={false}
                aria-current={filter === s.slug ? "page" : undefined}
                className={cn(
                  "whitespace-nowrap rounded-full border-[1.5px] px-5 py-2.5 text-[15px] font-semibold transition-colors",
                  filter === s.slug ? "border-violet bg-violet text-white" : "border-line bg-white text-night hover:border-violet",
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
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={filter ? "لا توجد أعمال منشورة في هذه الخدمة بعد" : "نجهّز معرض أعمالنا"}
            body="نضيف مشاريعنا هنا قريباً. تواصل معنا لنريك نماذج تناسب مشروعك."
            action={
              <Link href="/booking" className="btn btn-primary">
                احجز استشارة مجانية
              </Link>
            }
          />
        )}
      </section>
      <CtaBand title="مشروعك القادم قد يكون هنا" />
    </>
  );
}
