import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL) : null;

/** Sent with every response: no framing by other sites, no MIME sniffing, HTTPS only, minimal referrer and device APIs. */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self' https://www.facebook.com" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

/** Old WordPress links (bariq.tech before the move) → their new pages, so search rankings and shared links carry over. */
const oldWordPressLinks: [string, string][] = [
  ["/digital-marketing", "/services/digital-marketing"],
  ["/web-development", "/services/web-development"],
  ["/social-media-design", "/services/graphic-design"],
  [`/${encodeURIComponent("اهمية-التسويق-الرقمي")}`, "/blog"],
  ["/26379-2", "/"],
  ["/nova1", "/portfolio"],
  ["/websiteask", "/contact"],
  ["/author/:path*", "/blog"],
  ["/category/:path*", "/blog"],
  ["/feed", "/blog"],
  ["/wp-sitemap.xml", "/sitemap.xml"],
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    return oldWordPressLinks.map(([source, destination]) => ({ source, destination, permanent: true }));
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // The dashboard is private: never index or cache it in shared caches.
      { source: "/dashboard/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }] },
      { source: "/login", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }, { key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
  images: {
    // Lets `next dev` optimize images from a local Supabase (127.0.0.1). Off in production.
    dangerouslyAllowLocalIP: process.env.NODE_ENV === "development",
    remotePatterns: [
      {
        protocol: supabaseUrl?.protocol === "http:" ? "http" : "https",
        hostname: supabaseUrl?.hostname ?? "*.supabase.co",
        port: supabaseUrl?.port ?? "",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    serverActions: { bodySizeLimit: "6mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
