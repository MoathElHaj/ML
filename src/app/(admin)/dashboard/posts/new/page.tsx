import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { PageHeader } from "@/components/dashboard/ui";
import { PostForm } from "@/components/dashboard/forms";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("مقال جديد", "New article") };
}

export default async function NewPage() {
  await requireSection("content");
  const { t } = await getDashT();
  return (
    <>
      <PageHeader title={t("مقال جديد", "New article")} />
      <PostForm />
    </>
  );
}
