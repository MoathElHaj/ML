"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { savePackage, savePost, saveProject, saveService } from "@/actions/admin";
import type { FormState, Package, Post, Project, Service } from "@/lib/types";
import { slugify } from "@/lib/utils";
import { FormAlert, SelectField, TextArea, TextField } from "@/components/forms/Field";
import { ServiceIcon, serviceIconOptions } from "@/components/icons";
import { ImageField } from "./ImageField";
import { MarkdownEditor } from "./MarkdownEditor";
import { SeoFields } from "./SeoFields";
import { cn } from "@/lib/utils";

const initial: FormState = { ok: false };

/** Title + slug pair: the slug follows a Latin title until edited by hand. */
function TitleSlug({
  title,
  slug,
  errors,
  titleLabel,
  slugPrefix,
}: {
  title?: string;
  slug?: string;
  errors: Record<string, string>;
  titleLabel: string;
  slugPrefix: string;
}) {
  const [slugValue, setSlugValue] = useState(slug ?? "");
  const [touched, setTouched] = useState(Boolean(slug));
  return (
    <>
      <TextField
        label={titleLabel}
        name="title"
        required
        defaultValue={title}
        error={errors.title}
        onChange={(e) => {
          if (!touched) setSlugValue(slugify(e.target.value));
        }}
      />
      <TextField
        label="الرابط (slug)"
        name="slug"
        required
        dir="ltr"
        value={slugValue}
        onChange={(e) => {
          setTouched(true);
          setSlugValue(e.target.value.toLowerCase().replace(/\s+/g, "-"));
        }}
        error={errors.slug}
        hint={`سيظهر هكذا: ${slugPrefix}${slugValue || "your-link"} — أحرف إنجليزية وأرقام وشرطات فقط`}
      />
    </>
  );
}

function Toggle({ name, label, hint, defaultChecked }: { name: string; label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-4">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-[#cfc4e3] transition-colors peer-checked:bg-violet peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-violet after:absolute after:top-0.5 after:start-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:-translate-x-5" />
      <span>
        <span className="block font-semibold text-night">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </label>
  );
}

function FormActions({ pending, cancelHref, state }: { pending: boolean; cancelHref: string; state: FormState }) {
  return (
    <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-line bg-white/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
      <FormAlert ok={false} message={state.message} />
      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          <Save className="size-4" aria-hidden />
          {pending ? "جارٍ الحفظ…" : "حفظ"}
        </button>
        <Link href={cancelHref} className="btn btn-outline">
          إلغاء
        </Link>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-5 rounded-[20px] border border-line bg-white p-5 sm:p-6">
      <legend className="sr-only">{title}</legend>
      <h2 className="font-bold text-night" aria-hidden>
        {title}
      </h2>
      {children}
    </fieldset>
  );
}

