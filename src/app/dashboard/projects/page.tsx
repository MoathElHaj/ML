import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, Pencil, Star, Trash2 } from "lucide-react";
import { getAdmin } from "@/lib/supabase/server";
import { deleteProject } from "@/actions/admin";
import type { Project } from "@/lib/types";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { EmptyRow, PageHeader, Panel, PublishedBadge, SavedNotice } from "@/components/dashboard/ui";

export const metadata = { title: "الأعمال" };

export default async function ProjectsAdmin(props: PageProps<"/dashboard/projects">) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
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
      <PageHeader title="الأعمال" description="معرض الأعمال الظاهر في صفحة «أعمالنا» والرئيسية." action={{ href: "/dashboard/projects/new", label: "عمل جديد" }} />
      <SavedNotice show={saved === "1"} />
      {projects.length === 0 ? (
        <Panel>
          <EmptyRow>لم تُضف أي أعمال بعد. أضف أول مشروع ليظهر في الموقع.</EmptyRow>
        </Panel>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <article key={p.id} className="overflow-hidden rounded-[20px] border border-line bg-white">
              <div className="relative aspect-[16/10] bg-gradient-to-br from-deep to-violet">
                {p.cover_url && <Image src={p.cover_url} alt="" fill sizes="(min-width: 1280px) 360px, 50vw" className="object-cover" />}
                {p.is_featured && (
                  <span className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-violet">
                    <Star className="size-3.5 fill-current" aria-hidden /> مميز
                  </span>
                )}
              </div>
              <div className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <PublishedBadge published={p.is_published} draftLabel="مخفي" />
                  {p.services?.title && <span className="text-xs text-muted">{p.services.title}</span>}
                </div>
                <h2 className="mt-2 font-bold text-night">{p.title}</h2>
                {p.client && <p className="text-sm text-muted">{p.client}</p>}
                <div className="mt-4 flex gap-2">
                  <Link href={`/dashboard/projects/${p.id}`} className="btn btn-outline btn-sm flex-1">
                    <Pencil className="size-4" aria-hidden />
                    تعديل
                  </Link>
                  {p.is_published && (
                    <Link href={`/portfolio/${p.slug}`} target="_blank" className="btn btn-outline btn-sm" aria-label={`عرض ${p.title} في الموقع`}>
                      <ExternalLink className="size-4" aria-hidden />
                    </Link>
                  )}
                  <form action={deleteProject}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton className="btn btn-danger btn-sm" aria-label={`حذف ${p.title}`} message={`حذف «${p.title}» نهائياً؟`}>
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
