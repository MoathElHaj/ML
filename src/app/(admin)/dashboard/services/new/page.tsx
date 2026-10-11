import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { PageHeader } from "@/components/dashboard/ui";
import { ServiceForm } from "@/components/dashboard/forms";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("خدمة جديدة", "New service") };
}

export default async function NewPage() {
  await requireSection("content");
  const { t } = await getDashT();
  return (
    <>
      <PageHeader title={t("خدمة جديدة", "New service")} />
      <ServiceForm />
    </>
  );
}
