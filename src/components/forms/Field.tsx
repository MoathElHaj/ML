import { cn } from "@/lib/utils";

type Common = { label: string; name: string; error?: string; hint?: string; required?: boolean; className?: string };

export function TextField({
  label,
  name,
  error,
  hint,
  required,
  className,
  ...rest
}: Common & Omit<React.InputHTMLAttributes<HTMLInputElement>, "name">) {
  const id = `f-${name}`;
  const describedBy = error ? `${id}-err` : hint ? `${id}-hint` : undefined;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-violet" aria-hidden>*</span>}
      </label>
      <input id={id} name={name} required={required} aria-invalid={error ? true : undefined} aria-describedby={describedBy} className="field" {...rest} />
      {error ? <p id={`${id}-err`} className="field-error">{error}</p> : hint ? <p id={`${id}-hint`} className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function TextArea({
  label,
  name,
  error,
  hint,
  required,
  className,
  ...rest
}: Common & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "name">) {
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-violet" aria-hidden>*</span>}
      </label>
      <textarea id={id} name={name} required={required} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} className="field" {...rest} />
      {error ? <p id={`${id}-err`} className="field-error">{error}</p> : hint ? <p id={`${id}-hint`} className="field-hint">{hint}</p> : null}
    </div>
  );
}

export function SelectField({
  label,
  name,
  error,
  required,
  className,
  children,
  ...rest
}: Common & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "name">) {
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label} {required && <span className="text-violet" aria-hidden>*</span>}
      </label>
      <select id={id} name={name} required={required} aria-invalid={error ? true : undefined} className={cn("field appearance-auto")} {...rest}>
        {children}
      </select>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

/** Hidden from people and assistive tech; bots tend to fill it. */
export function Honeypot() {
  return (
    <div aria-hidden className="absolute -start-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
    </div>
  );
}

export function FormAlert({ ok, message }: { ok: boolean; message?: string }) {
  if (!message) return null;
  return (
    <div
      role={ok ? "status" : "alert"}
      className={cn(
        "rounded-2xl border px-4 py-3 text-[15px] font-medium",
        ok ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900",
      )}
    >
      {message}
    </div>
  );
}
