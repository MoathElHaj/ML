import { PageHeader } from "@/components/dashboard/ui";
import { ServiceForm } from "@/components/dashboard/forms";

export const metadata = { title: "خدمة جديدة" };

export default function NewService() {
  return (
    <>
      <PageHeader title="خدمة جديدة" />
      <ServiceForm />
    </>
  );
}
