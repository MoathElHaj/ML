/** Browser-side conversion tracking for leads (bookings, contact messages). Safe when no tag is installed. */
type W = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  __bariqTracking?: { lead?: string };
};

export function trackLead(form: "booking" | "contact", extra: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const w = window as W;
  w.dataLayer = w.dataLayer || [];
  // GTM: trigger on the "generate_lead" event; GA4 recommends this event name for leads.
  w.dataLayer.push({ event: "generate_lead", form, ...extra });
  w.gtag?.("event", "generate_lead", { form, ...extra });
  const lead = w.__bariqTracking?.lead;
  if (lead) w.gtag?.("event", "conversion", { send_to: lead });
  w.fbq?.("track", form === "booking" ? "Schedule" : "Lead");
}
