import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ExternalLink, Lightbulb, Trash2 } from "lucide-react";
import { getAdmin } from "@/lib/supabase/server";
import { deleteCampaignDraft, type MetaConnection } from "@/actions/marketing";
import { adsManagerUrl } from "@/lib/meta";
import type { AdPlan } from "@/lib/ai";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { PlanEditor, PublishForm } from "@/components/dashboard/marketing";
import { Panel, SavedNotice } from "@/components/dashboard/ui";
import { adImages } from "../images";

export const metadata = { title: "مراجعة الحملة" };

export default async function CampaignPage(props: PageProps<"/dashboard/marketing/[id]">) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const { id } = await props.params;
  const { generated } = await props.searchParams;

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
            ← الحملات الإعلانية
          </Link>
          <h1 className="mt-2 text-[28px] font-bold text-night">{row.title}</h1>
          <p className="mt-1 text-muted">
            {row.daily_budget} {currency} يومياً × {row.duration_days} أيام ≈ {total.toFixed(2)} {currency} كحد أقصى
          </p>
        </div>
        {!created && (
          <form action={deleteCampaignDraft}>
            <input type="hidden" name="id" value={row.id} />
            <ConfirmButton className="btn btn-danger btn-sm" message="حذف هذه المسودة؟">
              <Trash2 className="size-4" aria-hidden />
              حذف المسودة
            </ConfirmButton>
          </form>
        )}
      </div>

      <SavedNotice show={generated === "1"} text="جهّز الذكاء الاصطناعي مسودة الحملة. راجع النصوص والاستهداف وعدّل ما تريد قبل الإنشاء في Meta." />

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

      <Panel title="الإنشاء في Meta" className="mt-6">
        <div className="space-y-4 p-5">
          {created ? (
            <>
              <p className="text-[15px] leading-7 text-night">
                أُنشئت الحملة في Meta بحالة <strong>متوقفة</strong>. افتحها في مدير الإعلانات لمراجعتها، ثم فعّلها عندما تكون جاهزاً. ستمر بمراجعة Meta قبل
                بدء العرض.
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
                  فتح في مدير الإعلانات
                </a>
              )}
            </>
          ) : (
            <>
              <p className="text-[15px] leading-7 text-muted">
                سيُنشأ: حملة تفاعل ← مجموعة إعلانية بوجهة واتساب ← إعلان بصورتك وزر «إرسال رسالة» ورسالة الترحيب. <strong className="text-night">كل شيء يُنشأ متوقفاً</strong> ولا
                يُصرف شيء حتى تفعّله بنفسك من مدير الإعلانات.
              </p>
              {row.status === "failed" && row.error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">
                  آخر محاولة فشلت: {row.error}
                  {row.meta_campaign_id && " — قد تكون بعض العناصر أُنشئت متوقفة في مدير الإعلانات؛ احذفها هناك قبل إعادة المحاولة."}
                </p>
              )}
              {!ready && (
                <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  أكمل ربط Meta واختر الحساب الإعلاني والصفحة من{" "}
                  <Link href="/dashboard/marketing" className="font-semibold underline">
                    صفحة الحملات
                  </Link>
                  .
                </p>
              )}
              <PublishForm
                id={row.id}
                ready={ready}
                budgetSummary={`الميزانية: ${row.daily_budget} ${currency} يومياً لمدة ${row.duration_days} أيام (≈ ${total.toFixed(2)} ${currency}).`}
              />
            </>
          )}
        </div>
      </Panel>
    </>
  );
}
