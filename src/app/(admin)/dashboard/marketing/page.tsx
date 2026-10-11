/* eslint-disable @next/next/no-html-link-for-pages -- /api/meta/connect is a route handler that redirects to Facebook Login, so it needs a full page navigation */
import Link from "next/link";
import { CheckCircle2, CircleAlert, ExternalLink, Link2, Sparkles, Unplug } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { disconnectMeta, type MetaConnection } from "@/actions/marketing";
import { adsManagerUrl, isMetaConfigured, listAdAccounts, listPages, MetaError } from "@/lib/meta";
import { isAiConfigured } from "@/lib/ai";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { AssetsForm } from "@/components/dashboard/marketing";
import { EmptyRow, Panel } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";
import { getDashT } from "@/lib/dash";
import type { T } from "@/lib/dash-i18n";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("الحملات الإعلانية", "Campaigns") };
}

const notices: Record<string, { ok: boolean; text: string; en: string }> = {
  connected: { ok: true, text: "تم ربط حساب Meta. اختر الحساب الإعلاني والصفحة لإكمال الإعداد.", en: "Meta connected. Pick the ad account and Page to finish setup." },
  denied: { ok: false, text: "تم إلغاء تسجيل الدخول إلى Meta.", en: "Meta login was cancelled." },
  invalid_state: { ok: false, text: "انتهت صلاحية طلب الربط. حاول مرة أخرى.", en: "The connect request expired. Try again." },
  failed: { ok: false, text: "تعذّر إكمال الربط مع Meta. تحقق من إعدادات تطبيق Meta وحاول مجدداً.", en: "Could not finish connecting Meta. Check the Meta app settings and try again." },
  not_configured: { ok: false, text: "أضف META_APP_ID و META_APP_SECRET إلى إعدادات الخادم أولاً.", en: "Add META_APP_ID and META_APP_SECRET to the server settings first." },
};

