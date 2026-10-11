import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { site } from "@/lib/site";
import { dirOf, getDict, isLang, locales } from "@/lib/i18n";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { WhatsAppButton } from "@/components/site/WhatsAppButton";
import { WhatsAppLinkHandler } from "@/components/WhatsAppLinkHandler";
import "../globals.css";

const plex = IBM_Plex_Sans_Arabic({
  variable: "--font-plex",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata(props: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await props.params;
  if (!isLang(lang)) return {};
  const t = getDict(lang).meta;
  return {
    metadataBase: new URL(site.url),
    title: { default: t.title, template: `%s | ${t.siteName}` },
    description: t.description,
    openGraph: {
      type: "website",
      locale: t.ogLocale,
      siteName: t.siteName,
      title: t.siteName,
      description: t.description,
      images: [{ url: "/images/hero.jpg", width: 1600, height: 900, alt: t.siteName }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: "#612aae",
};

/** Applies a saved dark-mode choice before first paint. Light is the default for everyone else. */
const themeScript = `try{if(localStorage.getItem("bariq-theme")==="dark")document.documentElement.classList.add("dark")}catch(e){}`;

export default async function SiteLayout(props: LayoutProps<"/[lang]">) {
  const { lang } = await props.params;
  if (!isLang(lang)) notFound();
  return (
    <html lang={lang} dir={dirOf(lang)} className={plex.variable} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <Header lang={lang} />
        <main id="main">{props.children}</main>
        <Footer lang={lang} />
        <WhatsAppButton lang={lang} />
        <WhatsAppLinkHandler />
      </body>
    </html>
  );
}
