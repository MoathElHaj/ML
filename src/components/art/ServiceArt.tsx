import { cn } from "@/lib/utils";

/**
 * Code-drawn illustrations for each service, in Bariq's palette. They use the site's
 * colour tokens (fill-card, fill-tint, …) so they follow light/dark mode, scale
 * cleanly at any size, and gently animate (paused for reduced-motion users).
 */

const ART_SLUGS = ["web-development", "mobile-development", "graphic-design", "digital-marketing"] as const;
export type ArtSlug = (typeof ART_SLUGS)[number];
export const hasArt = (slug: string): slug is ArtSlug => (ART_SLUGS as readonly string[]).includes(slug);

function Frame({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <svg viewBox="0 0 560 380" className={cn("size-full", className)} aria-hidden focusable="false" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="art-violet" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#612aae" />
          <stop offset="1" stopColor="#cda9ff" />
        </linearGradient>
        <linearGradient id="art-deep" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#230b4b" />
          <stop offset="1" stopColor="#612aae" />
        </linearGradient>
        <filter id="art-shadow" x="-20%" y="-20%" width="140%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#230b4b" floodOpacity="0.16" />
        </filter>
      </defs>
      <rect width="560" height="380" className="fill-tint" />
      <circle cx="500" cy="40" r="110" fill="none" className="stroke-violet" strokeOpacity="0.1" strokeWidth="26" />
      <circle cx="40" cy="360" r="80" fill="none" className="stroke-lilac" strokeOpacity="0.35" strokeWidth="2" strokeDasharray="4 8" />
      {children}
    </svg>
  );
}

/** Lines that stand in for text. */
function Lines({ x, y, widths, gap = 16, className = "fill-muted", opacity = 0.35, h = 8 }: { x: number; y: number; widths: number[]; gap?: number; className?: string; opacity?: number; h?: number }) {
  return (
    <>
      {widths.map((w, i) => (
        <rect key={i} x={x} y={y + i * gap} width={w} height={h} rx={h / 2} className={className} opacity={opacity} />
      ))}
    </>
  );
}

function WebArt() {
  return (
    <Frame>
      <g filter="url(#art-shadow)">
        <rect x="56" y="44" width="448" height="296" rx="18" className="fill-card stroke-line" strokeWidth="1.5" />
      </g>
      <path d="M56 62a18 18 0 0 1 18-18h412a18 18 0 0 1 18 18v22H56z" className="fill-tint-strong" />
      <circle cx="80" cy="64" r="5" className="fill-lilac" />
      <circle cx="98" cy="64" r="5" className="fill-violet" />
      <circle cx="116" cy="64" r="5" className="fill-night" opacity="0.7" />
      <rect x="150" y="55" width="250" height="18" rx="9" className="fill-card" />
      <circle cx="164" cy="64" r="4" className="fill-violet" opacity="0.6" />
      {/* hero */}
      <rect x="84" y="108" width="176" height="14" rx="7" className="fill-ink" opacity="0.85" />
      <rect x="84" y="130" width="140" height="14" rx="7" className="fill-violet" opacity="0.8" />
      <Lines x={84} y={156} widths={[160, 120]} gap={14} h={7} />
      <rect x="84" y="190" width="86" height="26" rx="13" className="fill-violet" />
      <rect x="178" y="190" width="70" height="26" rx="13" className="fill-card stroke-line" strokeWidth="1.5" />
      <rect x="290" y="104" width="190" height="116" rx="14" fill="url(#art-violet)" />
      <circle cx="330" cy="140" r="14" fill="#fff" opacity="0.85" />
      <path d="M290 206 l52-46 36 30 28-22 74 56v-12z" fill="#fff" opacity="0.35" />
      {/* cards */}
      {[84, 218, 352].map((x, i) => (
        <g key={x} className="art-rise" style={{ animationDelay: `${0.15 * i}s` }}>
          <rect x={x} y="238" width="124" height="80" rx="12" className="fill-tint" />
          <rect x={x + 12} y="250" width="24" height="24" rx="7" className={i === 1 ? "fill-lilac" : "fill-violet"} opacity={i === 1 ? 1 : 0.85} />
          <Lines x={x + 12} y={284} widths={[92, 64]} gap={13} h={6} />
        </g>
      ))}
      {/* cursor */}
      <g className="art-cursor">
        <path d="M402 176 l0 32 9-9 7 15 6-3-7-15 13 0z" className="fill-night stroke-card" strokeWidth="2" strokeLinejoin="round" />
      </g>
    </Frame>
  );
}

