import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { PageHeader } from "@/components/dashboard/ui";
import { PackageForm } from "@/components/dashboard/forms";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("باقة جديدة", "New package") };
}

export default async function NewPage() {
  await requireSection("pricing");
  const { t } = await getDashT();
  return (
    <>
      <PageHeader title={t("باقة جديدة", "New package")} />
      <PackageForm />
    </>
  );
}
