"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

/** Pill tabs whose active background slides to the selected tab. */
export function FilterTabs({ items, active, label }: { items: { key: string; href: string; label: string }[]; active: string; label: string }) {
  return (
    <nav aria-label={label} className="-mx-1 mb-10 flex gap-2 overflow-x-auto px-1 pb-1">
      {items.map((item) => {
        const selected = item.key === active;
        return (
          <Link
            key={item.key}
            href={item.href}
            scroll={false}
            aria-current={selected ? "page" : undefined}
            className={cn(
              "relative isolate whitespace-nowrap rounded-full border-[1.5px] px-5 py-2.5 text-[15px] font-semibold transition-colors",
              selected ? "border-violet text-white" : "border-line bg-card text-ink hover:border-accent",
            )}
          >
            {selected && (
              <motion.span layoutId="filter-pill" className="absolute inset-0 -z-10 rounded-full bg-violet" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