function MobileArt() {
  return (
    <Frame>
      <g filter="url(#art-shadow)">
        <rect x="196" y="22" width="168" height="336" rx="32" className="fill-night stroke-line" strokeWidth="1.5" />
      </g>
      <rect x="206" y="32" width="148" height="316" rx="24" className="fill-card" />
      <rect x="254" y="40" width="52" height="11" rx="5.5" className="fill-night" />
      <rect x="220" y="66" width="70" height="10" rx="5" className="fill-ink" opacity="0.85" />
      <circle cx="334" cy="71" r="9" className="fill-violet" />
      <rect x="220" y="88" width="120" height="74" rx="14" fill="url(#art-deep)" />
      <rect x="232" y="102" width="56" height="8" rx="4" fill="#fff" opacity="0.9" />
      <rect x="232" y="116" width="40" height="6" rx="3" fill="#fff" opacity="0.55" />
      <rect x="232" y="136" width="46" height="16" rx="8" className="fill-lilac" />
      {[176, 214, 252].map((y, i) => (
        <g key={y} className="art-rise" style={{ animationDelay: `${0.12 * i}s` }}>
          <rect x="220" y={y} width="120" height="30" rx="10" className="fill-tint" />
          <circle cx="236" cy={y + 15} r="8" className={i === 1 ? "fill-lilac" : "fill-violet"} opacity="0.85" />
          <Lines x={250} y={y + 9} widths={[70, 46]} gap={9} h={5} />
        </g>
      ))}
      <rect x="220" y="300" width="120" height="34" rx="17" className="fill-tint" />
      {[244, 268, 292, 316].map((cx, i) => (
        <circle key={cx} cx={cx} cy="317" r="5" className={i === 0 ? "fill-violet" : "fill-muted"} opacity={i === 0 ? 1 : 0.35} />
      ))}
      {/* notification + rating cards floating beside the phone */}
      <g className="art-float" style={{ animationDelay: "0.4s" }}>
        <g filter="url(#art-shadow)">
          <rect x="336" y="96" width="176" height="56" rx="16" className="fill-card stroke-line" strokeWidth="1.5" />
        </g>
        <rect x="350" y="110" width="28" height="28" rx="9" className="fill-violet" />
        <path d="M358 124l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <Lines x={388} y={114} widths={[96, 70]} gap={14} h={7} />
      </g>
      <g className="art-float" style={{ animationDelay: "1.6s" }}>
        <g filter="url(#art-shadow)">
          <rect x="48" y="226" width="166" height="60" rx="16" className="fill-card stroke-line" strokeWidth="1.5" />
        </g>
        {[0, 1, 2, 3, 4].map((i) => (
          <path key={i} transform={`translate(${64 + i * 24} 240)`} d="M9 0l2.6 5.6 6.1.7-4.5 4.2 1.2 6L9 13.5 3.6 16.5l1.2-6L.3 6.3l6.1-.7z" className="fill-lilac" />
        ))}
        <Lines x={64} y={266} widths={[118]} h={6} />
      </g>
    </Frame>
  );
}

function DesignArt() {
  return (
    <Frame>
      {/* brand board */}
      <g filter="url(#art-shadow)">
        <rect x="60" y="40" width="270" height="206" rx="22" className="fill-card stroke-line" strokeWidth="1.5" />
      </g>
      <g className="art-spin-slow">
        <circle cx="195" cy="140" r="56" fill="none" className="stroke-violet" strokeWidth="22" strokeDasharray="300 52" strokeLinecap="round" />
      </g>
      <path d="M222 168l30 30" className="stroke-violet" strokeWidth="22" strokeLinecap="round" />
      <rect x="183" y="112" width="24" height="56" rx="12" className="fill-night" />
      {/* typography */}
      <g filter="url(#art-shadow)">
        <rect x="350" y="40" width="150" height="120" rx="22" className="fill-night" />
      </g>
      <text x="425" y="116" textAnchor="middle" fontSize="54" fontWeight="700" fill="#fff" fontFamily="var(--font-plex), system-ui, sans-serif">
        Aa
      </text>
      <rect x="380" y="132" width="90" height="6" rx="3" className="fill-lilac" opacity="0.7" />
      {/* shapes */}
      <g filter="url(#art-shadow)">
        <rect x="350" y="178" width="150" height="160" rx="22" className="fill-lilac" />
      </g>
      <circle cx="395" cy="226" r="22" className="fill-night art-float" />
      <rect x="432" y="206" width="42" height="42" rx="10" className="fill-violet art-float" style={{ animationDelay: "0.8s" }} />
      <path d="M380 318l28-46 28 46z" className="fill-card art-float" style={{ animationDelay: "1.6s" }} />
      <circle cx="465" cy="298" r="16" fill="none" className="stroke-night" strokeWidth="5" />
      {/* palette */}
      {["fill-night", "fill-deep", "fill-violet", "fill-lilac"].map((c, i) => (
        <g key={c} className="art-rise" style={{ animationDelay: `${0.1 * i}s` }}>
          <circle cx={100 + i * 62} cy="300" r="26" className={cn(c, "stroke-card")} strokeWidth="4" />
        </g>
      ))}
      {/* pen path */}
      <path d="M70 262 C 140 230, 220 340, 330 266" fill="none" className="stroke-violet art-draw" strokeWidth="2.5" strokeDasharray="6 6" />
      <rect x="64" y="256" width="12" height="12" rx="2" className="fill-card stroke-violet" strokeWidth="2" />
      <rect x="324" y="260" width="12" height="12" rx="2" className="fill-card stroke-violet" strokeWidth="2" />
    </Frame>
  );
}

