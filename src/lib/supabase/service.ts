import "server-only";
import { createClient } from "@supabase/supabase-js";
import { supabaseUrl } from "./env";

const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY ?? "";

export const isServiceConfigured = Boolean(supabaseUrl && serviceKey);

/**
 * Bypasses row-level security. Server-only, for work no visitor session can do:
 * reading SMTP settings to send notifications, the reminder cron, and the email log.
 */
export function createServiceClient() {
  if (!isServiceConfigured) return null;
  return createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
