"use client";

import { inView } from "motion";
import { useEffect, useRef, type ReactNode, type RefObject } from "react";

type Props = {
  as?: "div" | "section" | "ol" | "ul" | "header" | "article";
  /** "up": the element fades up. "stagger": its direct children fade up one after another. */
  variant?: "up" | "stagger";
  className?: string;
  id?: string;
  children: ReactNode;
} & Record<`aria-${string}`, string | undefined>;

/**
 * Scroll reveal that keeps the markup unchanged: the element renders as-is and Motion's
 * `inView` flips a data attribute that CSS animates (see globals.css). Content stays
 * visible without JavaScript and for reduced-motion users.
 */
export function Reveal({ as = "div", variant = "up", className, children, ...rest }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return inView(
      el,
      () => {
        el.setAttribute("data-in", "");
      },
      { amount: 0.15, margin: "0px 0px -8% 0px" },
    );
  }, []);

  const Tag = as as "div";
  return (
    <Tag ref={ref as RefObject<HTMLDivElement>} className={className} data-reveal={variant} {...rest}>
      {children}
    </Tag>
  );
}
