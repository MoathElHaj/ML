"use client";

/* eslint-disable @next/next/no-img-element -- local previews of picked files can't use next/image */
import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { useT } from "./DashLang";

export function ImageField({ name, label, value, error }: { name: string; label: string; value?: string | null; error?: string }) {
  const { t } = useT();
  const [preview, setPreview] = useState<string | null>(value ?? null);
  const [removed, setRemoved] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div>
      <span className="field-label">{label}</span>
      <input type="hidden" name={name} value={value ?? ""} />
      {removed && <input type="hidden" name={`${name}_remove`} value="on" />}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex aspect-[16/10] w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl border-[1.5px] border-dashed border-[#b6a5d6] bg-lilac-50 sm:w-60">
          {preview ? <img src={preview} alt="" className="absolute inset-0 size-full object-cover" /> : <ImagePlus className="size-8 text-violet/60" aria-hidden />}
        </div>
        <div className="space-y-2">
          <label className="btn btn-outline btn-sm cursor-pointer">
            <ImagePlus className="size-4" aria-hidden />
            {preview ? t("تغيير الصورة", "Change image") : t("اختيار صورة", "Choose image")}
            <input
              ref={input}
              type="file"
              name={`${name}_file`}
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setPreview(URL.createObjectURL(file));
                  setRemoved(false);
                }
              }}
            />
          </label>
          {preview && (
            <button
              type="button"
              className="btn btn-danger btn-sm ms-2"
              onClick={() => {
                setPreview(null);
                setRemoved(true);
                if (input.current) input.current.value = "";
              }}
            >
              <Trash2 className="size-4" aria-hidden />
              {t("إزالة", "Remove")}
            </button>
          )}
          <p className="field-hint">{t("JPG أو PNG أو WebP، بحد أقصى 5 ميغابايت. المقاس المقترح 1600×1000.", "JPG, PNG or WebP, up to 5 MB. Suggested size 1600×1000.")}</p>
          {error && <p className="field-error">{error}</p>}
        </div>
      </div>
    </div>
  );
}
