import "server-only";
import { createPublicClient } from "./supabase/public";
import { defaultServices } from "./content";
import { pick, type Lang } from "./i18n";
import type { Post, Project, Service } from "./types";

const PROJECT_FIELDS = "*, services(title, title_en, slug)";

/** Swaps in English fields for English visitors; Arabic is the fallback. */
export function localizeService(s: Service, lang: Lang): Service {
  return {
    ...s,
    title: pick(lang, s.title, s.title_en),
    summary: pick(lang, s.summary, s.summary_en),
    description: pick(lang, s.description, s.description_en),
    features: pick(lang, s.features, s.features_en),
  };
}

export function localizeProject(p: Project, lang: Lang): Project {
  return {
    ...p,
    title: pick(lang, p.title, p.title_en),
    summary: pick(lang, p.summary, p.summary_en),
    description: pick(lang, p.description, p.description_en),
    tags: pick(lang, p.tags, p.tags_en),
    services: p.services ? { ...p.services, title: pick(lang, p.services.title, p.services.title_en) } : p.services,
  };
}

/** English visitors only see posts that have an English title and body. */
export function hasEnglish(p: Post) {
  return Boolean(p.title_en?.trim() && p.content_en?.trim());
}

export function localizePost(p: Post, lang: Lang): Post {
  if (lang !== "en" || !hasEnglish(p)) return p;
  return {
    ...p,
    title: p.title_en!,
    excerpt: p.excerpt_en?.trim() || "",
    content: p.content_en!,
    category: p.category_en?.trim() || null,
  };
}

export async function getServices(lang: Lang = "ar"): Promise<Service[]> {
  const supabase = createPublicClient();
  if (!supabase) return defaultServices.map((s) => localizeService(s, lang));
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_published", true)
    .order("sort_order")
    .order("created_at");
  if (error) {
    console.error("getServices", error.message);
    return defaultServices.map((s) => localizeService(s, lang));
  }
  return (data as Service[]).map((s) => localizeService(s, lang));
}

export async function getService(slug: string, lang: Lang = "ar"): Promise<Service | null> {
  const supabase = createPublicClient();
  if (!supabase) {
    const s = defaultServices.find((x) => x.slug === slug);
    return s ? localizeService(s, lang) : null;
  }
  const { data } = await supabase.from("services").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  return data ? localizeService(data as Service, lang) : null;
}

export async function getProjects(opts: { lang?: Lang; limit?: number; serviceId?: string } = {}): Promise<Project[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  let q = supabase
    .from("projects")
    .select(PROJECT_FIELDS)
    .eq("is_published", true)
    .order("is_featured", { ascending: false })
    .order("sort_order")
    .order("created_at", { ascending: false });
  if (opts.serviceId) q = q.eq("service_id", opts.serviceId);
  if (opts.limit) q = q.limit(opts.limit);
  const { data, error } = await q;
  if (error) {
    console.error("getProjects", error.message);
    return [];
  }
  return (data as Project[]).map((p) => localizeProject(p, opts.lang ?? "ar"));
}

export async function getProject(slug: string, lang: Lang = "ar"): Promise<Project | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_FIELDS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return data ? localizeProject(data as Project, lang) : null;
}

/** Published posts; English visitors only get posts that have an English version. */
export async function getPosts(lang: Lang = "ar", limit?: number): Promise<Post[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  let q = supabase
    .from("posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (lang === "en") q = q.not("title_en", "is", null).not("content_en", "is", null);
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) {
    console.error("getPosts", error.message);
    return [];
  }
  const posts = data as Post[];
  return (lang === "en" ? posts.filter(hasEnglish) : posts).map((p) => localizePost(p, lang));
}

export async function getPost(slug: string, lang: Lang = "ar"): Promise<Post | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data } = await supabase.from("posts").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  return data ? localizePost(data as Post, lang) : null;
}
