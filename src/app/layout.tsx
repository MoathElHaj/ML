import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const plex = IBM_Plex_Sans_Arabic({
  variable: "--font-plex",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.fullName} | ${site.fullNameEn}`,
    template: `%s | ${site.fullName}`,
  },
  description: site.description,
  openGraph: {
    type: "website",
    locale: "ar_AR",
    siteName: site.fullName,
    title: site.fullName,
    description: site.description,
    images: [{ url: "/images/hero.jpg", width: 1600, height: 900, alt: site.fullName }],
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#612aae",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable} data-scroll-behavior="smooth">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
