import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { site } from "@/lib/site";
import { WhatsAppLinkHandler } from "@/components/WhatsAppLinkHandler";
import { DashLangProvider } from "@/components/dashboard/DashLang";
import { getDashLang } from "@/lib/dash";
import "../globals.css";

const plex = IBM_Plex_Sans_Arabic({
  variable: "--font-plex",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getDashLang();
  const name = lang === "en" ? "Bariq Dashboard" : "لوحة تحكم بريق";
  return { metadataBase: new URL(site.url), title: { default: name, template: `%s | ${name}` }, robots: { index: false } };
}

export const viewport: Viewport = {
  themeColor: "#612aae",
};

/** The dashboard and login: Arabic by default (English per team member), always the light theme. */
export default async function AdminRootLayout({ children }: LayoutProps<"/">) {
  const lang = await getDashLang();
  return (
    <html lang={lang} dir={lang === "en" ? "ltr" : "rtl"} className={plex.variable}>
      {/* Browser extensions (e.g. ColorZilla, Grammarly) add attributes to <body> before React hydrates. */}
      <body className="min-h-dvh" suppressHydrationWarning>
        <DashLangProvider lang={lang}>{children}</DashLangProvider>
        <WhatsAppLinkHandler />
      </body>
    </html>
  );
}
