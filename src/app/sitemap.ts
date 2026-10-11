import type { MetadataRoute } from "next";
import { getPosts, getProjects, getServices } from "@/lib/data";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [services, projects, posts] = await Promise.all([getServices(), getProjects(), getPosts()]);
  const staticPages = ["", "/services", "/portfolio", "/about", "/blog", "/contact", "/booking"].map((p) => ({
    url: `${site.url}${p}`,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  return [
    ...staticPages,
    ...services.map((s) => ({ url: `${site.url}/services/${s.slug}`, lastModified: s.updated_at, priority: 0.7 })),
    ...projects.map((p) => ({ url: `${site.url}/portfolio/${p.slug}`, lastModified: p.updated_at, priority: 0.6 })),
    ...posts.map((p) => ({ url: `${site.url}/blog/${p.slug}`, lastModified: p.updated_at ?? p.published_at ?? undefined, priority: 0.6 })),
  ];
}
