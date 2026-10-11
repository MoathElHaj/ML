/**
 * "One team" illustration: marketing, design and development as three overlapping circles
 * meeting at Bariq's ring mark in the centre.
 */
export function AboutArt() {
  return (
    <div className="art-root size-full">
      <svg viewBox="0 0 560 420" className="size-full" aria-hidden focusable="false" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="about-bg" cx="0.5" cy="0.4" r="0.8">
            <stop offset="0" stopColor="#3a1673" />
            <stop offset="1" stopColor="#230b4b" />
          </radialGradient>
        </defs>
        <rect width="560" height="420" fill="url(#about-bg)" />
        {Array.from({ length: 9 }).map((_, r) =>
          Array.from({ length: 12 }).map((__, c) => <circle key={`${r}-${c}`} cx={20 + c * 48} cy={20 + r * 48} r="1.4" fill="#cda9ff" opacity="0.18" />),
        )}

        <g style={{ mixBlendMode: "screen" }}>
          <circle cx="220" cy="170" r="105" fill="#612aae" opacity="0.75" className="art-float" />
          <circle cx="340" cy="170" r="105" fill="#8b4fe0" opacity="0.6" className="art-float" style={{ animationDelay: "1s" }} />
          <circle cx="280" cy="268" r="105" fill="#cda9ff" opacity="0.45" className="art-float" style={{ animationDelay: "2s" }} />
        </g>

        {/* marketing: rising bars */}
        <g transform="translate(160 120)">
          {[14, 24, 34].map((h, i) => (
            <rect key={i} x={i * 14} y={36 - h} width="9" height={h} rx="3" fill="#fff" opacity="0.9" className="art-bar" style={{ animationDelay: `${0.3 + i * 0.1}s` }} />
          ))}
        </g>
        {/* design: palette dots */}
        <g transform="translate(372 132)">
          <circle cx="0" cy="12" r="8" fill="#fff" />
          <circle cx="20" cy="0" r="8" fill="#cda9ff" />
          <circle cx="20" cy="24" r="8" fill="#230b4b" stroke="#fff" strokeWidth="2" />
        </g>
        {/* development: </> */}
        <path d="M262 318 l-14 12 14 12 M298 318 l14 12 -14 12 M286 314 l-12 32" fill="none" stroke="#230b4b" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Bariq ring mark at the centre */}
        <g className="art-spin-slow">
          <circle cx="280" cy="205" r="34" fill="none" stroke="#fff" strokeWidth="12" strokeDasharray="180 34" strokeLinecap="round" />
        </g>
        <path d="M298 221 l18 18" stroke="#fff" strokeWidth="12" strokeLinecap="round" />
      </svg>
    </div>
  );
}
