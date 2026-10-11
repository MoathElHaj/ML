import type { Metadata } from "next";
import { href, type Lang } from "./i18n";

/** Page metadata with canonical + hreflang links between the Arabic and English versions. */
export function pageMeta(lang: Lang, path: string, title: string, description?: string, image?: string | null): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: href(lang, path),
      languages: { ar: href("ar", path), en: href("en", path), "x-default": href("ar", path) },
    },
    openGraph: image ? { images: [image] } : undefined,
  };
}
