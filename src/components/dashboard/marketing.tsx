"use client";

/* eslint-disable @next/next/no-img-element -- previews of arbitrary image URLs */
import { useActionState, useState } from "react";
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
  const [state, action, pending] = useActionState(saveMetaAssets, initial);
  return (
    <form action={action} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField label="الحساب الإعلاني" name="ad_account_id" defaultValue={current.ad_account_id ?? ""} required>
          <option value="" disabled>
            اختر الحساب
          </option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name} · {a.currency} {a.account_status !== 1 ? "(غير نشط)" : ""}
            </option>
          ))}
        </SelectField>
        <SelectField label="صفحة فيسبوك المرتبطة بواتساب" name="page_id" defaultValue={current.page_id ?? ""} required>
          <option value="" disabled>
            اختر الصفحة
          </option>
          {pages.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </SelectField>
      </div>
      <TextField
        label="رقم واتساب بيزنس المرتبط بالصفحة"
        name="whatsapp_number"
        dir="ltr"
        defaultValue={current.whatsapp_number ?? current.default_whatsapp}
        hint="بالصيغة الدولية بدون + (مثل 96894178876). يجب أن يكون مربوطاً بالصفحة في Meta Business Suite."
        error={state.errors?.whatsapp_number}
      />
      <FormAlert ok={state.ok} message={state.message} />
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        <Save className="size-4" aria-hidden />
        {pending ? "جارٍ الحفظ…" : "حفظ إعدادات الربط"}
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
export function ImagePicker({ name, images, defaultValue, error }: { name: string; images: { url: string; label: string }[]; defaultValue?: string; error?: string }) {
  const [value, setValue] = useState(defaultValue ?? images[0]?.url ?? "");
  return (
    <fieldset>
      <legend className="field-label">صورة الإعلان</legend>
      <input type="hidden" name={name} value={value} />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="صورة الإعلان">
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
      <p className="field-hint">الصور المربعة أو 1.91:1 تعطي أفضل نتيجة. يمكنك إضافة صور جديدة كغلاف لعمل في قسم «الأعمال».</p>
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
  const [state, action, pending] = useActionState(generateCampaign, initial);
  const e = state.errors ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-6">
      <fieldset className="space-y-5 rounded-[20px] border border-line bg-white p-5 sm:p-6">
        <legend className="sr-only">الهدف والجمهور</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="الخدمة المراد الإعلان عنها" name="service_slug" defaultValue={v.service_slug ?? services[0]?.slug} error={e.service_slug} required>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </SelectField>
          <SelectField label="لغة الإعلان" name="language" defaultValue={v.language ?? "ar"}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </SelectField>
        </div>
        <TextArea
          label="هدف الحملة"
          name="goal"
          rows={2}
          required
          defaultValue={v.goal}
          error={e.goal}
          placeholder="مثال: زيادة طلبات تصميم المواقع من الشركات الصغيرة في مسقط"
        />
        <TextArea
          label="الجمهور المستهدف"
          name="audience"
          rows={2}
          defaultValue={v.audience}
          error={e.audience}
          placeholder="مثال: أصحاب المطاعم والمتاجر الصغيرة، 25-50 سنة"
        />
        <TextField label="العرض أو ملاحظات إضافية" name="offer" defaultValue={v.offer} error={e.offer} placeholder="مثال: استشارة مجانية 30 دقيقة" />
      </fieldset>

      <fieldset className="space-y-5 rounded-[20px] border border-line bg-white p-5 sm:p-6">
        <legend className="sr-only">الميزانية والمدة</legend>
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField label="الدول (رموز ISO)" name="countries" dir="ltr" defaultValue={v.countries ?? "OM"} error={e.countries} hint="مثل: OM أو OM, AE, SA" />
          <TextField
            label={`الميزانية اليومية (${currency})`}
            name="daily_budget"
            type="number"
            min={1}
            step="0.01"
            dir="ltr"
            defaultValue={v.daily_budget ?? "10"}
            error={e.daily_budget}
          />
          <TextField label="المدة (أيام)" name="duration_days" type="number" min={2} max={90} dir="ltr" defaultValue={v.duration_days ?? "7"} error={e.duration_days} />
        </div>
        <ImagePicker name="image_url" images={images} defaultValue={v.image_url} error={e.image_url} />
      </fieldset>

      <div className="space-y-3">
        <FormAlert ok={false} message={state.message} />
        <button type="submit" className="btn btn-primary" disabled={pending || !aiReady}>
          {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Sparkles className="size-5" aria-hidden />}
          {pending ? "يكتب الذكاء الاصطناعي حملتك… (قد يستغرق دقيقة)" : "أنشئ الحملة بالذكاء الاصطناعي"}
        </button>
        <p className="text-sm text-muted">ستحصل على مسودة قابلة للتعديل. لا يُنشأ أي شيء في Meta قبل أن تراجعها وتضغط «إنشاء في Meta».</p>
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
          <legend className="sr-only">نص الإعلان</legend>
          <TextField label="اسم الحملة" name="campaign_name" defaultValue={v?.campaign_name ?? plan.campaign_name} error={e.campaign_name} />
          <TextField label="العنوان (40 حرفاً)" name="headline" maxLength={40} defaultValue={v?.headline ?? plan.headline} error={e.headline} />
          <TextArea label="النص الأساسي" name="primary_text" rows={5} maxLength={500} defaultValue={v?.primary_text ?? plan.primary_text} error={e.primary_text} />
          <TextField label="الوصف (30 حرفاً)" name="description" maxLength={30} defaultValue={v?.description ?? plan.description} error={e.description} />
          <TextArea label="رسالة الترحيب في واتساب" name="welcome_message" rows={2} maxLength={200} defaultValue={v?.welcome_message ?? plan.welcome_message} error={e.welcome_message} />
          <TextArea
            label="أسئلة سريعة يضغطها العميل (حتى 3، سؤال في كل سطر)"
            name="icebreakers"
            rows={3}
            defaultValue={v?.icebreakers ?? plan.icebreakers.join("\n")}
            error={e.icebreakers}
          />
        </fieldset>

        <fieldset disabled={locked} className="space-y-5 rounded-[20px] border border-line bg-white p-5 sm:p-6">
          <legend className="sr-only">الاستهداف والميزانية</legend>
          <div className="grid gap-5 sm:grid-cols-3">
            <TextField label="العمر من" name="age_min" type="number" min={18} max={65} dir="ltr" defaultValue={v?.age_min ?? String(plan.age_min)} error={e.age_min} />
            <TextField label="العمر إلى" name="age_max" type="number" min={18} max={65} dir="ltr" defaultValue={v?.age_max ?? String(plan.age_max)} error={e.age_max} />
            <SelectField label="الجنس" name="gender" defaultValue={v?.gender ?? plan.gender}>
              <option value="all">الكل</option>
              <option value="male">ذكور</option>
              <option value="female">إناث</option>
            </SelectField>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label="الدول" name="countries" dir="ltr" defaultValue={v?.countries ?? plan.countries.join(", ")} error={e.countries} />
            <TextField
              label="الاهتمامات (بالإنجليزية)"
              name="interests"
              dir="ltr"
              defaultValue={v?.interests ?? plan.interests.join(", ")}
              error={e.interests}
              hint="تُطابَق مع اهتمامات Meta عند الإنشاء؛ غير المعروف منها يُتجاهل."
            />
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField label={`الميزانية اليومية (${currency})`} name="daily_budget" type="number" min={1} step="0.01" dir="ltr" defaultValue={v?.daily_budget ?? String(dailyBudget)} error={e.daily_budget} />
            <TextField label="المدة (أيام)" name="duration_days" type="number" min={2} max={90} dir="ltr" defaultValue={v?.duration_days ?? String(durationDays)} error={e.duration_days} />
          </div>
          <ImagePicker name="image_url" images={images} defaultValue={v?.image_url ?? imageUrl ?? undefined} error={e.image_url} />
        </fieldset>

        {!locked && (
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-outline btn-sm" disabled={pending}>
              <Save className="size-4" aria-hidden />
              {pending ? "جارٍ الحفظ…" : "حفظ التعديلات"}
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
  return (
    <aside className="xl:sticky xl:top-6 xl:self-start" aria-label="معاينة الإعلان">
      <p className="mb-2 text-sm font-semibold text-muted">معاينة تقريبية</p>
      <div className="overflow-hidden rounded-[20px] border border-line bg-white shadow-[var(--shadow-soft)]">
        <div className="flex items-center gap-2 p-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-night text-xs font-bold text-white">ب</span>
          <div>
            <p className="text-sm font-semibold text-night">بريق Bariq</p>
            <p className="text-[11px] text-muted">إعلان ممول</p>
          </div>
        </div>
        <p className="whitespace-pre-line px-3 pb-3 text-[13px] leading-6 text-night">{text}</p>
        {image && <img src={image} alt="" className="aspect-square w-full object-cover" />}
        <div className="flex items-center justify-between gap-3 bg-[#f4f2f8] p-3">
          <p className="line-clamp-2 text-sm font-semibold text-night">{headline}</p>
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-[#e4e6eb] px-3 py-1.5 text-xs font-semibold text-night">
            <WhatsAppIcon className="size-3.5" />
            إرسال رسالة
          </span>
        </div>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
export function PublishForm({ id, ready, budgetSummary }: { id: string; ready: boolean; budgetSummary: string }) {
  const [state, action, pending] = useActionState(publishToMeta, initial);
  return (
    <form
      action={action}
      onSubmit={(ev) => {
        if (!window.confirm(`سيتم إنشاء الحملة في حسابك الإعلاني على Meta بحالة «متوقفة» (لن تُصرف أي أموال حتى تفعّلها بنفسك).\n\n${budgetSummary}\n\nهل تريد المتابعة؟`)) ev.preventDefault();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="btn btn-primary" disabled={pending || !ready}>
        {pending ? <Loader2 className="size-5 animate-spin" aria-hidden /> : <Rocket className="size-5" aria-hidden />}
        {pending ? "جارٍ الإنشاء في Meta…" : "إنشاء الحملة في Meta (متوقفة)"}
      </button>
      <FormAlert ok={state.ok} message={state.message} />
    </form>
  );
}
