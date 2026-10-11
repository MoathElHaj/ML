import type { MetadataRoute } from "next";
import { getPosts, getProjects, getServices } from "@/lib/data";
import { href, locales, type Lang } from "@/lib/i18n";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, postsAr, postsEn] = await Promise.all([getServices(), getProjects(), getPosts("ar"), getPosts("en")]);
  const englishPosts = new Set(postsEn.map((p) => p.slug));

  const entry = (path: string, langs: readonly Lang[], extra: Partial<MetadataRoute.Sitemap[number]> = {}) =>
    langs.map((lang) => ({
      url: `${site.url}${href(lang, path)}`,
      alternates: { languages: Object.fromEntries(langs.map((l) => [l, `${site.url}${href(l, path)}`])) },
      ...extra,
    }));

  return [
    ...["/", "/services", "/portfolio", "/pricing", "/about", "/blog", "/contact", "/booking"].flatMap((p) =>
      entry(p, locales, { changeFrequency: "weekly", priority: p === "/" ? 1 : 0.8 }),
    ),
    ...services.flatMap((s) => entry(`/services/${s.slug}`, locales, { lastModified: s.updated_at, priority: 0.7 })),
    ...projects.flatMap((p) => entry(`/portfolio/${p.slug}`, locales, { lastModified: p.updated_at, priority: 0.6 })),
    ...postsAr.flatMap((p) =>
      entry(`/blog/${p.slug}`, englishPosts.has(p.slug) ? locales : ["ar"], { lastModified: p.updated_at ?? p.published_at ?? undefined, priority: 0.6 }),
    ),
  ];
}