function MarketingArt() {
  const bars = [52, 74, 66, 98, 120, 150];
  return (
    <Frame>
      {/* analytics */}
      <g filter="url(#art-shadow)">
        <rect x="48" y="48" width="296" height="280" rx="22" className="fill-card stroke-line" strokeWidth="1.5" />
      </g>
      <rect x="72" y="72" width="110" height="12" rx="6" className="fill-ink" opacity="0.85" />
      <Lines x={72} y={94} widths={[70]} h={7} />
      <rect x="252" y="70" width="68" height="26" rx="13" className="fill-tint" />
      <path d="M266 88l8-8 6 6 10-10" fill="none" className="stroke-violet" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {[0, 1, 2, 3].map((i) => (
        <line key={i} x1="72" x2="320" y1={150 + i * 40} y2={150 + i * 40} className="stroke-line" strokeWidth="1.5" />
      ))}
      {bars.map((h, i) => (
        <rect
          key={i}
          x={84 + i * 40}
          y={302 - h}
          width="24"
          height={h}
          rx="7"
          fill={i === bars.length - 1 ? "url(#art-violet)" : undefined}
          className={cn("art-bar", i === bars.length - 1 ? undefined : "fill-lilac")}
          opacity={i === bars.length - 1 ? 1 : 0.75}
          style={{ animationDelay: `${0.08 * i}s` }}
        />
      ))}
      <polyline points="96,236 136,216 176,224 216,186 256,166 296,132" fill="none" className="stroke-violet art-draw" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="296" cy="132" r="7" className="fill-violet stroke-card" strokeWidth="3" />
      {/* ad card */}
      <g className="art-float">
        <g filter="url(#art-shadow)">
          <rect x="324" y="36" width="188" height="214" rx="20" className="fill-card stroke-line" strokeWidth="1.5" />
        </g>
        <circle cx="348" cy="62" r="11" className="fill-night" />
        <Lines x={366} y={54} widths={[70, 44]} gap={11} h={6} />
        <rect x="338" y="84" width="160" height="92" rx="12" fill="url(#art-deep)" />
        <circle cx="418" cy="130" r="26" fill="none" stroke="#cda9ff" strokeWidth="9" />
        <Lines x={338} y={188} widths={[150, 110]} gap={12} h={6} />
        <rect x="338" y="216" width="160" height="22" rx="11" className="fill-violet" />
      </g>
      {/* reach rings */}
      <g className="art-pulse">
        <circle cx="462" cy="316" r="34" fill="none" className="stroke-violet" strokeOpacity="0.25" strokeWidth="2" />
        <circle cx="462" cy="316" r="22" fill="none" className="stroke-violet" strokeOpacity="0.45" strokeWidth="2" />
      </g>
      <circle cx="462" cy="316" r="10" className="fill-violet" />
    </Frame>
  );
}

const arts: Record<ArtSlug, () => React.JSX.Element> = {
  "web-development": WebArt,
  "mobile-development": MobileArt,
  "graphic-design": DesignArt,
  "digital-marketing": MarketingArt,
};

export function ServiceArt({ slug, className }: { slug: ArtSlug; className?: string }) {
  const Art = arts[slug];
  return (
    <div className={cn("art-root size-full", className)}>
      <Art />
    </div>
  );
}
