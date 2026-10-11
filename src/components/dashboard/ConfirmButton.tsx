"use client";

import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

/** Submit button that asks before running a destructive form action. */
export function ConfirmButton({
  message = "هل أنت متأكد؟ لا يمكن التراجع عن هذا الإجراء.",
  className,
  children,
  ...rest
}: { message?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
      className={cn(className, pending && "opacity-60")}
      {...rest}
    >
      {children}
    </button>
  );
}

export function SubmitButton({ className, children, pendingText, ...rest }: { pendingText?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={className} {...rest}>
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
