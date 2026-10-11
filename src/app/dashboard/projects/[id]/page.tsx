import { notFound, redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/server";
import type { Project } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/ui";
import { ProjectForm } from "@/components/dashboard/forms";

export const metadata = { title: "تعديل عمل" };

export default async function EditProject(props: PageProps<"/dashboard/projects/[id]">) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const { id } = await props.params;
  const [{ data }, { data: services }] = await Promise.all([
    admin.supabase.from("projects").select("*").eq("id", id).maybeSingle(),
    admin.supabase.from("services").select("id, title").order("sort_order"),
  ]);
  if (!data) notFound();
  return (
    <>
      <PageHeader title={`تعديل: ${(data as Project).title}`} />
      <ProjectForm project={data as Project} services={services ?? []} />
    </>
  );
}
