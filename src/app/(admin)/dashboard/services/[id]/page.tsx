import { notFound, redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/server";
import type { Service } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/ui";
import { ServiceForm } from "@/components/dashboard/forms";

export const metadata = { title: "تعديل خدمة" };

export default async function EditService(props: PageProps<"/dashboard/services/[id]">) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const { id } = await props.params;
  const { data } = await admin.supabase.from("services").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <>
      <PageHeader title={`تعديل: ${(data as Service).title}`} />
      <ServiceForm service={data as Service} />
    </>
  );
}
