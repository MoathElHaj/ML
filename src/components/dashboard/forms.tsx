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
import { Toggle } from "./kit";
import { useT } from "./DashLang";

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
  const { t } = useT();
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
        label={t("الرابط (slug)", "URL slug")}
        name="slug"
        required
        dir="ltr"
        value={slugValue}
        onChange={(e) => {
          setTouched(true);
          setSlugValue(e.target.value.toLowerCase().replace(/\s+/g, "-"));
        }}
        error={errors.slug}
        hint={t(`سيظهر هكذا: ${slugPrefix}${slugValue || "your-link"} — أحرف إنجليزية وأرقام وشرطات فقط`, `Shows as ${slugPrefix}${slugValue || "your-link"} — English letters, numbers and dashes only`)}
      />
    </>
  );
}

function FormActions({ pending, cancelHref, state }: { pending: boolean; cancelHref: string; state: FormState }) {
  const { t } = useT();
  return (
    <div className="sticky bottom-0 -mx-4 flex flex-col gap-3 border-t border-line bg-white/95 px-4 py-4 backdrop-blur sm:-mx-8 sm:px-8">
      <FormAlert ok={false} message={state.message} />
      <div className="flex gap-3">
        <button type="submit" className="btn btn-primary" disabled={pending}>
          <Save className="size-4" aria-hidden />
          {pending ? t("جارٍ الحفظ…", "Saving…") : t("حفظ", "Save")}
        </button>
        <Link href={cancelHref} className="btn btn-outline">
          {t("إلغاء", "Cancel")}
        </Link>
      </div>
    </div>
  );
}

