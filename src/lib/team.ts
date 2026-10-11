import "server-only";
import type { Admin } from "@/lib/supabase/server";

/** Active team members for assignment pickers (name falls back to email). */
export async function getTeamOptions(admin: Admin) {
  const { data } = await admin.supabase.from("admins").select("user_id, full_name, email").eq("is_active", true).order("full_name");
  return (data ?? []).map((m) => ({ user_id: m.user_id as string, name: (m.full_name as string | null) || (m.email as string | null) || "—" }));
}
