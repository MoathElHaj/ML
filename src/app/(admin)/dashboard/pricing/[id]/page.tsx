import { notFound } from "next/navigation";
import { requireSection } from "@/lib/supabase/server";
import type { Package } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/ui";
import { getDashT } from "@/lib/dash";
import { PackageForm } from "@/components/dashboard/forms";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("تعديل باقة", "Edit package") };
}

export default async function EditPackage(props: PageProps<"/dashboard/pricing/[id]">) {
  const admin = await requireSection("pricing");
  const { id } = await props.params;
  const { t } = await getDashT();
  const { data } = await admin.supabase.from("packages").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <>
      <PageHeader title={t("تعديل: ", "Edit: ") + `${(data as Package).name}`} />
      <PackageForm pkg={data as Package} />
    </>
  );
}
