import Script from "next/script";
import type { TrackingSettings } from "@/lib/settings";

/**
 * Google Tag Manager, GA4 / Google Ads (gtag) and Meta Pixel, configured from the dashboard.
 * Only the tags with an ID are loaded. IDs are validated when saved.
 */
export function TrackingScripts({ t }: { t: TrackingSettings }) {
  const gtagIds = [t.ga4_id, t.google_ads_id].filter(Boolean);
  const lead = t.google_ads_id && t.google_ads_lead_label ? `${t.google_ads_id}/${t.google_ads_lead_label}` : "";
  return (
    <>
      {/* Read by trackLead() in the browser. */}
      <Script id="bariq-tracking-config" strategy="afterInteractive">{`window.__bariqTracking=${JSON.stringify({ lead })};`}</Script>

      {t.gtm_id && (
        <Script id="gtm" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${t.gtm_id}');`}
        </Script>
      )}

      {gtagIds.length > 0 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gtagIds[0]}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());${gtagIds.map((id) => `gtag('config','${id}');`).join("")}`}
          </Script>
        </>
      )}

      {t.meta_pixel_id && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${t.meta_pixel_id}');fbq('track','PageView');`}
        </Script>
      )}
    </>
  );
}

export function GtmNoscript({ id }: { id: string }) {
  if (!id) return null;
  return (
    <noscript>
      <iframe src={`https://www.googletagmanager.com/ns.html?id=${id}`} height="0" width="0" style={{ display: "none", visibility: "hidden" }} title="gtm" />
    </noscript>
  );
}
