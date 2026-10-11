import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { site } from "@/lib/site";
import { WhatsAppLinkHandler } from "@/components/WhatsAppLinkHandler";
import "../globals.css";

const plex = IBM_Plex_Sans_Arabic({
  variable: "--font-plex",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "لوحة تحكم بريق", template: "%s | لوحة تحكم بريق" },
  robots: { index: false },
};

export const viewport: Viewport = {
  themeColor: "#612aae",
};

/** The dashboard and login are Arabic and always use the light theme. */
export default function AdminRootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ar" dir="rtl" className={plex.variable}>
      <body className="min-h-dvh">
        {children}
        <WhatsAppLinkHandler />
      </body>
    </html>
  );
}
