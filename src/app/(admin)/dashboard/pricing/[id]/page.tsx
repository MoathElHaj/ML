import { notFound, redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/server";
import type { Package } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/ui";
import { PackageForm } from "@/components/dashboard/forms";

export const metadata = { title: "تعديل باقة" };

export default async function EditPackage(props: PageProps<"/dashboard/pricing/[id]">) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const { id } = await props.params;
  const { data } = await admin.supabase.from("packages").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <>
      <PageHeader title={`تعديل: ${(data as Package).name}`} />
      <PackageForm pkg={data as Package} />
    </>
  );
}
