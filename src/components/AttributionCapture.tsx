"use client";

import { useEffect } from "react";
import { ATTRIBUTION_COOKIE, ATTRIBUTION_KEYS } from "@/lib/attribution";

/**
 * Remembers the campaign in the landing URL (utm_*, gclid, fbclid…) or the external referrer,
 * so a booking or message sent later is credited to the right ad. Last ad click wins.
 */
export function AttributionCapture() {
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const found: Record<string, string> = {};
      for (const k of ATTRIBUTION_KEYS) {
        const v = params.get(k);
        if (v) found[k] = v.slice(0, 200);
      }
      const hasCookie = document.cookie.split("; ").some((c) => c.startsWith(`${ATTRIBUTION_COOKIE}=`));
      let referrer = "";
      try {
        const r = document.referrer ? new URL(document.referrer) : null;
        if (r && r.host !== window.location.host) referrer = r.host;
      } catch {}
      if (!Object.keys(found).length && (hasCookie || !referrer)) return;
      const value = { ...found, landing: window.location.pathname.slice(0, 200), ...(referrer ? { referrer } : {}) };
      document.cookie = `${ATTRIBUTION_COOKIE}=${encodeURIComponent(JSON.stringify(value))}; Max-Age=${30 * 86400}; Path=/; SameSite=Lax`;
    } catch {
      // Attribution is best-effort.
    }
  }, []);
  return null;
}
