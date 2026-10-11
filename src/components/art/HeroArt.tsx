/**
 * Hero illustration: Bariq's four services as one composition — a website, a phone app,
 * a growth chart and a brand palette — drawn in code so it stays crisp, light and on-brand.
 */
export function HeroArt() {
  const bars = [40, 58, 50, 76, 96];
  return (
    <div className="art-root size-full">
      <svg viewBox="0 0 600 412" className="size-full" aria-hidden focusable="false">
        <defs>
          <linearGradient id="hero-violet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#612aae" />
            <stop offset="1" stopColor="#cda9ff" />
          </linearGradient>
          <linearGradient id="hero-deep" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#230b4b" />
            <stop offset="1" stopColor="#612aae" />
          </linearGradient>
          <filter id="hero-shadow" x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#230b4b" floodOpacity="0.18" />
          </filter>
        </defs>

        <rect width="600" height="412" className="fill-tint" />
        <circle cx="540" cy="30" r="130" fill="none" className="stroke-violet" strokeOpacity="0.08" strokeWidth="30" />
        <g opacity="0.5">
          {Array.from({ length: 8 }).map((_, r) =>
            Array.from({ length: 12 }).map((__, c) => <circle key={`${r}-${c}`} cx={24 + c * 50} cy={24 + r * 52} r="1.6" className="fill-violet" opacity="0.35" />),
          )}
        </g>

        {/* website */}
        <g filter="url(#hero-shadow)">
          <rect x="40" y="36" width="400" height="270" rx="18" className="fill-card stroke-line" strokeWidth="1.5" />
        </g>
        <path d="M40 54a18 18 0 0 1 18-18h364a18 18 0 0 1 18 18v20H40z" className="fill-tint-strong" />
        <circle cx="62" cy="55" r="5" className="fill-lilac" />
        <circle cx="79" cy="55" r="5" className="fill-violet" />
        <circle cx="96" cy="55" r="5" className="fill-night" opacity="0.7" />
        <rect x="126" y="47" width="220" height="16" rx="8" className="fill-card" />
        <rect x="66" y="96" width="150" height="13" rx="6.5" className="fill-ink" opacity="0.85" />
        <rect x="66" y="117" width="118" height="13" rx="6.5" className="fill-violet" opacity="0.8" />
        <rect x="66" y="142" width="140" height="7" rx="3.5" className="fill-muted" opacity="0.35" />
        <rect x="66" y="155" width="104" height="7" rx="3.5" className="fill-muted" opacity="0.35" />
        <rect x="66" y="176" width="78" height="24" rx="12" className="fill-violet" />
        <rect x="236" y="92" width="182" height="112" rx="14" fill="url(#hero-violet)" />
        <circle cx="274" cy="126" r="13" fill="#fff" opacity="0.85" />
        <path d="M236 190 l50-44 34 28 28-20 70 52v-12z" fill="#fff" opacity="0.35" />
        {[66, 186, 306].map((x, i) => (
          <g key={x} className="art-rise" style={{ animationDelay: `${0.2 + i * 0.12}s` }}>
            <rect x={x} y="220" width="112" height="66" rx="12" className="fill-tint" />
            <rect x={x + 12} y="232" width="22" height="22" rx="7" className={i === 1 ? "fill-lilac" : "fill-violet"} opacity="0.9" />
            <rect x={x + 12} y="262" width="80" height="6" rx="3" className="fill-muted" opacity="0.35" />
            <rect x={x + 12} y="273" width="56" height="6" rx="3" className="fill-muted" opacity="0.35" />
          </g>
        ))}
        <g className="art-cursor">
          <path d="M396 162 l0 30 8-8 7 14 6-3-7-14 12 0z" className="fill-night stroke-card" strokeWidth="2" strokeLinejoin="round" />
        </g>

        {/* phone */}
        <g className="art-float" style={{ animationDelay: "0.6s" }}>
          <g filter="url(#hero-shadow)">
            <rect x="404" y="118" width="148" height="276" rx="28" className="fill-night stroke-line" strokeWidth="1.5" />
          </g>
          <rect x="413" y="127" width="130" height="258" rx="21" className="fill-card" />
          <rect x="455" y="134" width="46" height="10" rx="5" className="fill-night" />
          <rect x="425" y="156" width="62" height="9" rx="4.5" className="fill-ink" opacity="0.85" />
          <circle cx="527" cy="160" r="8" className="fill-violet" />
          <rect x="425" y="176" width="106" height="64" rx="12" fill="url(#hero-deep)" />
          <rect x="436" y="189" width="50" height="7" rx="3.5" fill="#fff" opacity="0.9" />
          <rect x="436" y="201" width="34" height="5" rx="2.5" fill="#fff" opacity="0.55" />
          <rect x="436" y="217" width="40" height="14" rx="7" className="fill-lilac" />
          {[252, 284, 316].map((y, i) => (
            <g key={y}>
              <rect x="425" y={y} width="106" height="25" rx="9" className="fill-tint" />
              <circle cx="439" cy={y + 12.5} r="7" className={i === 1 ? "fill-lilac" : "fill-violet"} opacity="0.85" />
              <rect x="452" y={y + 8} width="58" height="5" rx="2.5" className="fill-muted" opacity="0.4" />
              <rect x="452" y={y + 15} width="38" height="4" rx="2" className="fill-muted" opacity="0.3" />
            </g>
          ))}
          <rect x="425" y="352" width="106" height="24" rx="12" className="fill-tint" />
        </g>

        {/* growth chart */}
        <g className="art-float" style={{ animationDelay: "1.4s" }}>
          <g filter="url(#hero-shadow)">
            <rect x="16" y="262" width="196" height="132" rx="18" className="fill-card stroke-line" strokeWidth="1.5" />
          </g>
          <rect x="34" y="280" width="70" height="9" rx="4.5" className="fill-ink" opacity="0.85" />
          <rect x="150" y="276" width="44" height="18" rx="9" className="fill-tint" />
          <path d="M159 289l6-6 5 4 8-8" fill="none" className="stroke-violet" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          {bars.map((h, i) => (
            <rect
              key={i}
              x={38 + i * 32}
              y={378 - h}
              width="18"
              height={h}
              rx="5"
              fill={i === bars.length - 1 ? "url(#hero-violet)" : undefined}
              className={i === bars.length - 1 ? "art-bar" : "art-bar fill-lilac"}
              opacity={i === bars.length - 1 ? 1 : 0.75}
              style={{ animationDelay: `${0.4 + i * 0.08}s` }}
            />
          ))}
        </g>

        {/* brand palette */}
        <g className="art-float" style={{ animationDelay: "2.2s" }}>
          <g filter="url(#hero-shadow)">
            <rect x="248" y="330" width="138" height="58" rx="29" className="fill-card stroke-line" strokeWidth="1.5" />
          </g>
          {["fill-night", "fill-deep", "fill-violet", "fill-lilac"].map((c, i) => (
            <circle key={c} cx={276 + i * 28} cy="359" r="13" className={`${c} stroke-card`} strokeWidth="3" />
          ))}
        </g>
      </svg>
    </div>
  );
}
