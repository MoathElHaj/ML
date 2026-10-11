/* eslint-disable @next/next/no-html-link-for-pages -- /api/meta/connect is a route handler that redirects to Facebook Login, so it needs a full page navigation */
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, CircleAlert, ExternalLink, Link2, Sparkles, Unplug } from "lucide-react";
import { getAdmin } from "@/lib/supabase/server";
import { disconnectMeta, type MetaConnection } from "@/actions/marketing";
import { adsManagerUrl, isMetaConfigured, listAdAccounts, listPages, MetaError } from "@/lib/meta";
import { isAiConfigured } from "@/lib/ai";
import { site } from "@/lib/site";
import { formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { AssetsForm } from "@/components/dashboard/marketing";
import { EmptyRow, Panel } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "الحملات الإعلانية" };

const notices: Record<string, { ok: boolean; text: string }> = {
  connected: { ok: true, text: "تم ربط حساب Meta. اختر الحساب الإعلاني والصفحة لإكمال الإعداد." },
  denied: { ok: false, text: "تم إلغاء تسجيل الدخول إلى Meta." },
  invalid_state: { ok: false, text: "انتهت صلاحية طلب الربط. حاول مرة أخرى." },
  failed: { ok: false, text: "تعذّر إكمال الربط مع Meta. تحقق من إعدادات تطبيق Meta وحاول مجدداً." },
  not_configured: { ok: false, text: "أضف META_APP_ID و META_APP_SECRET إلى إعدادات الخادم أولاً." },
};

const statusMeta = {
  draft: { label: "مسودة", className: "border-zinc-200 bg-zinc-100 text-zinc-700" },
  created: { label: "في Meta (متوقفة)", className: "border-emerald-200 bg-emerald-50 text-emerald-900" },
  failed: { label: "فشل الإنشاء", className: "border-red-200 bg-red-50 text-red-900" },
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

function SetupItem({ done, label, hint }: { done: boolean; label: string; hint: string }) {
  return (
    <li className="flex items-start gap-3">
      {done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" aria-hidden /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />}
      <div>
        <p className="font-semibold text-night">
          {label} <span className="sr-only">{done ? "(مكتمل)" : "(غير مكتمل)"}</span>
        </p>
        {!done && <p className="text-sm text-muted">{hint}</p>}
      </div>
    </li>
  );
}

export default async function MarketingPage(props: PageProps<"/dashboard/marketing">) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const { meta } = await props.searchParams;
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
      assetsError = e instanceof MetaError ? e.message : "تعذّر قراءة الحسابات من Meta.";
    }
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-night">الحملات الإعلانية</h1>
          <p className="mt-1 text-muted">اربط حساب Meta، ودع الذكاء الاصطناعي يكتب حملات «انقر للمراسلة على واتساب» لخدمات بريق.</p>
        </div>
        {isAiConfigured ? (
          <Link href="/dashboard/marketing/new" className="btn btn-primary btn-sm self-start">
            <Sparkles className="size-4" aria-hidden />
            حملة جديدة بالذكاء الاصطناعي
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
          {notice.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <Panel title="ربط Meta (فيسبوك وإنستغرام)">
          <div className="space-y-5 p-5">
            {!conn ? (
              <>
                <p className="text-[15px] leading-7 text-muted">
                  سجّل الدخول بحساب فيسبوك المسؤول عن Business Portfolio الخاص ببريق، ثم اختر الحساب الإعلاني وصفحة فيسبوك المرتبطة برقم واتساب
                  بيزنس.
                </p>
                {isMetaConfigured ? (
                  <a href="/api/meta/connect" className="btn btn-primary btn-sm">
                    <Link2 className="size-4" aria-hidden />
                    ربط حساب Meta
                  </a>
                ) : (
                  <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    لم يُضبط تطبيق Meta بعد. أضف <code dir="ltr">META_APP_ID</code> و<code dir="ltr">META_APP_SECRET</code> كما في README.
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-night">متصل باسم {conn.fb_user_name}</p>
                    <p className={cn("text-sm", expired ? "text-red-700" : "text-muted")}>
                      {expired ? "انتهت صلاحية الربط — أعد الربط" : conn.token_expires_at ? `صالح حتى ${formatDate(conn.token_expires_at)}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isMetaConfigured && (
                      <a href="/api/meta/connect" className="btn btn-outline btn-sm">
                        إعادة الربط
                      </a>
                    )}
                    <form action={disconnectMeta}>
                      <ConfirmButton className="btn btn-danger btn-sm" message="فصل حساب Meta عن لوحة التحكم؟ لن تتأثر الحملات الموجودة في Meta.">
                        <Unplug className="size-4" aria-hidden />
                        فصل
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

        <Panel title="جاهزية الإعداد">
          <ul className="space-y-4 p-5">
            <SetupItem done={isMetaConfigured} label="تطبيق Meta للمطورين" hint="أنشئ تطبيقاً في developers.facebook.com وأضف META_APP_ID و META_APP_SECRET." />
            <SetupItem done={Boolean(conn) && !expired} label="تسجيل الدخول إلى Meta" hint="اضغط «ربط حساب Meta»." />
            <SetupItem done={assetsReady} label="الحساب الإعلاني والصفحة" hint="اختر الحساب الإعلاني وصفحة فيسبوك المرتبطة بواتساب." />
            <SetupItem done={isAiConfigured} label="الذكاء الاصطناعي (Claude)" hint="أضف ANTHROPIC_API_KEY إلى إعدادات الخادم." />
          </ul>
        </Panel>
      </div>

      <Panel title="الحملات" className="mt-6">
        {!campaigns?.length ? (
          <EmptyRow>لا توجد حملات بعد. أنشئ أول حملة بالذكاء الاصطناعي.</EmptyRow>
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
                      <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-semibold", s.className)}>{s.label}</span>
                    </div>
                    <p className="text-sm text-muted">
                      {c.daily_budget} {c.brief?.currency ?? ""} يومياً · {c.duration_days} أيام · {formatDate(c.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/marketing/${c.id}`} className="btn btn-outline btn-sm">
                      {c.status === "created" ? "عرض" : "مراجعة وتعديل"}
                    </Link>
                    {c.meta_campaign_id && conn?.ad_account_id && (
                      <a href={adsManagerUrl(conn.ad_account_id, c.meta_campaign_id)} target="_blank" rel="noopener noreferrer" className="btn btn-outline btn-sm">
                        <ExternalLink className="size-4" aria-hidden />
                        مدير الإعلانات
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
