import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { PageHeader } from "@/components/dashboard/ui";
import { ProjectForm } from "@/components/dashboard/forms";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("عمل جديد", "New project") };
}

export default async function NewProject() {
  const admin = await requireSection("content");
  const { t } = await getDashT();
  const { data } = await admin.supabase.from("services").select("id, title").order("sort_order");
  return (
    <>
      <PageHeader title={t("إضافة عمل جديد", "Add a new project")} />
      <ProjectForm services={data ?? []} />
    </>
  );
}
