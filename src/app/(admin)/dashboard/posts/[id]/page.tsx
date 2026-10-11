import { notFound, redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/server";
import type { Post } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/ui";
import { PostForm } from "@/components/dashboard/forms";

export const metadata = { title: "تعديل مقال" };

export default async function EditPost(props: PageProps<"/dashboard/posts/[id]">) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const { id } = await props.params;
  const { data } = await admin.supabase.from("posts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <>
      <PageHeader title={`تعديل: ${(data as Post).title}`} />
      <PostForm post={data as Post} />
    </>
  );
}
