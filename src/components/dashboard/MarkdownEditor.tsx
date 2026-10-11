"use client";

import { useRef, useState, useTransition } from "react";
import { Bold, Eye, Heading2, Heading3, ImagePlus, Link2, List, ListOrdered, Loader2, PenLine, Quote } from "lucide-react";
import { uploadContentImage } from "@/actions/admin";
import { Prose } from "@/components/Prose";
import { cn } from "@/lib/utils";
import { useT } from "./DashLang";

type Props = {
  name: string;
  label: string;
  defaultValue?: string;
  rows?: number;
  required?: boolean;
  error?: string;
  hint?: string;
  folder?: "posts" | "projects" | "services";
  dir?: "rtl" | "ltr";
};

/**
 * Content editor for the site's text format: toolbar shortcuts, image upload into the text
 * (with alt text for SEO and accessibility), a live preview and word count.
 */
export function MarkdownEditor({ name, label, defaultValue = "", rows = 14, required, error, hint, folder = "posts", dir }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(defaultValue);
  const [preview, setPreview] = useState(false);
  const [uploading, startUpload] = useTransition();
  const [uploadError, setUploadError] = useState("");
  const id = `f-${name}`;
  const { t } = useT();
  // Content language (what's typed) vs. dashboard language (the editor's own labels).
  const isEn = dir === "ltr";
  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  /** Wraps the selection, or inserts a line block at the cursor. */
  const apply = (kind: "h2" | "h3" | "bold" | "list" | "ol" | "quote" | "link") => {
    const el = ref.current;
    if (!el) return;
    const { selectionStart: a, selectionEnd: b } = el;
    const selected = value.slice(a, b);
    let insert = "";
    if (kind === "bold") insert = `**${selected || (isEn ? "bold text" : "نص عريض")}**`;
    else if (kind === "link") insert = `[${selected || (isEn ? "link text" : "نص الرابط")}](https://)`;
    else {
      const prefix = { h2: "## ", h3: "### ", list: "- ", ol: "1. ", quote: "> " }[kind];
      const lines = (selected || (isEn ? "Text" : "نص")).split("\n").map((l, i) => (kind === "ol" ? `${i + 1}. ${l}` : prefix + l));
      const before = a > 0 && value[a - 1] !== "\n" ? "\n\n" : "";
      insert = `${before}${lines.join("\n")}\n`;
    }
    const next = value.slice(0, a) + insert + value.slice(b);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(a + insert.length, a + insert.length);
    });
  };

  const onFile = (f: File | undefined) => {
    if (!f) return;
    setUploadError("");
    const alt = window.prompt(t("وصف الصورة (نص بديل يساعد في SEO وإمكانية الوصول):", "Describe the image (alt text, helps SEO and accessibility):"), "") ?? "";
    startUpload(async () => {
      const fd = new FormData();
      fd.set("file", f);
      fd.set("folder", folder);
      const res = await uploadContentImage(fd);
      if (file.current) file.current.value = "";
      if (!res.url) {
        setUploadError(res.error ?? t("تعذّر رفع الصورة", "Could not upload the image"));
        return;
      }
      const el = ref.current;
      const at = el ? el.selectionStart : value.length;
      const snippet = `\n\n![${alt.replace(/[\[\]]/g, "")}](${res.url})\n\n`;
      setValue((v) => v.slice(0, at) + snippet + v.slice(at));
    });
  };

  const tools: { key: Parameters<typeof apply>[0]; label: string; Icon: typeof Bold }[] = [
    { key: "h2", label: t("عنوان رئيسي", "Heading"), Icon: Heading2 },
    { key: "h3", label: t("عنوان فرعي", "Subheading"), Icon: Heading3 },
    { key: "bold", label: t("نص عريض", "Bold"), Icon: Bold },
    { key: "list", label: t("قائمة نقطية", "Bulleted list"), Icon: List },
    { key: "ol", label: t("قائمة مرقمة", "Numbered list"), Icon: ListOrdered },
    { key: "quote", label: t("اقتباس", "Quote"), Icon: Quote },
    { key: "link", label: t("رابط", "Link"), Icon: Link2 },
  ];

  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-accent" aria-hidden>*</span>}
      </label>
      <div className={cn("overflow-hidden rounded-xl border-[1.5px] bg-white", error ? "border-[#b42318]" : "border-[#b6a5d6] focus-within:border-violet")}>
        <div className="flex flex-wrap items-center gap-1 border-b border-line bg-lilac-50 p-1.5" role="toolbar" aria-label={t("أدوات التنسيق", "Formatting")}>
          {tools.map(({ key, label: l, Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => apply(key)}
              disabled={preview}
              title={l}
              aria-label={l}
              className="flex size-9 items-center justify-center rounded-lg text-night transition-colors hover:bg-white disabled:opacity-40"
            >
              <Icon className="size-4" />
            </button>
          ))}
          <span className="mx-1 h-6 w-px bg-line" aria-hidden />
          <button
            type="button"
            onClick={() => file.current?.click()}
            disabled={preview || uploading}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-violet transition-colors hover:bg-white disabled:opacity-40"
          >
            {uploading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <ImagePlus className="size-4" aria-hidden />}
            {uploading ? t("جارٍ الرفع…", "Uploading…") : t("إدراج صورة", "Insert image")}
          </button>
          <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/gif" className="sr-only" tabIndex={-1} onChange={(e) => onFile(e.target.files?.[0])} />
          <button
            type="button"
            onClick={() => setPreview((p) => !p)}
            aria-pressed={preview}
            className={cn(
              "ms-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors",
              preview ? "bg-violet text-white" : "text-night hover:bg-white",
            )}
          >
            {preview ? <PenLine className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            {preview ? t("تحرير", "Edit") : t("معاينة", "Preview")}
          </button>
        </div>
        <textarea
          ref={ref}
          id={id}
          name={name}
          rows={rows}
          dir={dir}
          required={required}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={error ? true : undefined}
          className={cn("block w-full resize-y bg-white px-4 py-3 text-[15px] leading-8 text-night outline-none", preview && "hidden")}
        />
        {preview && (
          <div dir={dir} className="max-h-[560px] overflow-y-auto px-5 py-4">
            {value.trim() ? <Prose text={value} /> : <p className="text-muted">{t("لا يوجد محتوى بعد.", "Nothing written yet.")}</p>}
          </div>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap justify-between gap-2 text-[13px] text-muted">
        <span>{hint}</span>
        <span>
          {words} {t("كلمة", "words")} · ~{Math.max(1, Math.round(words / 180))} {t("د قراءة", "min read")}
        </span>
      </div>
      {uploadError && <p className="field-error">{uploadError}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
