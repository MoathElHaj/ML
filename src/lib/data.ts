import "server-only";
import { createPublicClient } from "./supabase/public";
import { defaultServices } from "./content";
import type { Post, Project, Service } from "./types";

const PROJECT_FIELDS = "*, services(title, slug)";

export async function getServices(): Promise<Service[]> {
  const supabase = createPublicClient();
  if (!supabase) return defaultServices;
  const { data, error } = await supabase
    .from("services")
    .select("*")
    .eq("is_published", true)
    .order("sort_order")
    .order("created_at");
  if (error) {
    console.error("getServices", error.message);
    return defaultServices;
  }
  return data as Service[];
}

export async function getService(slug: string): Promise<Service | null> {
  const supabase = createPublicClient();
  if (!supabase) return defaultServices.find((s) => s.slug === slug) ?? null;
  const { data } = await supabase.from("services").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  return (data as Service) ?? null;
}

export async function getProjects(opts: { limit?: number; serviceId?: string } = {}): Promise<Project[]> {
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
  return data as Project[];
}

export async function getProject(slug: string): Promise<Project | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data } = await supabase
    .from("projects")
    .select(PROJECT_FIELDS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  return (data as Project) ?? null;
}

export async function getPosts(limit?: number): Promise<Post[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  let q = supabase
    .from("posts")
    .select("*")
    .eq("is_published", true)
    .order("published_at", { ascending: false, nullsFirst: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  if (error) {
    console.error("getPosts", error.message);
    return [];
  }
  return data as Post[];
}

export async function getPost(slug: string): Promise<Post | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;
  const { data } = await supabase.from("posts").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
  return (data as Post) ?? null;
}
