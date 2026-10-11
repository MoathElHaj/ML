import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/ui";
import { ProjectForm } from "@/components/dashboard/forms";

export const metadata = { title: "عمل جديد" };

export default async function NewProject() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const { data } = await admin.supabase.from("services").select("id, title").order("sort_order");
  return (
    <>
      <PageHeader title="إضافة عمل جديد" />
      <ProjectForm services={data ?? []} />
    </>
  );
}
