import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { deleteProject } from "@/actions/admin";
import type { Project } from "@/lib/types";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { EmptyRow, PageHeader, Panel, PublishedBadge, SavedNotice } from "@/components/dashboard/ui";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("الأعمال", "Portfolio") };
}

export default async function ProjectsAdmin(props: PageProps<"/dashboard/projects">) {
  const admin = await requireSection("content");
  const { t } = await getDashT();
  const { saved } = await props.searchParams;
  const { data } = await admin.supabase
    .from("projects")
    .select("*, services(title, slug)")
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .order("created_at", { ascending: false });
  const projects = (data ?? []) as Project[];

  return (
    <>
      <PageHeader title={t("الأعمال", "Portfolio")} description={t("معرض الأعمال الظاهر في صفحة «أعمالنا» والرئيسية.", "Projects shown on the portfolio and home pages.")} action={{ href: "/dashboard/projects/new", label: t("عمل جديد", "New project") }} />
      <SavedNotice show={saved === "1"} />
      {projects.length === 0 ? (
        <Panel>
          <EmptyRow>{t("لم تُضف أي أعمال بعد. أضف أول مشروع ليظهر في الموقع.", "No projects yet. Add the first one to show it on the website.")}</EmptyRow>
        </Panel>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-[20px] border border-line bg-white">
              <div className="relative aspect-[16/10] bg-gradient-to-br from-deep to-violet">
                {p.cover_url && <Image src={p.cover_url} alt="" fill sizes="(min-width: 1280px) 360px, 50vw" className="object-cover" />}
                {p.is_featured && (
                  <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-violet">
                    <Star className="size-3.5 fill-current" aria-hidden /> {t("مميز", "Featured")}
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <PublishedBadge published={p.is_published} draftLabel={t("مخفي", "Hidden")} />
                  {p.services?.title && <span className="text-xs text-muted">{p.services.title}</span>}
                </div>
                <h2 className="mt-2 font-bold text-night">{p.title}</h2>
                {p.client && <p className="text-sm text-muted">{p.client}</p>}
                <div className="mt-4 flex gap-2">
                  <Link href={`/dashboard/projects/${p.id}`} className="btn btn-outline btn-sm flex-1">
                    <Pencil className="size-4" aria-hidden />
                    {t("تعديل", "Edit")}
                  </Link>
                  {p.is_published && (
                    <Link href={`/portfolio/${p.slug}`} target="_blank" className="btn btn-outline btn-sm" aria-label={t(`عرض ${p.title} في الموقع`, `View ${p.title} on the website`)}>
                      <ExternalLink className="size-4" aria-hidden />
                    </Link>
                  )}
                  <form action={deleteProject}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton className="btn btn-danger btn-sm" aria-label={t(`حذف ${p.title}`, `Delete ${p.title}`)} message={t(`حذف «${p.title}» نهائياً؟`, `Delete “${p.title}” permanently?`)}>
                      <Trash2 className="size-4" aria-hidden />
                    </ConfirmButton>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
