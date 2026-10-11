"use client";

/* eslint-disable @next/next/no-img-element -- previews of arbitrary image URLs */
import { useActionState, useState } from "react";
import { useT } from "./DashLang";
import { Loader2, Rocket, Save, Sparkles } from "lucide-react";
import { generateCampaign, publishToMeta, saveMetaAssets, savePlan } from "@/actions/marketing";
import type { AdPlan } from "@/lib/ai";
import type { FormState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FormAlert, SelectField, TextArea, TextField } from "@/components/forms/Field";
import { WhatsAppIcon } from "@/components/icons";

const initial: FormState = { ok: false };

// ---------------------------------------------------------------------------
export function AssetsForm({
  accounts,
  pages,
  current,
}: {
  accounts: { id: string; name: string; currency: string; account_status: number }[];
  pages: { id: string; name: string }[];
  current: { ad_account_id: string | null; page_id: string | null; whatsapp_number: string | null; default_whatsapp: string };
}) {
  const { t } = useT();
  const [state, action, pending] = useActionState(saveMetaAssets, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label={t("الحساب الإعلاني", "Ad account")} name="ad_account_id" defaultValue={current.ad_account_id ?? ""} required>
          <option value="" disabled>
            {t("اختر الحساب", "Choose an account")}
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.currency} {a.account_status !== 1 ? t("(غير نشط)", "(inactive)") : ""}
            </option>
          ))}
        </SelectField>
        <SelectField label={t("صفحة فيسبوك المرتبطة بواتساب", "Facebook Page linked to WhatsApp")} name="page_id" defaultValue={current.page_id ?? ""} required>
          <option value="" disabled>
            {t("اختر الصفحة", "Choose a Page")}
          </option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField
        label={t("رقم واتساب بيزنس المرتبط بالصفحة", "WhatsApp Business number linked to the Page")}
        name="whatsapp_number"
        dir="ltr"
        defaultValue={current.whatsapp_number ?? current.default_whatsapp}
        hint={t("بالصيغة الدولية بدون + (مثل 96894178876). يجب أن يكون مربوطاً بالصفحة في Meta Business Suite.", "International format without + (e.g. 96894178876). It must be linked to the Page in Meta Business Suite.")}
        error={state.errors?.whatsapp_number}
      />
      <FormAlert ok={state.ok} message={state.message} />
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        <Save className="size-4" aria-hidden />
        {pending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ إعدادات الربط", "Save connection")}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
export function ImagePicker({ name, images, defaultValue, error }: { name: string; images: { url: string; label: string }[]; defaultValue?: string; error?: string }) {
  const { t } = useT();
  const [value, setValue] = useState(defaultValue ?? images[0]?.url ?? "");
  return (
    <fieldset>
      <legend className="field-label">{t("صورة الإعلان", "Ad image")}</legend>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label={t("صورة الإعلان", "Ad image")}>
        {images.map((img) => (
          <button
            key={img.url}
            type="button"
            role="radio"
            aria-checked={value === img.url}
            aria-label={img.label}
            onClick={() => setValue(img.url)}
            className={cn(
              "relative aspect-square overflow-hidden rounded-xl border-[3px] transition-colors",
              value === img.url ? "border-violet" : "border-transparent hover:border-violet/40",
            )}
          >
            <img src={img.url} alt="" className="absolute inset-0 size-full object-cover" />
          </button>
        ))}
      </div>
      <p className="field-hint">{t("الصور المربعة أو 1.91:1 تعطي أفضل نتيجة. يمكنك إضافة صور جديدة كغلاف لعمل في قسم «الأعمال».", "Square or 1.91:1 images work best. Add new images as project covers in Portfolio.")}</p>
      {error && <p className="field-error">{error}</p>}
    </fieldset>
  );
}

// ---------------------------------------------------------------------------
export function BriefForm({
  services,
  images,
  currency,
  aiReady,
}: {
  services: { slug: string; title: string }[];
  images: { url: string; label: string }[];
  currency: string;
  aiReady: boolean;
}) {
  const { t } = useT();
  const [state, action, pending] = useActionState(generateCampaign, initial);
  const e = state.errors ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-5 rounded-[20px] border border-line bg-white p-5 sm:p-6">
        <legend className="sr-only">{t("الهدف والجمهور", "Goal & audience")}</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label={t("الخدمة المراد الإعلان عنها", "Service to advertise")} name="service_slug" defaultValue={v.service_slug ?? services[0]?.slug} error={e.service_slug} required>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </SelectField>
          <SelectField label={t("لغة الإعلان", "Ad language")} name="language" defaultValue={v.language ?? "ar"}>
            <option value="ar">{t("العربية", "Arabic")}</option>
            <option value="en">English</option>
          </SelectField>
        </div>
        <TextArea
          label={t("هدف الحملة", "Campaign goal")}
          name="goal"
          rows={2}
          required
          defaultValue={v.goal}
          error={e.goal}
          placeholder={t("مثال: زيادة طلبات تصميم المواقع من الشركات الصغيرة في مسقط", "e.g. More website requests from small businesses in Muscat")}
        />
        <TextArea
          label={t("الجمهور المستهدف", "Target audience")}
          name="audience"
          rows={2}
          defaultValue={v.audience}
          error={e.audience}
          placeholder={t("مثال: أصحاب المطاعم والمتاجر الصغيرة، 25-50 سنة", "e.g. Restaurant and small shop owners, 25–50")}
        />
        <TextField label={t("العرض أو ملاحظات إضافية", "Offer or extra notes")} name="offer" defaultValue={v.offer} error={e.offer} placeholder={t("مثال: استشارة مجانية 30 دقيقة", "e.g. Free 30-minute consultation")} />
      </fieldset>

      <fieldset className="space-y-5 rounded-[20px] border border-line bg-white p-5 sm:p-6">
        <legend className="sr-only">{t("الميزانية والمدة", "Budget & duration")}</legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField label={t("الدول (رموز ISO)", "Countries (ISO codes)")} name="countries" dir="ltr" defaultValue={v.countries ?? "OM"} error={e.countries} hint={t("مثل: OM أو OM, AE, SA", "e.g. OM or OM, AE, SA")} />
          <TextField
            label={t(`الميزانية اليومية (${currency})`, `Daily budget (${currency})`)}
            name="daily_budget"
            type="number"
            min={1}
            step="0.01"
            dir="ltr"
            defaultValue={v.daily_budget ?? "10"}
            error={e.daily_budget}
          />
          <TextField label={t("المدة (أيام)", "Duration (days)")} name="duration_days" type="number" min={2} max={90} dir="ltr" defaultValue={v.duration_days ?? "7"} error={e.duration_days} />
        </div>
        <ImagePicker name="image_url" images={images} defaultValue={v.image_url} error={e.image_url} />
      </fieldset>

      <div className="space-y-3">
        <FormAlert ok={false} message={state.message} />
        <button type="submit" className="btn btn-primary" disabled={pending || !aiReady}>
          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Sparkles className="size-5" aria-hidden />}
          {pending ? t("يكتب الذكاء الاصطناعي حملتك… (قد يستغرق دقيقة)", "AI is writing your campaign… (may take a minute)") : t("أنشئ الحملة بالذكاء الاصطناعي", "Draft the campaign with AI")}
        </button>
        <p className="text-sm text-muted">{t("ستحصل على مسودة قابلة للتعديل. لا يُنشأ أي شيء في Meta قبل أن تراجعها وتضغط «إنشاء في Meta».", "You'll get an editable draft. Nothing is created in Meta until you review it and press “Create in Meta”.")}</p>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------
export function PlanEditor({
  id,
  plan,
  dailyBudget,
  durationDays,
  imageUrl,
  images,
  currency,
  locked,
}: {
  id: string;
  plan: AdPlan;
  dailyBudget: number;
  durationDays: number;
  imageUrl: string | null;
  images: { url: string; label: string }[];
  currency: string;
  locked: boolean;
}) {
  const { t } = useT();
  const [state, action, pending] = useActionState(savePlan, initial);
  const e = state.errors ?? {};
  const v = state.values;
  const [preview, setPreview] = useState({ headline: plan.headline, text: plan.primary_text, image: imageUrl ?? "" });

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
      <form
        action={action}
        className="space-y-5"
        onChange={(ev) => {
          const f = ev.currentTarget;
          setPreview({
            headline: (f.elements.namedItem("headline") as HTMLInputElement)?.value ?? "",
            text: (f.elements.namedItem("primary_text") as HTMLTextAreaElement)?.value ?? "",
            image: (f.elements.namedItem("image_url") as HTMLInputElement)?.value ?? "",
          });
        }}
      >
        <input type="hidden" name="id" value={id} />
        <fieldset disabled={locked} className="space-y-5 rounded-[20px] border border-line bg-white p-5 sm:p-6">
          <legend className="sr-only">{t("نص الإعلان", "Ad copy")}</legend>
          <TextField label={t("اسم الحملة", "Campaign name")} name="campaign_name" defaultValue={v?.campaign_name ?? plan.campaign_name} error={e.campaign_name} />
          <TextField label={t("العنوان (40 حرفاً)", "Headline (40 chars)")} name="headline" maxLength={40} defaultValue={v?.headline ?? plan.headline} error={e.headline} />
          <TextArea label={t("النص الأساسي", "Primary text")} name="primary_text" rows={5} maxLength={500} defaultValue={v?.primary_text ?? plan.primary_text} error={e.primary_text} />
          <TextField label={t("الوصف (30 حرفاً)", "Description (30 chars)")} name="description" maxLength={30} defaultValue={v?.description ?? plan.description} error={e.description} />
          <TextArea label={t("رسالة الترحيب في واتساب", "WhatsApp welcome message")} name="welcome_message" rows={2} maxLength={200} defaultValue={v?.welcome_message ?? plan.welcome_message} error={e.welcome_message} />
          <TextArea
            label={t("أسئلة سريعة يضغطها العميل (حتى 3، سؤال في كل سطر)", "Quick questions the client can tap (up to 3, one per line)")}
            name="icebreakers"
            rows={3}
            defaultValue={v?.icebreakers ?? plan.icebreakers.join("\n")}
            error={e.icebreakers}
          />
        </fieldset>

        <fieldset disabled={locked} className="space-y-5 rounded-[20px] border border-line bg-white p-5 sm:p-6">
          <legend className="sr-only">{t("الاستهداف والميزانية", "Targeting & budget")}</legend>
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField label={t("العمر من", "Age from")} name="age_min" type="number" min={18} max={65} dir="ltr" defaultValue={v?.age_min ?? String(plan.age_min)} error={e.age_min} />
            <TextField label={t("العمر إلى", "Age to")} name="age_max" type="number" min={18} max={65} dir="ltr" defaultValue={v?.age_max ?? String(plan.age_max)} error={e.age_max} />
            <SelectField label={t("الجنس", "Gender")} name="gender" defaultValue={v?.gender ?? plan.gender}>
              <option value="all">{t("الكل", "All")}</option>
              <option value="male">{t("ذكور", "Men")}</option>
              <option value="female">{t("إناث", "Women")}</option>
            </SelectField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label={t("الدول", "Countries")} name="countries" dir="ltr" defaultValue={v?.countries ?? plan.countries.join(", ")} error={e.countries} />
            <TextField
              label={t("الاهتمامات (بالإنجليزية)", "Interests (in English)")}
              name="interests"
              dir="ltr"
              defaultValue={v?.interests ?? plan.interests.join(", ")}
              error={e.interests}
              hint={t("تُطابَق مع اهتمامات Meta عند الإنشاء؛ غير المعروف منها يُتجاهل.", "Matched to Meta interests on creation; unknown ones are skipped.")}
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label={t(`الميزانية اليومية (${currency})`, `Daily budget (${currency})`)} name="daily_budget" type="number" min={1} step="0.01" dir="ltr" defaultValue={v?.daily_budget ?? String(dailyBudget)} error={e.daily_budget} />
            <TextField label={t("المدة (أيام)", "Duration (days)")} name="duration_days" type="number" min={2} max={90} dir="ltr" defaultValue={v?.duration_days ?? String(durationDays)} error={e.duration_days} />
          </div>
          <ImagePicker name="image_url" images={images} defaultValue={v?.image_url ?? imageUrl ?? undefined} error={e.image_url} />
        </fieldset>

        {!locked && (
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
              <Save className="size-4" aria-hidden />
              {pending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ التعديلات", "Save changes")}
            </button>
            <FormAlert ok={state.ok} message={state.message} />
          </div>
        )}
      </form>

      <AdPreview headline={preview.headline} text={preview.text} image={preview.image} />
    </div>
  );
}

function AdPreview({ headline, text, image }: { headline: string; text: string; image: string }) {
  const { t } = useT();
  return (
    <aside className="xl:sticky xl:top-6 xl:self-start" aria-label={t("معاينة الإعلان", "Ad preview")}>
      <p className="mb-2 text-sm font-semibold text-muted">{t("معاينة تقريبية", "Approximate preview")}</p>
      <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 p-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-night text-xs font-bold text-white">ب</span>
          <div>
            <p className="text-sm font-semibold text-night">بريق Bariq</p>
            <p className="text-[11px] text-muted">{t("إعلان ممول", "Sponsored")}</p>
          </div>
        </div>
        <p className="whitespace-pre-line px-3 pb-3 text-[13px] leading-6 text-night">{text}</p>
        {image && <img src={image} alt="" className="aspect-square w-full object-cover" />}
        <div className="flex items-center justify-between gap-3 bg-[#f4f2f8] p-3">
          <p className="line-clamp-2 text-sm font-semibold text-night">{headline}</p>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#e4e6eb] px-3 py-1.5 text-xs font-semibold text-night">
            <WhatsAppIcon className="size-3.5" />
            {t("إرسال رسالة", "Send message")}
          </span>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
export function PublishForm({ id, ready, budgetSummary }: { id: string; ready: boolean; budgetSummary: string }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(publishToMeta, initial);
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (!window.confirm(t(`سيتم إنشاء الحملة في حسابك الإعلاني على Meta بحالة «متوقفة» (لن تُصرف أي أموال حتى تفعّلها بنفسك).\n\n${budgetSummary}\n\nهل تريد المتابعة؟`, `The campaign will be created in your Meta ad account as PAUSED (no money is spent until you activate it).\n\n${budgetSummary}\n\nContinue?`))) ev.preventDefault();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn btn-primary" disabled={pending || !ready}>
        {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Rocket className="size-5" aria-hidden />}
        {pending ? t("جارٍ الإنشاء في Meta…", "Creating in Meta…") : t("إنشاء الحملة في Meta (متوقفة)", "Create in Meta (paused)")}
      </button>
      <FormAlert ok={state.ok} message={state.message} />
    </form>
  );
}
