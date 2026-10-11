import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { getTeamOptions } from "@/lib/team";
import { PageHeader } from "@/components/dashboard/ui";
import { ContactForm } from "@/components/dashboard/clients";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("عميل جديد", "New client") };
}

export default async function NewClientPage() {
  const admin = await requireSection("clients");
  const { t, lang } = await getDashT();
  const [members, { data: services }] = await Promise.all([getTeamOptions(admin), admin.supabase.from("services").select("slug, title, title_en").order("sort_order")]);
  return (
    <>
      <PageHeader title={t("عميل جديد", "New client")} />
      <ContactForm members={members} services={(services ?? []).map((s) => ({ slug: s.slug, title: (lang === "en" && s.title_en) || s.title }))} />
    </>
  );
}
