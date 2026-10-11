import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { redirect } from "next/navigation";
import { canAccess, isManager, type Member, type Section } from "@/lib/permissions";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

/** Session-aware client for the dashboard and auth actions. */
export async function createSessionClient() {
  if (!isSupabaseConfigured) return null;
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** Returns the signed-in team member's client and profile, or null when the visitor is not an active member. */
export async function getAdmin() {
  const supabase = await createSessionClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("admins")
    .select("user_id, email, full_name, role, permissions, is_active, dashboard_lang")
    .eq("user_id", user.id)
    .maybeSingle();
  const member = data as Member | null;
  if (!member?.is_active) return null;
  return { supabase, user, member, can: (section: Section) => canAccess(member, section), isManager: isManager(member) };
}

export type Admin = NonNullable<Awaited<ReturnType<typeof getAdmin>>>;

/** For dashboard pages and actions: signed-in member with access to `section` (or a manager when "users"). */
export async function requireSection(section: Section | "users" | null = null): Promise<Admin> {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const ok = section === null ? true : section === "users" ? admin.isManager : admin.can(section);
  if (!ok) redirect(`/dashboard?denied=${section}`);
  return admin;
}
