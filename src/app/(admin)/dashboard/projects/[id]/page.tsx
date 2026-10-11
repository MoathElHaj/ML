import { notFound } from "next/navigation";
import { requireSection } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/ui";
import { getDashT } from "@/lib/dash";
import { ProjectForm } from "@/components/dashboard/forms";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("تعديل عمل", "Edit project") };
}

export default async function EditProject(props: PageProps<"/dashboard/projects/[id]">) {
  const admin = await requireSection("content");
  const { id } = await props.params;
  const { t } = await getDashT();
  const [{ data }, { data: services }] = await Promise.all([
    admin.supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    admin.supabase.from("services").select("id, title").order("sort_order"),
  ]);
  if (!data) notFound();
  return (
    <>
      <PageHeader title={t("تعديل: ", "Edit: ") + `${(data as Project).title}`} />
      <ProjectForm project={data as Project} services={services ?? []} />
    </>
  );
}
