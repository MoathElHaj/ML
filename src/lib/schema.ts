import { site } from "./site";
import { getDict, href, type Lang } from "./i18n";
import type { ViewPackage } from "./data";
import type { Post, Project, Service } from "./types";

/**
 * schema.org builders. Clear, consistent entities (one Organization @id referenced
 * everywhere) help Google rich results and AI answer engines understand Bariq.
 */
const abs = (path: string) => `${site.url}${path}`;
export const ORG_ID = `${site.url}/#organization`;
const WEBSITE_ID = `${site.url}/#website`;

export function organizationSchema(lang: Lang) {
  const t = getDict(lang);
  const sameAs = [site.socials.instagram, site.socials.facebook, site.socials.linkedin, site.socials.x, site.socials.tiktok].filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "ProfessionalService"],
    "@id": ORG_ID,
    name: t.brand.full,
    alternateName: [t.brand.other, "Bariq", "بريق"],
    url: abs(href(lang, "/")),
    logo: abs("/images/logo.png"),
    image: abs("/images/logo.png"),
    description: t.meta.description,
    slogan: t.brand.slogan,
    areaServed: [
      { "@type": "Country", name: "Oman" },
      { "@type": "Place", name: lang === "ar" ? "دول الخليج العربي" : "GCC countries" },
    ],
    knowsLanguage: ["ar", "en"],
    knowsAbout: ["Digital marketing", "Social media management", "SEO", "Graphic design", "Brand identity", "Web development", "E-commerce", "Mobile app development", "UI/UX design"],
    ...(site.address ? { address: { "@type": "PostalAddress", streetAddress: site.address, addressCountry: "OM" } } : { address: { "@type": "PostalAddress", addressCountry: "OM" } }),
    ...(site.email ? { email: site.email } : {}),
    ...(site.whatsapp ? { telephone: `+${site.whatsapp}` } : {}),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        availableLanguage: ["Arabic", "English"],
        ...(site.whatsapp ? { telephone: `+${site.whatsapp}`, url: `https://wa.me/${site.whatsapp}` } : {}),
        ...(site.email ? { email: site.email } : {}),
      },
    ],
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteSchema(lang: Lang) {
  const t = getDict(lang);
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: abs(href(lang, "/")),
    name: t.brand.full,
    inLanguage: lang === "ar" ? "ar" : "en",
    publisher: { "@id": ORG_ID },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

export function serviceSchema(lang: Lang, s: Service) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": abs(href(lang, `/services/${s.slug}`)) + "#service",
    name: s.title,
    description: s.description || s.summary,
    serviceType: s.title,
    url: abs(href(lang, `/services/${s.slug}`)),
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "Oman" },
    inLanguage: lang,
    ...(s.features.length
      ? {
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: s.title,
            itemListElement: s.features.map((f) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: f } })),
          },
        }
      : {}),
  };
}

export function packagesSchema(lang: Lang, packages: ViewPackage[]) {
  const t = getDict(lang);
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: t.pricing.packagesSr,
    serviceType: lang === "ar" ? "التسويق الرقمي" : "Digital marketing",
    provider: { "@id": ORG_ID },
    url: abs(href(lang, "/pricing")),
    offers: packages.map((p) => ({
      "@type": "Offer",
      name: p.name,
      description: p.tagline,
      price: p.price,
      priceCurrency: p.currency,
      ...(p.period !== "once"
        ? { priceSpecification: { "@type": "UnitPriceSpecification", price: p.price, priceCurrency: p.currency, unitCode: p.period === "month" ? "MON" : "ANN", referenceQuantity: { "@type": "QuantitativeValue", value: 1, unitCode: p.period === "month" ? "MON" : "ANN" } } }
        : {}),
      url: abs(href(lang, "/pricing")),
      seller: { "@id": ORG_ID },
    })),
  };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
}

export function articleSchema(lang: Lang, p: Post) {
  const url = abs(href(lang, `/blog/${p.slug}`));
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: url,
    url,
    headline: p.meta_title || p.title,
    description: p.meta_description || p.excerpt,
    inLanguage: lang,
    datePublished: p.published_at ?? p.created_at,
    dateModified: p.updated_at ?? p.published_at ?? p.created_at,
    ...(p.cover_url ? { image: [p.cover_url] } : { image: [abs("/images/logo.png")] }),
    author: { "@type": "Organization", name: p.author_name, "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    ...(p.category ? { articleSection: p.category } : {}),
    wordCount: p.content.trim().split(/\s+/).length,
  };
}

export function projectSchema(lang: Lang, p: Project) {
  const url = abs(href(lang, `/portfolio/${p.slug}`));
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": `${url}#work`,
    url,
    name: p.title,
    description: p.summary,
    inLanguage: lang,
    creator: { "@id": ORG_ID },
    ...(p.cover_url ? { image: p.cover_url } : {}),
    ...(p.client ? { sourceOrganization: { "@type": "Organization", name: p.client } } : {}),
    ...(p.tags.length ? { keywords: p.tags.join(", ") } : {}),
  };
}

/** FAQs shown on the pricing page and in the chat; the price answer follows the live packages. */
export function siteFaqs(lang: Lang, packages: ViewPackage[]) {
  const t = getDict(lang);
  const priceList = packages.map((p) => `${p.name} ${p.price} ${t.pricing.currency(p.currency)}`).join(lang === "ar" ? "، " : ", ");
  return t.chat.faqs.map((f, i) =>
    i === 1 && packages.length
      ? {
          ...f,
          a:
            lang === "ar"
              ? `لدينا ${packages.length} باقات شهرية للتسويق الرقمي: ${priceList}. تشمل الاستراتيجية وخطة التسويق والمنشورات وفيديوهات الريلز.`
              : `We have ${packages.length} monthly digital marketing packages: ${priceList}. They include strategy, a marketing plan, posts and Reels videos.`,
        }
      : f,
  );
}
