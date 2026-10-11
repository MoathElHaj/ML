import "server-only";
import { createPublicClient } from "./supabase/public";
import { createServiceClient } from "./supabase/service";

export type BookingSettings = {
  working_days: number[]; // 0 = Sunday … 6 = Saturday
  slots: string[]; // "HH:MM"
  days_ahead: number;
  duration_minutes: number;
  time_zone: string;
  auto_confirm: boolean;
  reminders: boolean;
};

export type TrackingSettings = {
  gtm_id: string;
  ga4_id: string;
  google_ads_id: string;
  google_ads_lead_label: string;
  meta_pixel_id: string;
};

export type EmailSettings = {
  enabled: boolean;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from_name: string;
  from_email: string;
  notify_to: string[];
  notify_bookings: boolean;
  notify_messages: boolean;
  client_confirmations: boolean;
};

export const DEFAULT_BOOKING: BookingSettings = {
  working_days: [0, 1, 2, 3, 4],
  slots: ["10:00", "11:00", "12:00", "13:00", "14:00", "16:00", "17:00", "18:00"],
  days_ahead: 21,
  duration_minutes: 30,
  time_zone: process.env.NEXT_PUBLIC_BUSINESS_TIMEZONE || "Asia/Muscat",
  auto_confirm: false,
  reminders: true,
};

export const DEFAULT_TRACKING: TrackingSettings = { gtm_id: "", ga4_id: "", google_ads_id: "", google_ads_lead_label: "", meta_pixel_id: "" };

export const DEFAULT_EMAIL: EmailSettings = {
  enabled: false,
  host: "",
  port: 587,
  secure: false,
  user: "",
  password: "",
  from_name: "Bariq | بريق",
  from_email: "",
  notify_to: [],
  notify_bookings: true,
  notify_messages: true,
  client_confirmations: true,
};

async function publicSetting<T extends object>(key: string, fallback: T): Promise<T> {
  const supabase = createPublicClient();
  if (!supabase) return fallback;
  const { data } = await supabase.from("site_settings").select("value").eq("key", key).maybeSingle();
  return { ...fallback, ...((data?.value as Partial<T>) ?? {}) };
}

export const getBookingSettings = () => publicSetting<BookingSettings>("booking", DEFAULT_BOOKING);
export const getTrackingSettings = () => publicSetting<TrackingSettings>("tracking", DEFAULT_TRACKING);

/** SMTP settings, including the password: server-only via the service role. */
export async function getEmailSettings(): Promise<EmailSettings> {
  const supabase = createServiceClient();
  if (!supabase) return DEFAULT_EMAIL;
  const { data } = await supabase.from("private_settings").select("value").eq("key", "email").maybeSingle();
  return { ...DEFAULT_EMAIL, ...((data?.value as Partial<EmailSettings>) ?? {}) };
}

/** Days the business is closed, from today on. */
export async function getBlockedDays(): Promise<string[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];
  const { data } = await supabase.from("blocked_dates").select("day").gte("day", new Date().toISOString().slice(0, 10));
  return (data ?? []).map((r) => r.day as string);
}
