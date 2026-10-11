import Link from "next/link";
import { notFound } from "next/navigation";
import { Building2, CalendarDays, Mail, MessageCircle, Phone, Trash2 } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { getTeamOptions } from "@/lib/team";
import { getBookingSettings } from "@/lib/settings";
import { getWhatsAppSettings, isWhatsAppReady } from "@/lib/whatsapp";
import { ACTIVITY_META, STAGE_META, waLink } from "@/lib/crm";
import { deleteActivity, deleteContact } from "@/actions/clients";
import type { Contact, ContactActivity, Task } from "@/lib/types";
import { cn, formatDate, formatTime, todayIn } from "@/lib/utils";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { ActivityComposer, ContactForm, SourceBadge, StageBadge } from "@/components/dashboard/clients";
import { QuickAdd, TaskGroups } from "@/components/dashboard/tasks";
import { Panel } from "@/components/dashboard/ui";

const UTM_LABELS: Record<string, { ar: string; en: string }> = {
  utm_source: { ar: "المصدر", en: "Source" },
  utm_medium: { ar: "الوسيط", en: "Medium" },
  utm_campaign: { ar: "الحملة", en: "Campaign" },
  utm_term: { ar: "الكلمة", en: "Keyword" },
  utm_content: { ar: "المحتوى", en: "Content" },
  campaign_name: { ar: "الحملة", en: "Campaign" },
  adset_name: { ar: "المجموعة الإعلانية", en: "Ad set" },
  ad_name: { ar: "الإعلان", en: "Ad" },
  ad_id: { ar: "رقم الإعلان", en: "Ad ID" },
  form_name: { ar: "النموذج", en: "Form" },
  platform: { ar: "المنصة", en: "Platform" },
  headline: { ar: "عنوان الإعلان", en: "Ad headline" },
  landing: { ar: "صفحة الوصول", en: "Landing page" },
  referrer: { ar: "جاء من", en: "Referrer" },
  gclid: { ar: "Google Click ID", en: "Google Click ID" },
  fbclid: { ar: "Meta Click ID", en: "Meta Click ID" },
};

