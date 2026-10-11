import { requireSection } from "@/lib/supabase/server";
import { isAiConfigured } from "@/lib/ai";
import { defaultServices } from "@/lib/content";
import { PageHeader } from "@/components/dashboard/ui";
import { BriefForm } from "@/components/dashboard/marketing";
import { adImages } from "../images";
import { getDashT } from "@/lib/dash";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("حملة جديدة", "New campaign") };
}

export default async function NewCampaignPage() {
  const admin = await requireSection("marketing");
  const { t } = await getDashT();
  const [{ data: conn }, images] = await Promise.all([
    admin.supabase.from("meta_connection").select("ad_account_currency").eq("id", 1).maybeSingle(),
    adImages(admin),
  ]);

  return (
    <>
      <PageHeader
        title={t("حملة جديدة بالذكاء الاصطناعي", "New AI campaign")}
        description={t("صف هدفك بكلماتك، وسيقترح الذكاء الاصطناعي النصوص والاستهداف ورسالة الترحيب في واتساب.", "Describe your goal in your own words and AI proposes the copy, targeting and WhatsApp welcome message.")}
      />
      {!isAiConfigured && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          {t("أضف", "Add")} <code dir="ltr">ANTHROPIC_API_KEY</code> {t("إلى إعدادات الخادم لتفعيل توليد الحملات.", "to the server settings to enable campaign drafting.")}
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
