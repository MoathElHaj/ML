"use client";

import { useEffect } from "react";

const isMobile = () => /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

/**
 * wa.me links show WhatsApp's "Continue to chat" page on desktops and in some in-app
 * browsers. This opens the conversation directly instead: the WhatsApp app on phones
 * (falling back to wa.me if it isn't installed) and WhatsApp Web on computers.
 * Links keep their wa.me href, so they still work without JavaScript.
 */
export function WhatsAppLinkHandler() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;

      let url: URL;
      try {
        url = new URL(anchor.href);
      } catch {
        return;
      }
      if (url.hostname !== "wa.me" && url.hostname !== "api.whatsapp.com") return;

      const phone = url.hostname === "wa.me" ? url.pathname.replace(/\D/g, "") : (url.searchParams.get("phone") ?? "").replace(/\D/g, "");
      const text = url.searchParams.get("text") ?? "";
      // encodeURIComponent keeps spaces as %20 (URLSearchParams would write "+", which WhatsApp can show literally).
      const query = [phone && `phone=${phone}`, text && `text=${encodeURIComponent(text)}`].filter(Boolean).join("&");

      event.preventDefault();

      if (isMobile()) {
        // Opens the app directly; if nothing took over the page, fall back to wa.me.
        const fallback = window.setTimeout(() => {
          if (document.visibilityState === "visible") window.location.href = anchor.href;
        }, 1500);
        const cancel = () => window.clearTimeout(fallback);
        document.addEventListener("visibilitychange", cancel, { once: true });
        window.addEventListener("pagehide", cancel, { once: true });
        window.location.href = `whatsapp://send?${query}`;
      } else {
        window.open(`https://web.whatsapp.com/send?${query}`, "_blank", "noopener,noreferrer");
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
