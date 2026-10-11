import { cn } from "@/lib/utils";

/** Decorative concentric rings echoing Bariq's ring mark, for dark brand panels. */
export function RingsPattern({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={cn("pointer-events-none", className)} aria-hidden focusable="false">
      {[60, 100, 140, 180].map((r, i) => (
        <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#cda9ff" strokeOpacity={0.28 - i * 0.05} strokeWidth={i === 0 ? 24 : 1.5} strokeDasharray={i === 2 ? "4 10" : undefined} />
      ))}
      <g className="art-spin-slow">
        <circle cx="200" cy="200" r="120" fill="none" stroke="#cda9ff" strokeOpacity="0.5" strokeWidth="3" strokeDasharray="40 700" strokeLinecap="round" />
      </g>
      <circle cx="320" cy="200" r="6" fill="#cda9ff" opacity="0.8" />
      <circle cx="110" cy="90" r="4" fill="#fff" opacity="0.6" />
    </svg>
  );
}