export default async function ClientPage(props: PageProps<"/dashboard/clients/[id]">) {
  const admin = await requireSection("clients");
  const { t, lang } = await getDashT();
  const { id } = await props.params;
  const db = admin.supabase;
  const { data } = await db.from("contacts").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const c = data as Contact;

  const [{ data: acts }, { data: tasks }, members, { data: services }, booking, wa, { data: bookings }] = await Promise.all([
    db.from("contact_activities").select("*").eq("contact_id", id).order("created_at", { ascending: false }).limit(100),
    db.from("tasks").select("*, contact:contacts(id, full_name)").eq("contact_id", id).order("status").order("due_date", { nullsFirst: false }).limit(50),
    getTeamOptions(admin),
    db.from("services").select("slug, title, title_en").order("sort_order"),
    getBookingSettings(),
    getWhatsAppSettings(),
    db.from("consultations").select("id, scheduled_date, scheduled_time, status").eq("contact_id", id).order("scheduled_date", { ascending: false }).limit(10),
  ]);
  const activities = (acts ?? []) as ContactActivity[];
  const memberName = new Map(members.map((m) => [m.user_id, m.name]));
  const today = todayIn(booking.time_zone);
  const ctx = { today, members, meId: admin.user.id, canAssignAll: admin.can("tasks") };
  const wa_link = waLink(c.wa_id ?? c.phone, t(`مرحباً ${c.full_name}، معك فريق بريق.`, `Hi ${c.full_name}, this is the Bariq team.`));
  const utm = Object.entries(c.utm ?? {}).filter(([, v]) => v);

  return (
    <>
      <div className="mb-6">
        <Link href="/dashboard/clients" className="text-sm font-semibold text-violet hover:underline">
          {t("→ العملاء", "← Clients")}
        </Link>
        <div className="mt-2 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[28px] font-bold text-night">{c.full_name}</h1>
              <StageBadge stage={c.stage} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
              <SourceBadge source={c.source} campaign={c.campaign} />
              {c.company && (
                <span className="inline-flex items-center gap-1.5">
                  <Building2 className="size-4" aria-hidden />
                  {c.company}
                </span>
              )}
              <span>
                {t("أضيف", "Added")} {formatDate(c.created_at, lang)}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {wa_link && (
              <a href={wa_link} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm">
                <MessageCircle className="size-4" aria-hidden />
                {t("واتساب", "WhatsApp")}
              </a>
            )}
            {c.phone && (
              <a href={`tel:${c.phone}`} className="btn btn-outline btn-sm">
                <Phone className="size-4" aria-hidden />
                <span dir="ltr">{c.phone}</span>
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className="btn btn-outline btn-sm">
                <Mail className="size-4" aria-hidden />
                {t("بريد", "Email")}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          <section aria-labelledby="timeline">
            <h2 id="timeline" className="mb-3 font-bold text-night">
              {t("سجل التواصل", "Activity")}
            </h2>
            <ActivityComposer contactId={c.id} phone={c.wa_id ?? c.phone} whatsappApi={isWhatsAppReady(wa)} />
            <ol className="mt-4 space-y-3">
              {activities.map((a) => {
                const inbound = a.kind === "whatsapp_in" || a.kind === "booking" || a.kind === "message" || a.kind === "lead";
                const stage = a.kind === "stage" ? (a.meta as { from?: keyof typeof STAGE_META; to?: keyof typeof STAGE_META }) : null;
                return (
                  <li key={a.id} className={cn("rounded-2xl border p-4", inbound ? "border-emerald-200 bg-emerald-50/50" : "border-line bg-white")}>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                      <span className="font-semibold text-night">
                        {ACTIVITY_META[a.kind][lang]}
                        {a.author_id && memberName.get(a.author_id) && <span className="font-normal text-muted"> · {memberName.get(a.author_id)}</span>}
                      </span>
                      <span className="flex items-center gap-2">
                        <time dateTime={a.created_at}>
                          {new Intl.DateTimeFormat(lang === "en" ? "en-GB" : "ar-u-nu-latn", { dateStyle: "medium", timeStyle: "short", timeZone: booking.time_zone }).format(new Date(a.created_at))}
                        </time>
                        {["note", "call", "email", "meeting"].includes(a.kind) && (
                          <form action={deleteActivity}>
                            <input type="hidden" name="id" value={a.id} />
                            <input type="hidden" name="contact_id" value={c.id} />
                            <ConfirmButton className="rounded p-1 hover:bg-red-50 hover:text-red-700" message={t("حذف هذا السجل؟", "Delete this entry?")} aria-label={t("حذف", "Delete")}>
                              <Trash2 className="size-3.5" aria-hidden />
                            </ConfirmButton>
                          </form>
                        )}
                      </span>
                    </div>
                    {stage?.from && stage.to ? (
                      <p className="mt-1.5 text-sm text-night">
                        {STAGE_META[stage.from]?.[lang] ?? stage.from} {lang === "en" ? "→" : "←"} <strong>{STAGE_META[stage.to]?.[lang] ?? stage.to}</strong>
                      </p>
                    ) : (
                      a.body && <p className="mt-1.5 whitespace-pre-line text-[15px] leading-7 text-night">{a.body}</p>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="space-y-6">
          <Panel title={t("مهام هذا العميل", "Tasks for this client")}>
            <div className="space-y-4 p-4">
              <QuickAdd {...ctx} contactId={c.id} compact />
              <TaskGroups tasks={(tasks ?? []) as Task[]} ctx={ctx} showDone />
            </div>
          </Panel>

          {(bookings?.length ?? 0) > 0 && (
            <Panel title={t("الاستشارات", "Bookings")}>
              <ul className="divide-y divide-line">
                {bookings!.map((b) => (
                  <li key={b.id} className="flex items-center gap-2 px-5 py-3 text-sm">
                    <CalendarDays className="size-4 text-violet" aria-hidden />
                    {formatDate(b.scheduled_date, lang)} · {formatTime(b.scheduled_time, lang)}
                  </li>
                ))}
              </ul>
            </Panel>
          )}

          {utm.length > 0 && (
            <Panel title={t("من أين جاء؟", "Where they came from")}>
              <dl className="space-y-2 p-5 text-sm">
                {utm.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3">
                    <dt className="shrink-0 text-muted">{UTM_LABELS[k]?.[lang] ?? k}</dt>
                    <dd className="min-w-0 truncate font-semibold text-night" dir="auto" title={String(v)}>
                      {String(v)}
                    </dd>
                  </div>
                ))}
              </dl>
            </Panel>
          )}
        </aside>
      </div>

      <details className="group mt-8 rounded-[20px] border border-line bg-white">
        <summary className="cursor-pointer list-none px-5 py-4 font-bold text-night marker:hidden">{t("تعديل بيانات العميل", "Edit client details")}</summary>
        <div className="border-t border-line p-5">
          <ContactForm contact={c} members={members} services={(services ?? []).map((s) => ({ slug: s.slug, title: (lang === "en" && s.title_en) || s.title }))} />
          <form action={deleteContact} className="mt-6 border-t border-line pt-5">
            <input type="hidden" name="id" value={c.id} />
            <ConfirmButton className="btn btn-danger btn-sm" message={t("حذف هذا العميل وكل سجله نهائياً؟", "Delete this client and their whole history?")}>
              <Trash2 className="size-4" aria-hidden />
              {t("حذف العميل", "Delete client")}
            </ConfirmButton>
          </form>
        </div>
      </details>
    </>
  );
}
