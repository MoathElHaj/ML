import Image from "next/image";
import Link from "next/link";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { deletePost } from "@/actions/admin";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { EmptyRow, PageHeader, Panel, PublishedBadge, SavedNotice } from "@/components/dashboard/ui";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("المدونة", "Blog") };
}

export default async function PostsAdmin(props: PageProps<"/dashboard/posts">) {
  const admin = await requireSection("content");
  const { t, lang } = await getDashT();
  const { saved } = await props.searchParams;
  const { data } = await admin.supabase.from("posts").select("*").order("created_at", { ascending: false });
  const posts = (data ?? []) as Post[];

  return (
    <>
      <PageHeader title={t("المدونة", "Blog")} description={t("اكتب المقالات وانشرها، أو احفظها كمسودات.", "Write and publish articles, or keep them as drafts.")} action={{ href: "/dashboard/posts/new", label: t("مقال جديد", "New article") }} />
      <SavedNotice show={saved === "1"} />
      <Panel>
        {posts.length === 0 ? (
          <EmptyRow>{t("لا توجد مقالات بعد. ابدأ بكتابة أول مقال.", "No articles yet. Start with your first one.")}</EmptyRow>
        ) : (
          <ul className="divide-y divide-line">
            {posts.map((p) => (
              <li key={p.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative aspect-[16/10] w-24 shrink-0 overflow-hidden rounded-xl bg-lilac-50">
                    <Image src={p.cover_url || "/images/blog-default.jpg"} alt="" fill sizes="96px" className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <PublishedBadge published={p.is_published} />
                      {p.category && <span className="text-xs text-muted">{p.category}</span>}
                    </div>
                    <p className="mt-1 line-clamp-1 font-bold text-night">{p.title}</p>
                    <p className="text-xs text-muted">
                      {p.is_published && p.published_at ? `${t("نُشر", "Published")} ${formatDate(p.published_at, lang)}` : `${t("أُنشئ", "Created")} ${formatDate(p.created_at, lang)}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/dashboard/posts/${p.id}`} className="btn btn-outline btn-sm">
                    <Pencil className="size-4" aria-hidden />
                    {t("تعديل", "Edit")}
                  </Link>
                  {p.is_published && (
                    <Link href={`/blog/${p.slug}`} target="_blank" className="btn btn-outline btn-sm" aria-label={t(`عرض ${p.title} في الموقع`, `View ${p.title} on the website`)}>
                      <ExternalLink className="size-4" aria-hidden />
                    </Link>
                  )}
                  <form action={deletePost}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton className="btn btn-danger btn-sm" aria-label={t(`حذف ${p.title}`, `Delete ${p.title}`)} message={t(`حذف المقال «${p.title}» نهائياً؟`, `Delete “${p.title}” permanently?`)}>
                      <Trash2 className="size-4" aria-hidden />
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
