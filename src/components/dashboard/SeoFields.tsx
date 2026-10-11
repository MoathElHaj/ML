"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { useT } from "./DashLang";

const TITLE_MAX = 60;
const DESC_MAX = 160;

/** SEO title + meta description with length counters and a Google result preview. */
export function SeoFields({
  suffix = "",
  path,
  fallbackTitle,
  fallbackDescription,
  title: initialTitle = "",
  description: initialDescription = "",
  errors = {},
  dir,
}: {
  suffix?: "" | "_en";
  path: string;
  fallbackTitle?: string;
  fallbackDescription?: string;
  title?: string;
  description?: string;
  errors?: Record<string, string>;
  dir?: "rtl" | "ltr";
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const { t } = useT();
  const en = suffix === "_en";
  const shownTitle = title || fallbackTitle || (en ? "Page title" : "عنوان الصفحة");
  const shownDesc = description || fallbackDescription || (en ? "Page description shown in search results." : "وصف الصفحة الذي يظهر في نتائج البحث.");
  const counter = (n: number, max: number) => <span className={cn("tabular-nums", n > max ? "font-semibold text-red-700" : "text-muted")}>{n}/{max}</span>;

  return (
    <div className="space-y-4" dir={dir}>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor={`f-meta_title${suffix}`} className="field-label">
            {t("عنوان SEO", "SEO title")}
          </label>
          {counter(title.length, TITLE_MAX)}
        </div>
        <input
          id={`f-meta_title${suffix}`}
          name={`meta_title${suffix}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          placeholder={fallbackTitle}
          className="field"
          aria-invalid={errors[`meta_title${suffix}`] ? true : undefined}
        />
        <p className="field-hint">{t("اتركه فارغاً لاستخدام العنوان الأساسي. الأفضل أقل من 60 حرفاً ويتضمن الكلمة المفتاحية.", "Leave empty to use the main title. Best under 60 characters, including the keyword.")}</p>
      </div>
      <div>
        <div className="flex items-center justify-between">
          <label htmlFor={`f-meta_description${suffix}`} className="field-label">
            {t("وصف SEO", "Meta description")}
          </label>
          {counter(description.length, DESC_MAX)}
        </div>
        <textarea
          id={`f-meta_description${suffix}`}
          name={`meta_description${suffix}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder={fallbackDescription}
          className="field !min-h-0"
        />
        <p className="field-hint">{t("ملخص يشجّع على النقر، بين 120 و160 حرفاً.", "Summarise the page and invite the click. 120–160 characters.")}</p>
      </div>
      <div className="rounded-2xl border border-line bg-white p-4" aria-label={t("معاينة Google", "Google preview")}>
        <p className="text-xs text-muted">{t("معاينة في Google", "Google preview")}</p>
        <p className="mt-2 truncate text-[13px] text-[#4d5156]" dir="ltr">
          bariq › {path.replace(/^\//, "").replace(/\//g, " › ")}
        </p>
        <p className="mt-0.5 line-clamp-1 text-lg text-[#1a0dab]">{shownTitle} | {en ? "Bariq Digital Agency" : "وكالة بريق الرقمية"}</p>
        <p className="mt-0.5 line-clamp-2 text-sm leading-6 text-[#4d5156]">{shownDesc}</p>
      </div>
    </div>
  );
}
