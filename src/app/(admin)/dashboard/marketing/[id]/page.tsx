import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Lightbulb, Trash2 } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { deleteCampaignDraft, type MetaConnection } from "@/actions/marketing";
import { adsManagerUrl } from "@/lib/meta";
import type { AdPlan } from "@/lib/ai";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { PlanEditor, PublishForm } from "@/components/dashboard/marketing";
import { Panel, SavedNotice } from "@/components/dashboard/ui";
import { adImages } from "../images";
import { getDashT } from "@/lib/dash";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("مراجعة الحملة", "Review campaign") };
}

export default async function CampaignPage(props: PageProps<"/dashboard/marketing/[id]">) {
  const admin = await requireSection("marketing");
  const { id } = await props.params;
  const { generated } = await props.searchParams;
  const { t } = await getDashT();

  const [{ data: row }, { data: connData }, images] = await Promise.all([
    admin.supabase.from("ad_campaigns").select("*").eq("id", id).maybeSingle(),
    admin.supabase.from("meta_connection").select("*").eq("id", 1).maybeSingle(),
    adImages(admin),
  ]);
  if (!row) notFound();
  const conn = connData as MetaConnection | null;
  const plan = row.plan as AdPlan;
  const currency = (row.brief as { currency?: string })?.currency ?? conn?.ad_account_currency ?? "USD";
  const created = row.status === "created";
  const ready = Boolean(conn?.ad_account_id && conn?.page_id);
  const total = Number(row.daily_budget) * row.duration_days;

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/dashboard/marketing" className="text-sm font-semibold text-violet hover:underline">
            {t("→ الحملات الإعلانية", "← Campaigns")}
          </Link>
          <h1 className="mt-2 text-[28px] font-bold text-night">{row.title}</h1>
          <p className="mt-1 text-muted">
            {row.daily_budget} {currency} {t("يومياً", "/day")} × {row.duration_days} {t("أيام", "days")} ≈ {total.toFixed(2)} {currency} {t("كحد أقصى", "max")}
          </p>
        </div>
        {!created && (
          <form action={deleteCampaignDraft}>
            <input type="hidden" name="id" value={row.id} />
            <ConfirmButton className="btn btn-danger btn-sm" message={t("حذف هذه المسودة؟", "Delete this draft?")}>
              <Trash2 className="size-4" aria-hidden />
              {t("حذف المسودة", "Delete draft")}
            </ConfirmButton>
          </form>
        )}
      </div>

      <SavedNotice show={generated === "1"} text={t("جهّز الذكاء الاصطناعي مسودة الحملة. راجع النصوص والاستهداف وعدّل ما تريد قبل الإنشاء في Meta.", "AI drafted the campaign. Review the copy and targeting, and edit anything before creating it in Meta.")} />

      {plan.rationale && (
        <Panel className="mb-6">
          <div className="flex gap-3 p-5">
            <Lightbulb className="mt-0.5 size-5 shrink-0 text-violet" aria-hidden />
            <div className="space-y-2 text-[15px] leading-7 text-night">
              <p>{plan.rationale}</p>
              {plan.tips?.length > 0 && (
                <ul className="list-disc space-y-1 ps-5 text-muted">
                  {plan.tips.map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </Panel>
      )}

      <PlanEditor
        id={row.id}
        plan={plan}
        dailyBudget={Number(row.daily_budget)}
        durationDays={row.duration_days}
        imageUrl={row.image_url}
        images={images}
        currency={currency}
        locked={created}
      />

      <Panel title={t("الإنشاء في Meta", "Create in Meta")} className="mt-6">
        <div className="space-y-4 p-5">
          {created ? (
            <>
              <p className="text-[15px] leading-7 text-night">
                {t("أُنشئت الحملة في Meta بحالة", "The campaign was created in Meta as")} <strong>{t("متوقفة", "paused")}</strong>.{" "}
                {t("افتحها في مدير الإعلانات لمراجعتها، ثم فعّلها عندما تكون جاهزاً. ستمر بمراجعة Meta قبل بدء العرض.", "Open it in Ads Manager to review, then activate it when ready. Meta reviews it before delivery.")}
              </p>
              <dl className="grid gap-2 text-sm sm:grid-cols-2" dir="ltr">
                <div>
                  <dt className="text-muted">Campaign</dt>
                  <dd className="font-mono text-night">{row.meta_campaign_id}</dd>
                </div>
                <div>
                  <dt className="text-muted">Ad</dt>
                  <dd className="font-mono text-night">{row.meta_ad_id}</dd>
                </div>
              </dl>
              {conn?.ad_account_id && (
                <a href={adsManagerUrl(conn.ad_account_id, row.meta_campaign_id)} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-sm">
                  <ExternalLink className="size-4" aria-hidden />
                  {t("فتح في مدير الإعلانات", "Open in Ads Manager")}
                </a>
              )}
            </>
          ) : (
            <>
              <p className="text-[15px] leading-7 text-muted">
                {t(
                  "سيُنشأ: حملة تفاعل ← مجموعة إعلانية بوجهة واتساب ← إعلان بصورتك وزر «إرسال رسالة» ورسالة الترحيب.",
                  "This creates: an engagement campaign → a WhatsApp ad set → an ad with your image, a “Send message” button and the welcome message.",
                )}{" "}
                <strong className="text-night">{t("كل شيء يُنشأ متوقفاً", "Everything is created paused")}</strong>{" "}
                {t("ولا يُصرف شيء حتى تفعّله بنفسك من مدير الإعلانات.", "and nothing is spent until you activate it in Ads Manager.")}
              </p>
              {row.status === "failed" && row.error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">
                  {t("آخر محاولة فشلت:", "Last attempt failed:")} {row.error}
                  {row.meta_campaign_id && t(" — قد تكون بعض العناصر أُنشئت متوقفة في مدير الإعلانات؛ احذفها هناك قبل إعادة المحاولة.", " — some items may exist (paused) in Ads Manager; delete them there before retrying.")}
                </p>
              )}
              {!ready && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  {t("أكمل ربط Meta واختر الحساب الإعلاني والصفحة من", "Finish connecting Meta and pick the ad account and Page on the")}{" "}
                  <Link href="/dashboard/marketing" className="font-semibold underline">
                    {t("صفحة الحملات", "Campaigns page")}
                  </Link>
                  .
                </p>
              )}
              <PublishForm
                id={row.id}
                ready={ready}
                budgetSummary={t(
                  `الميزانية: ${row.daily_budget} ${currency} يومياً لمدة ${row.duration_days} أيام (≈ ${total.toFixed(2)} ${currency}).`,
                  `Budget: ${row.daily_budget} ${currency}/day for ${row.duration_days} days (≈ ${total.toFixed(2)} ${currency}).`,
                )}
              />
            </>
          )}
        </div>
      </Panel>
    </>
  );
}
