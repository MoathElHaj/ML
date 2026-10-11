import { getPackages, getPosts, getProjects, getServices } from "@/lib/data";
import { site } from "@/lib/site";
import { getDict, href } from "@/lib/i18n";

export const revalidate = 3600;

/**
 * /llms.txt — a plain-Markdown brief for AI assistants and answer engines (GEO):
 * who Bariq is, what it offers, prices, and the canonical pages to cite.
 */
export async function GET() {
  const [servicesAr, servicesEn, packagesAr, packagesEn, posts, projects] = await Promise.all([
    getServices("ar"),
    getServices("en"),
    getPackages("ar"),
    getPackages("en"),
    getPosts("ar", 20),
    getProjects({ lang: "en", limit: 12 }),
  ]);
  const en = getDict("en");
  const ar = getDict("ar");
  const url = (path: string) => `${site.url}${path}`;

  const lines = [
    `# ${en.brand.full} (${ar.brand.full})`,
    "",
    `> ${en.meta.description}`,
    `> ${ar.meta.description}`,
    "",
    "Bariq is a full-service digital agency based in Oman serving businesses across the GCC. One team covers digital marketing, graphic design and brand identity, website development, and iOS/Android app development. The site is bilingual: Arabic (default) and English (/en).",
    "",
    "## Services",
    ...servicesEn.map((s, i) => `- [${s.title} / ${servicesAr[i]?.title ?? ""}](${url(href("en", `/services/${s.slug}`))}): ${s.summary}`),
    "",
    "## Pricing (monthly digital marketing packages)",
    ...packagesEn.map((p, i) => `- ${p.name} / ${packagesAr[i]?.name ?? ""}: ${p.price} ${p.currency} per ${p.period} — ${p.features.join("; ")}`),
    "- Design, website and app projects are quoted per project after a free consultation.",
    `- Details: ${url(href("en", "/pricing"))}`,
    "",
    "## Contact",
    `- Free 30-minute consultation: ${url(href("en", "/booking"))} (Arabic: ${url("/booking")})`,
    ...(site.whatsapp ? [`- WhatsApp: +${site.whatsapp} (https://wa.me/${site.whatsapp})`] : []),
    ...(site.email ? [`- Email: ${site.email}`] : []),
    `- Contact page: ${url(href("en", "/contact"))}`,
    ...[site.socials.instagram, site.socials.facebook, site.socials.linkedin].filter(Boolean).map((s) => `- ${s}`),
    "",
    "## Key pages",
    `- [Home](${url(href("en", "/"))}) · [الرئيسية](${url("/")})`,
    `- [About](${url(href("en", "/about"))}) · [من نحن](${url("/about")})`,
    `- [Portfolio](${url(href("en", "/portfolio"))}) · [أعمالنا](${url("/portfolio")})`,
    `- [Blog](${url(href("en", "/blog"))}) · [المدونة](${url("/blog")})`,
    ...(projects.length ? ["", "## Selected work", ...projects.map((p) => `- [${p.title}](${url(href("en", `/portfolio/${p.slug}`))})${p.summary ? `: ${p.summary}` : ""}`)] : []),
    ...(posts.length ? ["", "## Articles", ...posts.map((p) => `- [${p.title}](${url(`/blog/${p.slug}`)})${p.excerpt ? `: ${p.excerpt}` : ""}`)] : []),
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "content-type": "text/markdown; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