/** Optional English version. The site shows Arabic when a field is left empty. */
function EnglishCard({ children }: { children: React.ReactNode }) {
  return (
    <details className="group rounded-[20px] border border-line bg-white" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 sm:p-6">
        <span>
          <span className="block font-bold text-night">النسخة الإنجليزية · English</span>
          <span className="block text-sm text-muted">اختيارية — تظهر لزوار الموقع الإنجليزي (/en). عند تركها فارغة يُعرض النص العربي.</span>
        </span>
        <span className="text-sm font-semibold text-violet group-open:hidden">إظهار</span>
        <span className="hidden text-sm font-semibold text-violet group-open:inline">إخفاء</span>
      </summary>
      <div dir="ltr" lang="en" className="space-y-5 border-t border-line p-5 text-left sm:p-6">
        {children}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
export function ServiceForm({ service }: { service?: Service }) {
  const [state, action, pending] = useActionState(saveService, initial);
  const e = state.errors ?? {};
  const v = state.values;
  const [icon, setIcon] = useState(v?.icon ?? service?.icon ?? "sparkles");

  return (
    <form action={action} className="space-y-6" noValidate>
      {service && <input type="hidden" name="id" value={service.id} />}
      <Card title="المعلومات الأساسية">
        <div className="grid gap-5 sm:grid-cols-2">
          <TitleSlug title={v?.title ?? service?.title} slug={v?.slug ?? service?.slug} errors={e} titleLabel="اسم الخدمة" slugPrefix="/services/" />
        </div>
        <TextField label="وصف مختصر" name="summary" defaultValue={v?.summary ?? service?.summary} error={e.summary} hint="سطر واحد يظهر في بطاقة الخدمة." />
        <TextArea label="الوصف الكامل" name="description" rows={5} defaultValue={v?.description ?? service?.description} error={e.description} />
        <TextArea
          label="ماذا تشمل الخدمة؟"
          name="features"
          rows={5}
          defaultValue={v?.features ?? service?.features.join("\n")}
          error={e.features}
          hint="ميزة واحدة في كل سطر."
        />
        <MarkdownEditor
          label="محتوى صفحة الخدمة (اختياري)"
          name="content"
          rows={10}
          folder="services"
          defaultValue={v?.content ?? service?.content ?? ""}
          error={e.content}
          hint="يظهر في صفحة الخدمة: لمن تناسب، المراحل، الأسئلة الشائعة. محتوى أطول = ظهور أفضل في البحث."
        />
      </Card>
      <Card title="تحسين الظهور في محركات البحث (SEO)">
        <SeoFields
          path={`/services/${service?.slug ?? "…"}`}
          fallbackTitle={service?.title}
          fallbackDescription={service?.summary}
          title={v?.meta_title ?? service?.meta_title ?? ""}
          description={v?.meta_description ?? service?.meta_description ?? ""}
          errors={e}
        />
      </Card>
      <EnglishCard>
        <TextField label="Service name" name="title_en" defaultValue={v?.title_en ?? service?.title_en ?? ""} error={e.title_en} />
        <TextField label="Short summary" name="summary_en" defaultValue={v?.summary_en ?? service?.summary_en ?? ""} error={e.summary_en} />
        <TextArea label="Full description" name="description_en" rows={4} defaultValue={v?.description_en ?? service?.description_en ?? ""} error={e.description_en} />
        <TextArea
          label="What's included"
          name="features_en"
          rows={4}
          defaultValue={v?.features_en ?? service?.features_en?.join("\n") ?? ""}
          error={e.features_en}
          hint="One item per line."
        />
        <MarkdownEditor label="Service page content" name="content_en" rows={8} folder="services" dir="ltr" defaultValue={v?.content_en ?? service?.content_en ?? ""} error={e.content_en} />
        <SeoFields
          suffix="_en"
          dir="ltr"
          path={`/en/services/${service?.slug ?? "…"}`}
          fallbackTitle={service?.title_en ?? undefined}
          fallbackDescription={service?.summary_en ?? undefined}
          title={v?.meta_title_en ?? service?.meta_title_en ?? ""}
          description={v?.meta_description_en ?? service?.meta_description_en ?? ""}
          errors={e}
        />
      </EnglishCard>
      <Card title="المظهر">
        <div>
          <span className="field-label">الأيقونة</span>
          <input type="hidden" name="icon" value={icon} />
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="الأيقونة">
            {serviceIconOptions.map((name) => (
              <button
                key={name}
                type="button"
                role="radio"
                aria-checked={icon === name}
                aria-label={name}
                onClick={() => setIcon(name)}
                className={cn(
                  "flex size-12 items-center justify-center rounded-xl border-[1.5px] transition-colors",
                  icon === name ? "border-violet bg-violet text-white" : "border-line text-night hover:border-violet",
                )}
              >
                <ServiceIcon name={name} className="size-5" aria-hidden />
              </button>
            ))}
          </div>
        </div>
        <ImageField key={state.message ?? "init"} name="image_url" label="صورة الخدمة" value={service?.image_url} error={e.image_url} />
      </Card>
      <Card title="النشر">
        <div className="grid gap-5 sm:grid-cols-2">
          <Toggle name="is_published" label="منشورة على الموقع" defaultChecked={v ? v.is_published === "on" : service?.is_published ?? true} />
          <TextField label="ترتيب الظهور" name="sort_order" type="number" min={0} dir="ltr" defaultValue={v?.sort_order ?? String(service?.sort_order ?? 0)} error={e.sort_order} hint="الأصغر يظهر أولاً." />
        </div>
      </Card>
      <FormActions pending={pending} cancelHref="/dashboard/services" state={state} />
    </form>
  );
}

// ---------------------------------------------------------------------------
export function ProjectForm({ project, services }: { project?: Project; services: { id: string; title: string }[] }) {
  const [state, action, pending] = useActionState(saveProject, initial);
  const e = state.errors ?? {};
  const v = state.values;

  return (
    <form action={action} className="space-y-6" noValidate>
      {project && <input type="hidden" name="id" value={project.id} />}
      <Card title="المعلومات الأساسية">
        <div className="grid gap-5 sm:grid-cols-2">
          <TitleSlug title={v?.title ?? project?.title} slug={v?.slug ?? project?.slug} errors={e} titleLabel="اسم المشروع" slugPrefix="/portfolio/" />
          <TextField label="اسم العميل" name="client" defaultValue={v?.client ?? project?.client ?? ""} error={e.client} />
          <SelectField label="الخدمة" name="service_id" defaultValue={v?.service_id ?? project?.service_id ?? ""} error={e.service_id}>
            <option value="">بدون</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </SelectField>
        </div>
        <TextArea label="ملخص قصير" name="summary" rows={2} defaultValue={v?.summary ?? project?.summary} error={e.summary} />
        <MarkdownEditor
          label="تفاصيل المشروع"
          name="description"
          rows={10}
          folder="projects"
          defaultValue={v?.description ?? project?.description}
          error={e.description}
          hint="التحدي، الحل، والنتيجة. يمكنك إدراج صور من المشروع."
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="رابط المشروع" name="link_url" type="url" dir="ltr" placeholder="https://" defaultValue={v?.link_url ?? project?.link_url ?? ""} error={e.link_url} />
          <TextField label="الوسوم" name="tags" defaultValue={v?.tags ?? project?.tags.join("، ")} error={e.tags} hint="افصل بينها بفاصلة، مثل: مطاعم، هوية بصرية" />
        </div>
      </Card>
      <EnglishCard>
        <TextField label="Project name" name="title_en" defaultValue={v?.title_en ?? project?.title_en ?? ""} error={e.title_en} />
        <TextArea label="Short summary" name="summary_en" rows={2} defaultValue={v?.summary_en ?? project?.summary_en ?? ""} error={e.summary_en} />
        <MarkdownEditor label="Project details" name="description_en" rows={8} folder="projects" dir="ltr" defaultValue={v?.description_en ?? project?.description_en ?? ""} error={e.description_en} />
        <TextField label="Tags" name="tags_en" defaultValue={v?.tags_en ?? project?.tags_en?.join(", ") ?? ""} error={e.tags_en} hint="Comma separated, e.g. Restaurants, Branding" />
      </EnglishCard>
      <Card title="صورة الغلاف">
        <ImageField key={state.message ?? "init"} name="cover_url" label="الصورة الرئيسية" value={project?.cover_url} error={e.cover_url} />
      </Card>
      <Card title="النشر">
        <div className="grid gap-4 sm:grid-cols-3">
          <Toggle name="is_published" label="منشور على الموقع" defaultChecked={v ? v.is_published === "on" : project?.is_published ?? true} />
          <Toggle name="is_featured" label="عمل مميز" hint="يظهر أولاً في الرئيسية" defaultChecked={v ? v.is_featured === "on" : project?.is_featured} />
          <TextField label="ترتيب الظهور" name="sort_order" type="number" min={0} dir="ltr" defaultValue={v?.sort_order ?? String(project?.sort_order ?? 0)} error={e.sort_order} />
        </div>
      </Card>
      <FormActions pending={pending} cancelHref="/dashboard/projects" state={state} />
    </form>
  );
}

// ---------------------------------------------------------------------------
export function PostForm({ post }: { post?: Post }) {
  const [state, action, pending] = useActionState(savePost, initial);
  const e = state.errors ?? {};
  const v = state.values;

  return (
    <form action={action} className="space-y-6" noValidate>
      {post && <input type="hidden" name="id" value={post.id} />}
      {post?.published_at && <input type="hidden" name="published_at" value={post.published_at} />}
      <Card title="المقال">
        <div className="grid gap-5 sm:grid-cols-2">
          <TitleSlug title={v?.title ?? post?.title} slug={v?.slug ?? post?.slug} errors={e} titleLabel="عنوان المقال" slugPrefix="/blog/" />
          <TextField label="التصنيف" name="category" defaultValue={v?.category ?? post?.category ?? ""} error={e.category} placeholder="مثل: تسويق رقمي" />
          <TextField label="الكاتب" name="author_name" defaultValue={v?.author_name ?? post?.author_name ?? "فريق بريق"} error={e.author_name} />
        </div>
        <TextArea label="مقتطف" name="excerpt" rows={2} defaultValue={v?.excerpt ?? post?.excerpt} error={e.excerpt} hint="جملة أو جملتان تظهر في قائمة المقالات ونتائج البحث." />
        <MarkdownEditor
          label="المحتوى"
          name="content"
          rows={18}
          required
          folder="posts"
          defaultValue={v?.content ?? post?.content}
          error={e.content}
          hint="استخدم عناوين ## واضحة، وأضف روابط لصفحات خدماتك، وصوراً بوصف مناسب."
        />
      </Card>
      <Card title="تحسين الظهور في محركات البحث (SEO)">
        <SeoFields
          path={`/blog/${post?.slug ?? "…"}`}
          fallbackTitle={post?.title}
          fallbackDescription={post?.excerpt}
          title={v?.meta_title ?? post?.meta_title ?? ""}
          description={v?.meta_description ?? post?.meta_description ?? ""}
          errors={e}
        />
      </Card>
      <EnglishCard>
        <p className="text-sm text-muted">The article appears on the English blog only when it has an English title and content.</p>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label="Title" name="title_en" defaultValue={v?.title_en ?? post?.title_en ?? ""} error={e.title_en} />
          <TextField label="Category" name="category_en" defaultValue={v?.category_en ?? post?.category_en ?? ""} error={e.category_en} placeholder="e.g. Digital marketing" />
        </div>
        <TextArea label="Excerpt" name="excerpt_en" rows={2} defaultValue={v?.excerpt_en ?? post?.excerpt_en ?? ""} error={e.excerpt_en} />
        <MarkdownEditor label="Content" name="content_en" rows={14} folder="posts" dir="ltr" defaultValue={v?.content_en ?? post?.content_en ?? ""} error={e.content_en} />
        <SeoFields
          suffix="_en"
          dir="ltr"
          path={`/en/blog/${post?.slug ?? "…"}`}
          fallbackTitle={post?.title_en ?? undefined}
          fallbackDescription={post?.excerpt_en ?? undefined}
          title={v?.meta_title_en ?? post?.meta_title_en ?? ""}
          description={v?.meta_description_en ?? post?.meta_description_en ?? ""}
          errors={e}
        />
      </EnglishCard>
      <Card title="صورة الغلاف">
        <ImageField key={state.message ?? "init"} name="cover_url" label="صورة المقال" value={post?.cover_url} error={e.cover_url} />
      </Card>
      <Card title="النشر">
        <Toggle
          name="is_published"
          label="نشر المقال"
          hint="أوقفه لحفظ المقال كمسودة لا تظهر للزوار."
          defaultChecked={v ? v.is_published === "on" : post?.is_published ?? false}
        />
      </Card>
      <FormActions pending={pending} cancelHref="/dashboard/posts" state={state} />
    </form>
  );
}

// ---------------------------------------------------------------------------
export function PackageForm({ pkg }: { pkg?: Package }) {
  const [state, action, pending] = useActionState(savePackage, initial);
  const e = state.errors ?? {};
  const v = state.values;
  return (
    <form action={action} className="space-y-6" noValidate>
      {pkg && <input type="hidden" name="id" value={pkg.id} />}
      <Card title="الباقة">
        <TextField label="اسم الباقة" name="name" required defaultValue={v?.name ?? pkg?.name} error={e.name} placeholder="مثل: الباقة الاحترافية" />
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField label="السعر" name="price" type="number" min={0} step="0.01" dir="ltr" required defaultValue={v?.price ?? (pkg ? String(pkg.price) : "")} error={e.price} />
          <TextField label="العملة" name="currency" dir="ltr" maxLength={3} defaultValue={v?.currency ?? pkg?.currency ?? "OMR"} error={e.currency} />
          <SelectField label="المدة" name="period" defaultValue={v?.period ?? pkg?.period ?? "month"}>
            <option value="month">شهرياً</option>
            <option value="year">سنوياً</option>
            <option value="once">دفعة واحدة</option>
          </SelectField>
        </div>
        <TextField label="وصف مختصر" name="tagline" defaultValue={v?.tagline ?? pkg?.tagline} error={e.tagline} placeholder="لمن تناسب هذه الباقة؟" />
        <TextArea label="ما تشمله الباقة" name="features" rows={6} required defaultValue={v?.features ?? pkg?.features.join("\n")} error={e.features} hint="ميزة واحدة في كل سطر." />
        <TextField label="نص الزر" name="cta" defaultValue={v?.cta ?? pkg?.cta ?? ""} error={e.cta} placeholder="مثل: اختر الباقة الاحترافية" />
      </Card>
      <EnglishCard>
        <TextField label="Package name" name="name_en" defaultValue={v?.name_en ?? pkg?.name_en ?? ""} error={e.name_en} />
        <TextField label="Short description" name="tagline_en" defaultValue={v?.tagline_en ?? pkg?.tagline_en ?? ""} error={e.tagline_en} />
        <TextArea label="What's included" name="features_en" rows={6} defaultValue={v?.features_en ?? pkg?.features_en?.join("\n") ?? ""} error={e.features_en} hint="One item per line." />
        <TextField label="Button text" name="cta_en" defaultValue={v?.cta_en ?? pkg?.cta_en ?? ""} error={e.cta_en} />
      </EnglishCard>
      <Card title="العرض">
        <div className="grid gap-4 sm:grid-cols-3">
          <Toggle name="is_published" label="ظاهرة في صفحة الأسعار" defaultChecked={v ? v.is_published === "on" : pkg?.is_published ?? true} />
          <Toggle name="is_featured" label="«الأكثر طلباً»" hint="تُميَّز في المنتصف" defaultChecked={v ? v.is_featured === "on" : pkg?.is_featured} />
          <TextField label="ترتيب الظهور" name="sort_order" type="number" min={0} dir="ltr" defaultValue={v?.sort_order ?? String(pkg?.sort_order ?? 0)} error={e.sort_order} hint="الأصغر يظهر أولاً." />
        </div>
      </Card>
      <FormActions pending={pending} cancelHref="/dashboard/pricing" state={state} />
    </form>
  );
}
