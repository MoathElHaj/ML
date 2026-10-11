"use client";

import Link from "next/link";
import { useActionState, useOptimistic, useState, useTransition } from "react";
import { GripVertical, MessageCircle, Phone, RefreshCw, Send, StickyNote, Users } from "lucide-react";
import { addActivity, moveContact, runMetaLeadSync, saveContact } from "@/actions/clients";
import { SOURCE_META, SOURCES, STAGE_META, STAGES, waLink } from "@/lib/crm";
import type { Contact, ContactStage, FormState } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { FormAlert, SelectField, TextArea, TextField } from "@/components/forms/Field";
import { Card, SaveBar } from "./kit";
import { useT } from "./DashLang";
import type { TeamOption } from "./tasks";

const initial: FormState = { ok: false };

export function StageBadge({ stage }: { stage: ContactStage }) {
  const { lang } = useT();
  const m = STAGE_META[stage];
  return <span className={cn("inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold", m.tone)}>{m[lang]}</span>;
}

export function SourceBadge({ source, campaign }: { source: Contact["source"]; campaign?: string | null }) {
  const { lang } = useT();
  const m = SOURCE_META[source];
  return (
    <span className={cn("inline-flex max-w-full items-center gap-1 truncate rounded-md px-2 py-0.5 text-xs font-semibold", m.tone)} title={campaign ?? undefined}>
      {m[lang]}
      {campaign && <span className="truncate font-normal opacity-80">· {campaign}</span>}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Pipeline (drag between stages)
// ---------------------------------------------------------------------------

export type PipelineCard = Pick<Contact, "id" | "full_name" | "company" | "source" | "campaign" | "stage" | "value" | "phone" | "last_activity_at"> & { assignee?: string | null };

export function Pipeline({ contacts, currency }: { contacts: PipelineCard[]; currency: string }) {
  const { t, lang } = useT();
  const [items, apply] = useOptimistic(contacts, (state, { id, stage }: { id: string; stage: ContactStage }) => state.map((c) => (c.id === id ? { ...c, stage } : c)));
  const [, start] = useTransition();
  const [over, setOver] = useState<ContactStage | null>(null);
  const move = (id: string, stage: ContactStage) =>
    start(async () => {
      apply({ id, stage });
      await moveContact(id, stage);
    });
  const money = (n: number) => new Intl.NumberFormat(lang === "en" ? "en-GB" : "ar-u-nu-latn", { maximumFractionDigits: 0 }).format(n);

  return (
    <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0">
      {STAGES.map((stage) => {
        const list = items.filter((c) => c.stage === stage);
        const total = list.reduce((s, c) => s + (c.value ?? 0), 0);
        return (
          <section
            key={stage}
            aria-label={STAGE_META[stage][lang]}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(stage);
            }}
            onDragLeave={() => setOver((o) => (o === stage ? null : o))}
            onDrop={(e) => {
              e.preventDefault();
              setOver(null);
              const id = e.dataTransfer.getData("text/contact");
              if (id) move(id, stage);
            }}
            className={cn("flex min-h-72 w-64 shrink-0 flex-col rounded-[20px] border bg-[#f3f0f9]/70 p-2.5 transition-colors", over === stage ? "border-violet bg-lilac-50" : "border-transparent")}
          >
            <header className="mb-2 px-1.5">
              <div className="flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-bold text-night">
                  <span className={cn("size-2.5 rounded-full", STAGE_META[stage].dot)} aria-hidden />
                  {STAGE_META[stage][lang]}
                </h3>
                <span className="text-xs font-semibold text-muted">{list.length}</span>
              </div>
              {total > 0 && (
                <p className="mt-0.5 text-xs text-muted">
                  {money(total)} {currency}
                </p>
              )}
            </header>
            <ul className="flex-1 space-y-2">
              {list.map((c) => (
                <li
                  key={c.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("text/contact", c.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="group cursor-grab rounded-2xl border border-line bg-white p-3 shadow-sm active:cursor-grabbing"
                >
                  <div className="flex items-start gap-2">
                    <GripVertical className="mt-0.5 size-4 shrink-0 text-[#bcaedb]" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <Link href={`/dashboard/clients/${c.id}`} className="block truncate font-semibold text-night hover:text-violet">
                        {c.full_name}
                      </Link>
                      {c.company && <p className="truncate text-xs text-muted">{c.company}</p>}
                      <div className="mt-2">
                        <SourceBadge source={c.source} campaign={c.campaign} />
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs text-muted">
                        <span>{formatDate(c.last_activity_at, lang)}</span>
                        {c.value ? (
                          <span className="font-semibold text-night">
                            {money(c.value)} {currency}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <label className="sr-only" htmlFor={`st-${c.id}`}>
                    {t("المرحلة", "Stage")}
                  </label>
                  <select
                    id={`st-${c.id}`}
                    value={c.stage}
                    onChange={(e) => move(c.id, e.target.value as ContactStage)}
                    className="mt-2 w-full rounded-lg border border-line bg-white px-2 py-1 text-xs text-muted lg:opacity-0 lg:group-hover:opacity-100 lg:focus:opacity-100"
                  >
                    {STAGES.map((s) => (
                      <option key={s} value={s}>
                        {t("نقل إلى: ", "Move to: ")}
                        {STAGE_META[s][lang]}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create / edit
// ---------------------------------------------------------------------------

export function ContactForm({
  contact,
  members,
  services,
}: {
  contact?: Contact;
  members: TeamOption[];
  services: { slug: string; title: string }[];
}) {
  const { t, lang } = useT();
  const [state, action, pending] = useActionState(saveContact, initial);
  const e = state.errors ?? {};
  const v = state.values;
  const val = (k: keyof Contact, fallback = "") => v?.[k] ?? (contact?.[k] == null ? fallback : Array.isArray(contact[k]) ? (contact[k] as string[]).join("، ") : String(contact[k]));

  return (
    <form action={action} className="space-y-6">
      {contact && <input type="hidden" name="id" value={contact.id} />}
      <Card title={t("بيانات العميل", "Client details")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label={t("الاسم", "Name")} name="full_name" required defaultValue={val("full_name")} error={e.full_name} />
          <TextField label={t("الشركة / المشروع", "Company / project")} name="company" defaultValue={val("company")} error={e.company} />
          <TextField label={t("الهاتف / واتساب", "Phone / WhatsApp")} name="phone" type="tel" dir="ltr" placeholder="+968 …" defaultValue={val("phone")} error={e.phone} />
          <TextField label={t("البريد الإلكتروني", "Email")} name="email" type="email" dir="ltr" defaultValue={val("email")} error={e.email} />
        </div>
      </Card>
      <Card title={t("المتابعة", "Pipeline")}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <SelectField label={t("المرحلة", "Stage")} name="stage" defaultValue={val("stage", "new")}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {STAGE_META[s][lang]}
              </option>
            ))}
          </SelectField>
          <SelectField label={t("المسؤول", "Owner")} name="assignee_id" defaultValue={val("assignee_id")}>
            <option value="">{t("غير محدد", "Unassigned")}</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.name}
              </option>
            ))}
          </SelectField>
          <TextField label={t("القيمة المتوقعة", "Expected value")} name="value" type="number" min={0} step="0.01" dir="ltr" defaultValue={val("value")} error={e.value} />
          <SelectField label={t("المصدر", "Source")} name="source" defaultValue={val("source", "manual")}>
            {SOURCES.map((s) => (
              <option key={s} value={s}>
                {SOURCE_META[s][lang]}
              </option>
            ))}
          </SelectField>
          <TextField label={t("الحملة", "Campaign")} name="campaign" defaultValue={val("campaign")} />
          <SelectField label={t("الخدمة المطلوبة", "Service")} name="service_slug" defaultValue={val("service_slug")}>
            <option value="">—</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </SelectField>
        </div>
        <TextField label={t("وسوم", "Tags")} name="tags" defaultValue={val("tags")} hint={t("افصل بينها بفاصلة.", "Separate with commas.")} />
        <TextArea label={t("ملاحظات", "Notes")} name="notes" rows={3} defaultValue={val("notes")} />
      </Card>
      <SaveBar pending={pending} state={state} label={contact ? undefined : t("إضافة العميل", "Add client")} />
    </form>
  );
}

// ---------------------------------------------------------------------------
// Activity composer
// ---------------------------------------------------------------------------

export function ActivityComposer({ contactId, phone, whatsappApi }: { contactId: string; phone: string | null; whatsappApi: boolean }) {
  const { t } = useT();
  const [kind, setKind] = useState<"note" | "call" | "whatsapp_out">("note");
  const [text, setText] = useState("");
  const [state, action, pending] = useActionState(async (prev: FormState, fd: FormData) => {
    const res = await addActivity(prev, fd);
    if (res.ok) setText("");
    return res;
  }, initial);
  const wa = waLink(phone, text || undefined);
  const tabs = [
    { key: "note" as const, label: t("ملاحظة", "Note"), Icon: StickyNote },
    { key: "call" as const, label: t("مكالمة", "Call"), Icon: Phone },
    { key: "whatsapp_out" as const, label: t("واتساب", "WhatsApp"), Icon: MessageCircle },
  ];

  return (
    <form action={action} className="rounded-[20px] border border-line bg-white p-3">
      <input type="hidden" name="contact_id" value={contactId} />
      <input type="hidden" name="kind" value={kind} />
      <div className="mb-2 flex gap-1" role="tablist">
        {tabs.map(({ key, label, Icon }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={kind === key}
            onClick={() => setKind(key)}
            className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold", kind === key ? "bg-night text-white" : "text-night hover:bg-lilac-50")}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <label htmlFor={`act-${contactId}`} className="sr-only">
        {t("النص", "Text")}
      </label>
      <textarea
        id={`act-${contactId}`}
        name="body"
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={4000}
        placeholder={
          kind === "note"
            ? t("اكتب ملاحظة داخلية…", "Write an internal note…")
            : kind === "call"
              ? t("ملخص المكالمة…", "Call summary…")
              : t("نص رسالة واتساب…", "WhatsApp message…")
        }
        className="field !min-h-0 text-sm"
      />
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {kind === "whatsapp_out" ? (
          <>
            {whatsappApi && (
              <button type="submit" name="send" value="1" className="btn btn-primary btn-sm" disabled={pending || !text.trim()}>
                <Send className="size-4 rtl:-scale-x-100" aria-hidden />
                {pending ? t("جارٍ الإرسال…", "Sending…") : t("إرسال من رقم الشركة", "Send from business number")}
              </button>
            )}
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className={cn("btn btn-sm", whatsappApi ? "btn-outline" : "btn-primary")}>
                <MessageCircle className="size-4" aria-hidden />
                {t("فتح في واتساب", "Open in WhatsApp")}
              </a>
            )}
            <button type="submit" className="btn btn-outline btn-sm" disabled={pending || !text.trim()}>
              {t("تسجيل فقط", "Log only")}
            </button>
          </>
        ) : (
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending || !text.trim()}>
            {pending ? t("جارٍ الحفظ…", "Saving…") : t("إضافة", "Add")}
          </button>
        )}
        <FormAlert ok={state.ok} message={state.message} />
      </div>
    </form>
  );
}

export function SyncLeadsButton() {
  const { t } = useT();
  const [state, setState] = useState<FormState>(initial);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" className="btn btn-outline btn-sm" disabled={pending} onClick={() => start(async () => setState(await runMetaLeadSync()))}>
        <RefreshCw className={cn("size-4", pending && "animate-spin")} aria-hidden />
        {pending ? t("جارٍ الجلب…", "Syncing…") : t("جلب نماذج Meta", "Sync Meta lead forms")}
      </button>
      <FormAlert ok={state.ok} message={state.message} />
    </div>
  );
}

export function EmptyClients() {
  const { t } = useT();
  return (
    <div className="rounded-[20px] border border-dashed border-line bg-white px-6 py-14 text-center">
      <Users className="mx-auto size-10 rounded-full bg-lilac-50 p-2 text-violet" aria-hidden />
      <p className="mt-3 font-bold text-night">{t("لا يوجد عملاء بعد", "No clients yet")}</p>
      <p className="mt-1 text-sm text-muted">{t("يُضاف العملاء تلقائياً من الحجوزات والرسائل وواتساب ونماذج الإعلانات.", "Clients arrive automatically from bookings, messages, WhatsApp and ad lead forms.")}</p>
    </div>
  );
}