const statusMeta = {
  draft: { label: "مسودة", en: "Draft", className: "border-zinc-200 bg-zinc-100 text-zinc-700" },
  created: { label: "في Meta (متوقفة)", en: "In Meta (paused)", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  failed: { label: "فشل الإنشاء", en: "Creation failed", className: "border-red-200 bg-red-50 text-red-900" },
} as const;

type CampaignRow = {
  id: string;
  title: string;
  status: keyof typeof statusMeta;
  daily_budget: number;
  duration_days: number;
  meta_campaign_id: string | null;
  created_at: string;
  brief: { currency?: string };
};

function SetupItem({ done, label, hint, t }: { done: boolean; label: string; hint: string; t: T }) {
  return (
    <li className="flex items-start gap-3">
      {done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />}
      <div>
        <p className="font-semibold text-night">
          {label} <span className="sr-only">{done ? t("(مكتمل)", "(done)") : t("(غير مكتمل)", "(to do)")}</span>
        </p>
        {!done && <p className="text-sm text-muted">{hint}</p>}
      </div>
    </li>
  );
}

export default async function MarketingPage(props: PageProps<"/dashboard/marketing">) {
  const admin = await requireSection("marketing");
  const { meta } = await props.searchParams;
  const { t, lang } = await getDashT();
  const notice = typeof meta === "string" ? notices[meta] : undefined;

  const [{ data: connData }, { data: campaigns }] = await Promise.all([
    admin.supabase.from("meta_connection").select("*").eq("id", 1).maybeSingle(),
    admin.supabase.from("ad_campaigns").select("id, title, status, daily_budget, duration_days, meta_campaign_id, created_at, brief").order("created_at", { ascending: false }),
  ]);
  const conn = connData as MetaConnection | null;
  const expired = Boolean(conn?.token_expires_at && new Date(conn.token_expires_at) < new Date());
  const assetsReady = Boolean(conn?.ad_account_id && conn?.page_id) && !expired;

  let assets: { accounts: Awaited<ReturnType<typeof listAdAccounts>>; pages: Awaited<ReturnType<typeof listPages>> } | null = null;
  let assetsError: string | null = null;
  if (conn && !expired && isMetaConfigured) {
    try {
      const [accounts, pages] = await Promise.all([listAdAccounts(conn.access_token), listPages(conn.access_token)]);
      assets = { accounts, pages };
    } catch (e) {
      assetsError = e instanceof MetaError ? e.message : t("تعذّر قراءة الحسابات من Meta.", "Could not read the accounts from Meta.");
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-night">{t("الحملات الإعلانية", "Campaigns")}</h1>
          <p className="mt-1 text-muted">{t("اربط حساب Meta، ودع الذكاء الاصطناعي يكتب حملات «انقر للمراسلة على واتساب» لخدمات بريق.", "Connect Meta and let AI write click-to-WhatsApp campaigns for Bariq’s services.")}</p>
        </div>
        {isAiConfigured ? (
          <Link href="/dashboard/marketing/new" className="btn btn-primary btn-sm self-start">
            <Sparkles className="size-4" aria-hidden />
            {t("حملة جديدة بالذكاء الاصطناعي", "New AI campaign")}
          </Link>
        ) : null}
      </div>

      {notice && (
        <div
          role={notice.ok ? "status" : "alert"}
          className={cn(
            "mb-6 rounded-2xl border px-4 py-3 text-[15px] font-medium",
            notice.ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900",
          )}
        >
          {lang === "en" ? notice.en : notice.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel title={t("ربط Meta (فيسبوك وإنستغرام)", "Meta connection (Facebook & Instagram)")}>
          <div className="space-y-5 p-5">
            {!conn ? (
              <>
                <p className="text-[15px] leading-7 text-muted">
                  {t(
                    "سجّل الدخول بحساب فيسبوك المسؤول عن Business Portfolio الخاص ببريق، ثم اختر الحساب الإعلاني وصفحة فيسبوك المرتبطة برقم واتساب بيزنس.",
                    "Sign in with the Facebook account that manages Bariq’s Business Portfolio, then pick the ad account and the Facebook Page linked to the WhatsApp Business number.",
                  )}
                </p>
                {isMetaConfigured ? (
                  <a href="/api/meta/connect" className="btn btn-primary btn-sm">
                    <Link2 className="size-4" aria-hidden />
                    {t("ربط حساب Meta", "Connect Meta")}
                  </a>
                ) : (
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    {t("لم يُضبط تطبيق Meta بعد. أضف", "The Meta app isn’t set up yet. Add")} <code dir="ltr">META_APP_ID</code> {t("و", "and")} <code dir="ltr">META_APP_SECRET</code> {t("كما في README.", "as described in the README.")}
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-night">{t("متصل باسم", "Connected as")} {conn.fb_user_name}</p>
                    <p className={cn("text-sm", expired ? "text-red-700" : "text-muted")}>
                      {expired ? t("انتهت صلاحية الربط — أعد الربط", "Connection expired — reconnect") : conn.token_expires_at ? `${t("صالح حتى", "Valid until")} ${formatDate(conn.token_expires_at, lang)}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isMetaConfigured && (
                      <a href="/api/meta/connect" className="btn btn-outline btn-sm">
                        {t("إعادة الربط", "Reconnect")}
                      </a>
                    )}
                    <form action={disconnectMeta}>
                      <ConfirmButton className="btn btn-danger btn-sm" message={t("فصل حساب Meta عن لوحة التحكم؟ لن تتأثر الحملات الموجودة في Meta.", "Disconnect Meta from the dashboard? Campaigns already in Meta are not affected.")}>
                        <Unplug className="size-4" aria-hidden />
                        {t("فصل", "Disconnect")}
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
                {assetsError && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-900">Meta: {assetsError}</p>}
                {assets && (
                  <AssetsForm
                    accounts={assets.accounts}
                    pages={assets.pages}
                    current={{ ad_account_id: conn.ad_account_id, page_id: conn.page_id, whatsapp_number: conn.whatsapp_number, default_whatsapp: site.whatsapp }}
                  />
                )}
              </>
            )}
          </div>
        </Panel>

        <Panel title={t("جاهزية الإعداد", "Setup checklist")}>
          <ul className="space-y-4 p-5">
            <SetupItem t={t} done={isMetaConfigured} label={t("تطبيق Meta للمطورين", "Meta developer app")} hint={t("أنشئ تطبيقاً في developers.facebook.com وأضف META_APP_ID و META_APP_SECRET.", "Create an app at developers.facebook.com and add META_APP_ID and META_APP_SECRET.")} />
            <SetupItem t={t} done={Boolean(conn) && !expired} label={t("تسجيل الدخول إلى Meta", "Meta login")} hint={t("اضغط «ربط حساب Meta».", "Press “Connect Meta”.")} />
            <SetupItem t={t} done={assetsReady} label={t("الحساب الإعلاني والصفحة", "Ad account & Page")} hint={t("اختر الحساب الإعلاني وصفحة فيسبوك المرتبطة بواتساب.", "Pick the ad account and the Page linked to WhatsApp.")} />
            <SetupItem t={t} done={isAiConfigured} label={t("الذكاء الاصطناعي (Claude)", "AI (Claude)")} hint={t("أضف ANTHROPIC_API_KEY إلى إعدادات الخادم.", "Add ANTHROPIC_API_KEY to the server settings.")} />
          </ul>
        </Panel>
      </div>

      <Panel title={t("الحملات", "Campaigns")} className="mt-6">
        {!campaigns?.length ? (
          <EmptyRow>{t("لا توجد حملات بعد. أنشئ أول حملة بالذكاء الاصطناعي.", "No campaigns yet. Draft your first one with AI.")}</EmptyRow>
        ) : (
          <ul className="divide-y divide-line">
            {(campaigns as CampaignRow[]).map((c) => {
              const s = statusMeta[c.status];
              return (
                <li key={c.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={`/dashboard/marketing/${c.id}`} className="font-bold text-night hover:text-violet">
                        {c.title}
                      </Link>
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", s.className)}>{lang === "en" ? s.en : s.label}</span>
                    </div>
                    <p className="text-sm text-muted">
                      {c.daily_budget} {c.brief?.currency ?? ""} {t("يومياً", "/day")} · {c.duration_days} {t("أيام", "days")} · {formatDate(c.created_at, lang)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/marketing/${c.id}`} className="btn btn-outline btn-sm">
                      {c.status === "created" ? t("عرض", "View") : t("مراجعة وتعديل", "Review & edit")}
                    </Link>
                    {c.meta_campaign_id && conn?.ad_account_id && (
                      <a href={adsManagerUrl(conn.ad_account_id, c.meta_campaign_id)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                        <ExternalLink className="size-4" aria-hidden />
                        {t("مدير الإعلانات", "Ads Manager")}
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </>
  );
}
