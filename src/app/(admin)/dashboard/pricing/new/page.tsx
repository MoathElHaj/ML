import { PageHeader } from "@/components/dashboard/ui";
import { PackageForm } from "@/components/dashboard/forms";

export const metadata = { title: "باقة جديدة" };

export default function NewPackage() {
  return (
    <>
      <PageHeader title="باقة جديدة" />
      <PackageForm />
    </>
  );
}
