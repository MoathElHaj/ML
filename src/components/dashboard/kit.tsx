"use client";

import { Save } from "lucide-react";
import type { FormState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { FormAlert } from "@/components/forms/Field";
import { useT } from "./DashLang";

/** Shared building blocks for dashboard forms (bilingual, RTL/LTR aware). */
export function Card({ title, description, children, className }: { title: string; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-[20px] border border-line bg-white p-5 sm:p-6", className)}>
      <h2 className="font-bold text-night">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export function Toggle({
  name,
  label,
  hint,
  defaultChecked,
  value,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultChecked?: boolean;
  value?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-line bg-white p-4">
      <input type="checkbox" name={name} value={value} defaultChecked={defaultChecked} className="peer sr-only" />
      <span className="relative mt-0.5 h-6 w-11 shrink-0 rounded-full bg-[#cfc4e3] transition-colors peer-checked:bg-violet peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-violet after:absolute after:top-0.5 after:start-0.5 after:size-5 after:rounded-full after:bg-white after:shadow after:transition-transform ltr:peer-checked:after:translate-x-5 rtl:peer-checked:after:-translate-x-5" />
      <span>
        <span className="block font-semibold text-night">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function SaveBar({ pending, state, label }: { pending: boolean; state: FormState; label?: string }) {
  const { t } = useT();
  return (
    <div className="flex flex-wrap items-center gap-3">
      <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
        <Save className="size-4" aria-hidden />
        {pending ? t("جارٍ الحفظ…", "Saving…") : (label ?? t("حفظ", "Save"))}
      </button>
      <FormAlert ok={state.ok} message={state.message} />
    </div>
  );
}

/** Pill-style checkbox, used for permission and weekday pickers. */
export function ChipCheckbox({ name, value, label, defaultChecked, checked, onChange, disabled }: {
  name: string;
  value: string;
  label: React.ReactNode;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className={cn("cursor-pointer", disabled && "cursor-not-allowed opacity-60")}>
      <input
        type="checkbox"
        name={name}
        value={value}
        defaultChecked={defaultChecked}
        checked={checked}
        disabled={disabled}
        onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
        className="peer sr-only"
      />
      <span className="inline-flex min-h-10 items-center rounded-full border-[1.5px] border-line px-4 text-sm font-semibold text-night transition-colors peer-checked:border-violet peer-checked:bg-violet peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-3 peer-focus-visible:outline-violet">
        {label}
      </span>
    </label>
  );
}
