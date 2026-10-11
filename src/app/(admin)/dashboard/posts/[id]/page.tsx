import { notFound } from "next/navigation";
import { requireSection } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/ui";
import { getDashT } from "@/lib/dash";
import { PostForm } from "@/components/dashboard/forms";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("تعديل مقال", "Edit article") };
}

export default async function EditPost(props: PageProps<"/dashboard/posts/[id]">) {
  const admin = await requireSection("content");
  const { id } = await props.params;
  const { t } = await getDashT();
  const { data } = await admin.supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <>
      <PageHeader title={t("تعديل: ", "Edit: ") + `${(data as Post).title}`} />
      <PostForm post={data as Post} />
    </>
  );
}
