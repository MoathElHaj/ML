import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getBookingSettings, getEmailSettings } from "@/lib/settings";
import { isEmailReady, reminderMail, sendMail } from "@/lib/email";
import { addDays, todayIn } from "@/lib/utils";
import type { Consultation } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Daily job (vercel.json cron): emails a reminder to every client with a confirmed
 * consultation tomorrow. Protected by CRON_SECRET; safe to run more than once a day.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const db = createServiceClient();
  if (!db) return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY is not set" }, { status: 500 });

  const [booking, email] = await Promise.all([getBookingSettings(), getEmailSettings()]);
  if (!booking.reminders) return NextResponse.json({ sent: 0, skipped: "reminders are off" });
  if (!isEmailReady(email)) return NextResponse.json({ sent: 0, skipped: "email is not configured" });

  const tomorrow = addDays(todayIn(booking.time_zone), 1);
  const { data, error } = await db
    .from("consultations")
    .select("*")
    .eq("scheduled_date", tomorrow)
    .eq("status", "confirmed")
    .is("reminder_sent_at", null)
    .not("email", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const c of (data ?? []) as Consultation[]) {
    const res = await sendMail(reminderMail(c, booking.duration_minutes, booking.time_zone), email);
    if (res.ok) {
      sent++;
      await db.from("consultations").update({ reminder_sent_at: new Date().toISOString() }).eq("id", c.id);
    }
  }
  return NextResponse.json({ date: tomorrow, candidates: data?.length ?? 0, sent });
}
