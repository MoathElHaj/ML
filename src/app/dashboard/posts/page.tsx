import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { getAdmin } from "@/lib/supabase/server";
import { deletePost } from "@/actions/admin";
import type { Post } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { EmptyRow, PageHeader, Panel, PublishedBadge, SavedNotice } from "@/components/dashboard/ui";

export const metadata = { title: "المدونة" };

export default async function PostsAdmin(props: PageProps<"/dashboard/posts">) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const { saved } = await props.searchParams;
  const { data } = await admin.supabase.from("posts").select("*").order("created_at", { ascending: false });
  const posts = (data ?? []) as Post[];

  return (
    <>
      <PageHeader title="المدونة" description="اكتب المقالات وانشرها، أو احفظها كمسودات." action={{ href: "/dashboard/posts/new", label: "مقال جديد" }} />
      <SavedNotice show={saved === "1"} />
      <Panel>
        {posts.length === 0 ? (
          <EmptyRow>لا توجد مقالات بعد. ابدأ بكتابة أول مقال.</EmptyRow>
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
                      {p.is_published && p.published_at ? `نُشر ${formatDate(p.published_at)}` : `أُنشئ ${formatDate(p.created_at)}`}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link href={`/dashboard/posts/${p.id}`} className="btn btn-outline btn-sm">
                    <Pencil className="size-4" aria-hidden />
                    تعديل
                  </Link>
                  {p.is_published && (
                    <Link href={`/blog/${p.slug}`} target="_blank" className="btn btn-outline btn-sm" aria-label={`عرض ${p.title} في الموقع`}>
                      <ExternalLink className="size-4" aria-hidden />
                    </Link>
                  )}
                  <form action={deletePost}>
                    <input type="hidden" name="id" value={p.id} />
                    <ConfirmButton className="btn btn-danger btn-sm" aria-label={`حذف ${p.title}`} message={`حذف المقال «${p.title}» نهائياً؟`}>
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
