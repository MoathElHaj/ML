import { notFound } from "next/navigation";
import { requireSection } from "@/lib/supabase/server";
import type { Service } from "@/lib/types";
import { PageHeader } from "@/components/dashboard/ui";
import { getDashT } from "@/lib/dash";
import { ServiceForm } from "@/components/dashboard/forms";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("تعديل خدمة", "Edit service") };
}

export default async function EditService(props: PageProps<"/dashboard/services/[id]">) {
  const admin = await requireSection("content");
  const { id } = await props.params;
  const { t } = await getDashT();
  const { data } = await admin.supabase.from("services").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  return (
    <>
      <PageHeader title={t("تعديل: ", "Edit: ") + `${(data as Service).title}`} />
      <ServiceForm service={data as Service} />
    </>
  );
}
