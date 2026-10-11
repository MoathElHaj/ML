import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "./env";

/** Cookie-less client for public reads and visitor submissions, so public pages stay cacheable. */
export function createPublicClient() {
  if (!isSupabaseConfigured) return null;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
