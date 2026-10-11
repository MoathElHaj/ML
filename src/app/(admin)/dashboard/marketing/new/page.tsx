import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai";
import { defaultServices } from "@/lib/content";
import { PageHeader } from "@/components/dashboard/ui";
import { BriefForm } from "@/components/dashboard/marketing";
import { adImages } from "../images";

export const metadata = { title: "حملة جديدة" };

export default async function NewCampaignPage() {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const [{ data: conn }, images] = await Promise.all([
    admin.supabase.from("meta_connection").select("ad_account_currency").eq("id", 1).maybeSingle(),
    adImages(admin),
  ]);

  return (
    <>
      <PageHeader title="حملة جديدة بالذكاء الاصطناعي" description="صف هدفك بكلماتك، وسيقترح الذكاء الاصطناعي النصوص والاستهداف ورسالة الترحيب في واتساب." />
      {!isAiConfigured && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          أضف <code dir="ltr">ANTHROPIC_API_KEY</code> إلى إعدادات الخادم لتفعيل توليد الحملات.
        </p>
      )}
      <BriefForm
        services={defaultServices.map((s) => ({ slug: s.slug, title: s.title }))}
        images={images}
        currency={conn?.ad_account_currency ?? "USD"}
        aiReady={isAiConfigured}
      />
    </>
  );
}
