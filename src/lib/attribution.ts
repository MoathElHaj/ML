/** First-party ad attribution: which campaign brought a visitor (kept 30 days, attached to their booking/message). */
export const ATTRIBUTION_COOKIE = "bariq_src";
export const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "gbraid", "wbraid", "fbclid"] as const;

/** Keeps only known keys with short string values. */
export function cleanAttribution(input: unknown): Record<string, string> {
  if (!input || typeof input !== "object") return {};
  const out: Record<string, string> = {};
  for (const key of [...ATTRIBUTION_KEYS, "landing", "referrer"]) {
    const v = (input as Record<string, unknown>)[key];
    if (typeof v === "string" && v.trim()) out[key] = v.trim().slice(0, 200);
  }
  return out;
}