/** `arabic`: the card holds Arabic site content, so it stays right-to-left even when the dashboard is in English. */
function Card({ title, children, arabic }: { title: string; children: React.ReactNode; arabic?: boolean }) {
  const { lang } = useT();
  const rtlContent = arabic && lang === "en";
  return (
    <fieldset className="space-y-5 rounded-[20px] border border-line bg-white p-5 sm:p-6" {...(rtlContent ? { dir: "rtl", lang: "ar" } : {})}>
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
  const { t } = useT();
  return (
    <details className="group rounded-[20px] border border-line bg-white" open>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 sm:p-6">
        <span>
          <span className="block font-bold text-night">{t("النسخة الإنجليزية · English", "English version")}</span>
          <span className="block text-sm text-muted">
            {t("اختيارية — تظهر لزوار الموقع الإنجليزي (/en). عند تركها فارغة يُعرض النص العربي.", "Optional — shown on the English site (/en). When empty, the Arabic text is shown.")}
          </span>
        </span>
        <span className="text-sm font-semibold text-violet group-open:hidden">{t("إظهار", "Show")}</span>
        <span className="hidden text-sm font-semibold text-violet group-open:inline">{t("إخفاء", "Hide")}</span>
      </summary>
      <div dir="ltr" lang="en" className="space-y-5 border-t border-line p-5 text-left sm:p-6">
        {children}
      </div>
    </details>
  );
}

// ---------------------------------------------------------------------------
export function ServiceForm({ service }: { service?: Service }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(saveService, initial);
  const e = state.errors ?? {};
  const v = state.values;
  const [icon, setIcon] = useState(v?.icon ?? service?.icon ?? "sparkles");

  return (
    <form action={action} className="space-y-6" noValidate>
      {service && <input type="hidden" name="id" value={service.id} />}
      <Card title={t("المعلومات الأساسية", "Main content · Arabic")} arabic>
        <div className="grid gap-5 sm:grid-cols-2">
          <TitleSlug title={v?.title ?? service?.title} slug={v?.slug ?? service?.slug} errors={e} titleLabel={t("اسم الخدمة", "Service name")} slugPrefix="/services/" />
        </div>
        <TextField label={t("وصف مختصر", "Short summary")} name="summary" defaultValue={v?.summary ?? service?.summary} error={e.summary} hint={t("سطر واحد يظهر في بطاقة الخدمة.", "One line shown on the service card.")} />
        <TextArea label={t("الوصف الكامل", "Full description")} name="description" rows={5} defaultValue={v?.description ?? service?.description} error={e.description} />
        <TextArea
          label={t("ماذا تشمل الخدمة؟", "What's included")}
          name="features"
          rows={5}
          defaultValue={v?.features ?? service?.features.join("\n")}
          error={e.features}
          hint={t("ميزة واحدة في كل سطر.", "One item per line.")}
        />
        <MarkdownEditor
          label={t("محتوى صفحة الخدمة (اختياري)", "Service page content (optional)")}
          name="content"
          rows={10}
          folder="services"
          dir="rtl"
          defaultValue={v?.content ?? service?.content ?? ""}
          error={e.content}
          hint={t("يظهر في صفحة الخدمة: لمن تناسب، المراحل، الأسئلة الشائعة. محتوى أطول = ظهور أفضل في البحث.", "Shown on the service page: who it's for, steps, FAQs. Longer content ranks better.")}
        />
      </Card>
      <Card title={t("تحسين الظهور في محركات البحث (SEO)", "Search engine optimisation (SEO) · Arabic")} arabic>
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
      <Card title={t("المظهر", "Appearance")}>
        <div>
          <span className="field-label">{t("الأيقونة", "Icon")}</span>
          <input type="hidden" name="icon" value={icon} />
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("الأيقونة", "Icon")}>
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
        <ImageField key={state.message ?? "init"} name="image_url" label={t("صورة الخدمة", "Service image")} value={service?.image_url} error={e.image_url} />
      </Card>
      <Card title={t("النشر", "Publishing")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Toggle name="is_published" label={t("منشورة على الموقع", "Published on the website")} defaultChecked={v ? v.is_published === "on" : service?.is_published ?? true} />
          <TextField label={t("ترتيب الظهور", "Sort order")} name="sort_order" type="number" min={0} dir="ltr" defaultValue={v?.sort_order ?? String(service?.sort_order ?? 0)} error={e.sort_order} hint={t("الأصغر يظهر أولاً.", "Lower shows first.")} />
        </div>
      </Card>
      <FormActions pending={pending} cancelHref="/dashboard/services" state={state} />
    </form>
  );
}

// ---------------------------------------------------------------------------
export function ProjectForm({ project, services }: { project?: Project; services: { id: string; title: string }[] }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(saveProject, initial);
  const e = state.errors ?? {};
  const v = state.values;

  return (
    <form action={action} className="space-y-6" noValidate>
      {project && <input type="hidden" name="id" value={project.id} />}
      <Card title={t("المعلومات الأساسية", "Main content · Arabic")} arabic>
        <div className="grid gap-5 sm:grid-cols-2">
          <TitleSlug title={v?.title ?? project?.title} slug={v?.slug ?? project?.slug} errors={e} titleLabel={t("اسم المشروع", "Project name")} slugPrefix="/portfolio/" />
          <TextField label={t("اسم العميل", "Client name")} name="client" defaultValue={v?.client ?? project?.client ?? ""} error={e.client} />
          <SelectField label={t("الخدمة", "Service")} name="service_id" defaultValue={v?.service_id ?? project?.service_id ?? ""} error={e.service_id}>
            <option value="">{t("بدون", "None")}</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </SelectField>
        </div>
        <TextArea label={t("ملخص قصير", "Short summary")} name="summary" rows={2} defaultValue={v?.summary ?? project?.summary} error={e.summary} />
        <MarkdownEditor
          label={t("تفاصيل المشروع", "Project details")}
          name="description"
          rows={10}
          folder="projects"
          dir="rtl"
          defaultValue={v?.description ?? project?.description}
          error={e.description}
          hint={t("التحدي، الحل، والنتيجة. يمكنك إدراج صور من المشروع.", "Challenge, solution and result. You can insert images from the project.")}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label={t("رابط المشروع", "Project link")} name="link_url" type="url" dir="ltr" placeholder="https://" defaultValue={v?.link_url ?? project?.link_url ?? ""} error={e.link_url} />
          <TextField label={t("الوسوم", "Tags")} name="tags" defaultValue={v?.tags ?? project?.tags.join("، ")} error={e.tags} hint={t("افصل بينها بفاصلة، مثل: مطاعم، هوية بصرية", "Comma separated, e.g. مطاعم، هوية بصرية")} />
        </div>
      </Card>
      <EnglishCard>
        <TextField label="Project name" name="title_en" defaultValue={v?.title_en ?? project?.title_en ?? ""} error={e.title_en} />
        <TextArea label="Short summary" name="summary_en" rows={2} defaultValue={v?.summary_en ?? project?.summary_en ?? ""} error={e.summary_en} />
        <MarkdownEditor label="Project details" name="description_en" rows={8} folder="projects" dir="ltr" defaultValue={v?.description_en ?? project?.description_en ?? ""} error={e.description_en} />
        <TextField label="Tags" name="tags_en" defaultValue={v?.tags_en ?? project?.tags_en?.join(", ") ?? ""} error={e.tags_en} hint="Comma separated, e.g. Restaurants, Branding" />
      </EnglishCard>
      <Card title={t("صورة الغلاف", "Cover image")}>
        <ImageField key={state.message ?? "init"} name="cover_url" label={t("الصورة الرئيسية", "Main image")} value={project?.cover_url} error={e.cover_url} />
      </Card>
      <Card title={t("النشر", "Publishing")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Toggle name="is_published" label={t("منشور على الموقع", "Published on the website")} defaultChecked={v ? v.is_published === "on" : project?.is_published ?? true} />
          <Toggle name="is_featured" label={t("عمل مميز", "Featured")} hint={t("يظهر أولاً في الرئيسية", "Shown first on the home page")} defaultChecked={v ? v.is_featured === "on" : project?.is_featured} />
          <TextField label={t("ترتيب الظهور", "Sort order")} name="sort_order" type="number" min={0} dir="ltr" defaultValue={v?.sort_order ?? String(project?.sort_order ?? 0)} error={e.sort_order} />
        </div>
      </Card>
      <FormActions pending={pending} cancelHref="/dashboard/projects" state={state} />
    </form>
  );
}

// ---------------------------------------------------------------------------
export function PostForm({ post }: { post?: Post }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(savePost, initial);
  const e = state.errors ?? {};
  const v = state.values;

  return (
    <form action={action} className="space-y-6" noValidate>
      {post && <input type="hidden" name="id" value={post.id} />}
      {post?.published_at && <input type="hidden" name="published_at" value={post.published_at} />}
      <Card title={t("المقال", "Article · Arabic")} arabic>
        <div className="grid gap-5 sm:grid-cols-2">
          <TitleSlug title={v?.title ?? post?.title} slug={v?.slug ?? post?.slug} errors={e} titleLabel={t("عنوان المقال", "Title")} slugPrefix="/blog/" />
          <TextField label={t("التصنيف", "Category")} name="category" defaultValue={v?.category ?? post?.category ?? ""} error={e.category} placeholder="مثل: تسويق رقمي" />
          <TextField label={t("الكاتب", "Author")} name="author_name" defaultValue={v?.author_name ?? post?.author_name ?? "فريق بريق"} error={e.author_name} />
        </div>
        <TextArea label={t("مقتطف", "Excerpt")} name="excerpt" rows={2} defaultValue={v?.excerpt ?? post?.excerpt} error={e.excerpt} hint={t("جملة أو جملتان تظهر في قائمة المقالات ونتائج البحث.", "One or two sentences shown in the blog list and search results.")} />
        <MarkdownEditor
          label={t("المحتوى", "Content")}
          name="content"
          rows={18}
          required
          folder="posts"
          dir="rtl"
          defaultValue={v?.content ?? post?.content}
          error={e.content}
          hint={t("استخدم عناوين ## واضحة، وأضف روابط لصفحات خدماتك، وصوراً بوصف مناسب.", "Use clear ## headings, link to your service pages, and add images with good alt text.")}
        />
      </Card>
      <Card title={t("تحسين الظهور في محركات البحث (SEO)", "Search engine optimisation (SEO) · Arabic")} arabic>
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
      <Card title={t("صورة الغلاف", "Cover image")}>
        <ImageField key={state.message ?? "init"} name="cover_url" label={t("صورة المقال", "Article image")} value={post?.cover_url} error={e.cover_url} />
      </Card>
      <Card title={t("النشر", "Publishing")}>
        <Toggle
          name="is_published"
          label={t("نشر المقال", "Publish article")}
          hint={t("أوقفه لحفظ المقال كمسودة لا تظهر للزوار.", "Turn off to keep it as a hidden draft.")}
          defaultChecked={v ? v.is_published === "on" : post?.is_published ?? false}
        />
      </Card>
      <FormActions pending={pending} cancelHref="/dashboard/posts" state={state} />
    </form>
  );
}

// ---------------------------------------------------------------------------
export function PackageForm({ pkg }: { pkg?: Package }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(savePackage, initial);
  const e = state.errors ?? {};
  const v = state.values;
  return (
    <form action={action} className="space-y-6" noValidate>
      {pkg && <input type="hidden" name="id" value={pkg.id} />}
      <Card title={t("الباقة", "Package · Arabic")} arabic>
        <TextField label={t("اسم الباقة", "Package name")} name="name" required defaultValue={v?.name ?? pkg?.name} error={e.name} placeholder="مثل: الباقة الاحترافية" />
        <div className="grid gap-5 sm:grid-cols-3">
          <TextField label={t("السعر", "Price")} name="price" type="number" min={0} step="0.01" dir="ltr" required defaultValue={v?.price ?? (pkg ? String(pkg.price) : "")} error={e.price} />
          <TextField label={t("العملة", "Currency")} name="currency" dir="ltr" maxLength={3} defaultValue={v?.currency ?? pkg?.currency ?? "OMR"} error={e.currency} />
          <SelectField label={t("المدة", "Billing")} name="period" defaultValue={v?.period ?? pkg?.period ?? "month"}>
            <option value="month">{t("شهرياً", "Monthly")}</option>
            <option value="year">{t("سنوياً", "Yearly")}</option>
            <option value="once">{t("دفعة واحدة", "One-off")}</option>
          </SelectField>
        </div>
        <TextField label={t("وصف مختصر", "Short description")} name="tagline" defaultValue={v?.tagline ?? pkg?.tagline} error={e.tagline} placeholder="لمن تناسب هذه الباقة؟" />
        <TextArea label={t("ما تشمله الباقة", "What's included")} name="features" rows={6} required defaultValue={v?.features ?? pkg?.features.join("\n")} error={e.features} hint={t("ميزة واحدة في كل سطر.", "One item per line.")} />
        <TextField label={t("نص الزر", "Button text")} name="cta" defaultValue={v?.cta ?? pkg?.cta ?? ""} error={e.cta} placeholder="مثل: اختر الباقة الاحترافية" />
      </Card>
      <EnglishCard>
        <TextField label="Package name" name="name_en" defaultValue={v?.name_en ?? pkg?.name_en ?? ""} error={e.name_en} />
        <TextField label="Short description" name="tagline_en" defaultValue={v?.tagline_en ?? pkg?.tagline_en ?? ""} error={e.tagline_en} />
        <TextArea label="What's included" name="features_en" rows={6} defaultValue={v?.features_en ?? pkg?.features_en?.join("\n") ?? ""} error={e.features_en} hint="One item per line." />
        <TextField label="Button text" name="cta_en" defaultValue={v?.cta_en ?? pkg?.cta_en ?? ""} error={e.cta_en} />
      </EnglishCard>
      <Card title={t("العرض", "Display")}>
        <div className="grid gap-4 sm:grid-cols-3">
          <Toggle name="is_published" label={t("ظاهرة في صفحة الأسعار", "Shown on the pricing page")} defaultChecked={v ? v.is_published === "on" : pkg?.is_published ?? true} />
          <Toggle name="is_featured" label={t("«الأكثر طلباً»", "“Most popular”")} hint={t("تُميَّز في المنتصف", "Highlighted in the middle")} defaultChecked={v ? v.is_featured === "on" : pkg?.is_featured} />
          <TextField label={t("ترتيب الظهور", "Sort order")} name="sort_order" type="number" min={0} dir="ltr" defaultValue={v?.sort_order ?? String(pkg?.sort_order ?? 0)} error={e.sort_order} hint={t("الأصغر يظهر أولاً.", "Lower shows first.")} />
        </div>
      </Card>
      <FormActions pending={pending} cancelHref="/dashboard/pricing" state={state} />
    </form>
  );
}
