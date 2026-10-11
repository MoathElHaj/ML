import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { ROLE_LABELS } from "@/lib/permissions";
import { PageHeader } from "@/components/dashboard/ui";
import { MyAccountForm } from "@/components/dashboard/team";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("حسابي", "My account") };
}

export default async function AccountPage() {
  const admin = await requireSection();
  const { t, lang } = await getDashT();
  return (
    <>
      <PageHeader title={t("حسابي", "My account")} description={`${ROLE_LABELS[admin.member.role][lang]} · ${admin.user.email ?? ""}`} />
      <MyAccountForm fullName={admin.member.full_name ?? ""} email={admin.user.email ?? ""} />
    </>
  );
}
