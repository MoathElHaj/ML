import Link from "next/link";
import { Columns3, LayoutList, Megaphone, MessageCircle, Search, TrendingUp, UserPlus, Users } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { getTeamOptions } from "@/lib/team";
import { getWhatsAppSettings, isWhatsAppReady } from "@/lib/whatsapp";
import { SOURCE_META, SOURCES, STAGE_META } from "@/lib/crm";
import type { Contact, ContactSource } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { EmptyClients, Pipeline, SourceBadge, StageBadge, SyncLeadsButton } from "@/components/dashboard/clients";
import { Panel } from "@/components/dashboard/ui";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("العملاء", "Clients") };
}

/** Start of this month and one week ago, as ISO timestamps. */
function periods() {
  const now = new Date();
  return { monthStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), weekAgo: new Date(now.getTime() - 7 * 864e5).toISOString() };
}

export default async function ClientsPage(props: PageProps<"/dashboard/clients">) {
  const admin = await requireSection("clients");
  const { t, lang } = await getDashT();
  const sp = await props.searchParams;
  const view = sp.view === "list" ? "list" : "pipeline";
  const source = SOURCES.find((s) => s === sp.source);
  const q = typeof sp.q === "string" ? sp.q.trim().slice(0, 80) : "";
  const mine = sp.who === "mine";
  const db = admin.supabase;

  let query = db.from("contacts").select("*").order("last_activity_at", { ascending: false }).limit(500);
  if (source) query = query.eq("source", source);
  if (mine) query = query.eq("assignee_id", admin.user.id);
  if (q) {
    const like = `%${q.replace(/[%_,()]/g, " ")}%`;
    query = query.or(`full_name.ilike.${like},phone.ilike.${like},email.ilike.${like},company.ilike.${like},campaign.ilike.${like}`);
  }
  const { monthStart, weekAgo } = periods();
  const [{ data }, members, { data: month }, waSettings] = await Promise.all([
    query,
    getTeamOptions(admin),
    db.from("contacts").select("source, stage, value, created_at").gte("created_at", monthStart),
    getWhatsAppSettings(),
  ]);
  const waReady = isWhatsAppReady(waSettings);
  const contacts = (data ?? []) as Contact[];
  const memberName = new Map(members.map((m) => [m.user_id, m.name]));
  const monthRows = month ?? [];

  const fromAds = monthRows.filter((r) => ["meta_ads", "meta_lead_form", "google_ads"].includes(r.source)).length;
  const won = monthRows.filter((r) => r.stage === "won");
  const kpis = [
    { label: t("عملاء جدد هذا الأسبوع", "New this week"), value: contacts.filter((c) => c.created_at >= weekAgo).length, Icon: UserPlus },
    { label: t("من الإعلانات هذا الشهر", "From ads this month"), value: fromAds, Icon: Megaphone },
    { label: t("من واتساب", "From WhatsApp"), value: monthRows.filter((r) => r.source === "whatsapp").length, Icon: MessageCircle },
    { label: t("نسبة التعاقد هذا الشهر", "Win rate this month"), value: monthRows.length ? `${Math.round((won.length / monthRows.length) * 100)}%` : "—", Icon: TrendingUp },
  ];
  const bySource = SOURCES.map((s) => ({ s, n: monthRows.filter((r) => r.source === s).length })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  const maxSource = Math.max(1, ...bySource.map((x) => x.n));
  const currency = t("ر.ع.", "OMR");

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { view: view === "list" ? "list" : undefined, source, q: q || undefined, who: mine ? "mine" : undefined, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return `/dashboard/clients${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-night">{t("العملاء", "Clients")}</h1>
          <p className="mt-1 text-muted">{t("كل عميل محتمل من الموقع وواتساب والإعلانات في مكان واحد، من أول رسالة حتى التعاقد.", "Every lead from the website, WhatsApp and ads in one place, from first message to signed deal.")}</p>
        </div>
        <Link href="/dashboard/clients/new" className="btn btn-primary btn-sm self-start">
          <UserPlus className="size-4" aria-hidden />
          {t("عميل جديد", "New client")}
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-[20px] border border-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">{label}</span>
              <Icon className="size-5 text-violet" aria-hidden />
            </div>
            <p className="mt-2 text-3xl font-bold text-night">{value}</p>
          </div>
        ))}
      </div>

      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-full border-[1.5px] border-line bg-white p-1" role="group" aria-label={t("طريقة العرض", "View")}>
            {[
              { key: "pipeline", label: t("المراحل", "Pipeline"), Icon: Columns3 },
              { key: "list", label: t("قائمة", "List"), Icon: LayoutList },
            ].map(({ key, label, Icon }) => (
              <Link
                key={key}
                href={href({ view: key === "list" ? "list" : undefined })}
                aria-current={view === key ? "page" : undefined}
                className={cn("inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold", view === key ? "bg-night text-white" : "text-night hover:text-violet")}
              >
                <Icon className="size-4" aria-hidden />
                {label}
              </Link>
            ))}
          </div>
          <Link
            href={href({ who: mine ? undefined : "mine" })}
            aria-pressed={mine}
            className={cn("rounded-full border-[1.5px] px-3.5 py-1.5 text-sm font-semibold", mine ? "border-night bg-night text-white" : "border-line bg-white text-night hover:border-violet")}
          >
            {t("عملائي", "My clients")}
          </Link>
        </div>
        <form className="flex gap-2" action="/dashboard/clients">
          {view === "list" && <input type="hidden" name="view" value="list" />}
          {source && <input type="hidden" name="source" value={source} />}
          <label className="relative">
            <span className="sr-only">{t("بحث", "Search")}</span>
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
            <input name="q" defaultValue={q} placeholder={t("اسم، رقم، بريد، حملة…", "Name, phone, email, campaign…")} className="field !min-h-10 !py-1.5 !ps-9 text-sm sm:w-72" />
          </label>
        </form>
      </div>

      <nav aria-label={t("المصدر", "Source")} className="-mx-1 mb-5 flex gap-1.5 overflow-x-auto px-1 pb-1">
        <Link
          href={href({ source: undefined })}
          aria-current={!source ? "page" : undefined}
          className={cn("whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold", !source ? "bg-night text-white" : "bg-white text-night ring-1 ring-line hover:ring-violet")}
        >
          {t("كل المصادر", "All sources")}
        </Link>
        {SOURCES.map((s) => (
          <Link
            key={s}
            href={href({ source: s })}
            aria-current={source === s ? "page" : undefined}
            className={cn("whitespace-nowrap rounded-full px-3 py-1 text-sm font-semibold", source === s ? "bg-night text-white" : "bg-white text-night ring-1 ring-line hover:ring-violet")}
          >
            {SOURCE_META[s][lang]}
          </Link>
        ))}
      </nav>

      {contacts.length === 0 ? (
        <EmptyClients />
      ) : view === "pipeline" ? (
        <Pipeline
          currency={currency}
          contacts={contacts.map((c) => ({
            id: c.id,
            full_name: c.full_name,
            company: c.company,
            source: c.source,
            campaign: c.campaign,
            stage: c.stage,
            value: c.value,
            phone: c.phone,
            last_activity_at: c.last_activity_at,
          }))}
        />
      ) : (
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="text-xs text-muted">
                <tr className="border-b border-line">
                  <th className="px-5 py-3 text-start font-semibold">{t("العميل", "Client")}</th>
                  <th className="px-5 py-3 text-start font-semibold">{t("المصدر", "Source")}</th>
                  <th className="px-5 py-3 text-start font-semibold">{t("المرحلة", "Stage")}</th>
                  <th className="px-5 py-3 text-start font-semibold">{t("المسؤول", "Owner")}</th>
                  <th className="px-5 py-3 text-start font-semibold">{t("آخر نشاط", "Last activity")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-lilac-50/50">
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/clients/${c.id}`} className="font-semibold text-night hover:text-violet">
                        {c.full_name}
                      </Link>
                      <p className="text-xs text-muted" dir="ltr" style={{ textAlign: lang === "en" ? "left" : "right" }}>
                        {c.phone ?? c.email}
                      </p>
                    </td>
                    <td className="max-w-[16rem] px-5 py-3">
                      <SourceBadge source={c.source} campaign={c.campaign} />
                    </td>
                    <td className="px-5 py-3">
                      <StageBadge stage={c.stage} />
                    </td>
                    <td className="px-5 py-3 text-muted">{c.assignee_id ? memberName.get(c.assignee_id) : "—"}</td>
                    <td className="px-5 py-3 text-muted">{formatDate(c.last_activity_at, lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Panel title={t("مصادر العملاء هذا الشهر", "Lead sources this month")}>
          {bySource.length ? (
            <ul className="space-y-3 p-5">
              {bySource.map(({ s, n }) => (
                <li key={s}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-semibold text-night">{SOURCE_META[s as ContactSource][lang]}</span>
                    <span className="text-muted">{n}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f3f0f9]">
                    <div className="h-full rounded-full bg-violet" style={{ width: `${(n / maxSource) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-10 text-center text-muted">{t("لا يوجد عملاء جدد هذا الشهر.", "No new clients this month.")}</p>
          )}
        </Panel>
        <Panel title={t("مصادر الربط التلقائي", "Automatic lead sources")}>
          <ul className="divide-y divide-line">
            <li className="px-5 py-4">
              <p className="font-semibold text-night">{t("الموقع (الحجوزات وتواصل معنا)", "Website (bookings & contact form)")}</p>
              <p className="text-sm text-muted">
                {t("يعمل تلقائياً، ويسجّل الحملة التي جاء منها الزائر (Google / Meta / UTM).", "Always on, and records the campaign that brought the visitor (Google / Meta / UTM).")}
              </p>
            </li>
            <li className="px-5 py-4">
              <p className="font-semibold text-night">{t("واتساب وإعلانات النقر للمراسلة", "WhatsApp & click-to-WhatsApp ads")}</p>
              <p className="text-sm text-muted">
                {waReady ? t("متصل — الرسائل الواردة تُضاف كعملاء.", "Connected — incoming messages become clients.") : t("يحتاج ربط WhatsApp Cloud API من", "Needs the WhatsApp Cloud API connected in")}{" "}
                {!waReady && admin.can("settings") && (
                  <Link href="/dashboard/settings?tab=integrations" className="font-semibold text-violet hover:underline">
                    {t("الإعدادات ← التكاملات", "Settings → Integrations")}
                  </Link>
                )}
              </p>
            </li>
            <li className="px-5 py-4">
              <p className="mb-2 font-semibold text-night">{t("نماذج إعلانات إنستغرام وفيسبوك", "Instagram & Facebook lead forms")}</p>
              <SyncLeadsButton />
            </li>
          </ul>
        </Panel>
      </div>
      <p className="mt-4 flex items-center gap-2 text-xs text-muted">
        <Users className="size-4" aria-hidden />
        {t(`المراحل: ${Object.values(STAGE_META).map((m) => m.ar).join(" ← ")}`, `Stages: ${Object.values(STAGE_META).map((m) => m.en).join(" → ")}`)}
      </p>
    </>
  );
}
