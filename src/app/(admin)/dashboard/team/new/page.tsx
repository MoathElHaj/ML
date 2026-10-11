import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { PageHeader } from "@/components/dashboard/ui";
import { NewMemberForm } from "@/components/dashboard/team";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("مستخدم جديد", "New user") };
}

export default async function NewMemberPage() {
  const admin = await requireSection("users");
  const { t } = await getDashT();
  return (
    <>
      <PageHeader title={t("مستخدم جديد", "New user")} />
      <NewMemberForm canGrantOwner={admin.member.role === "owner"} />
    </>
  );
}
