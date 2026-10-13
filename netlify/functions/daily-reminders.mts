/**
 * Netlify scheduled function: once a day (06:00 UTC = 10:00 Muscat) it calls the site's
 * reminders job, which emails tomorrow's confirmed bookings and syncs Meta lead forms.
 * Netlify sets URL to the site's main address; CRON_SECRET must be set in the site's env vars.
 */
export default async function dailyReminders() {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.error("daily-reminders: URL or CRON_SECRET is missing");
    return;
  }
  const res = await fetch(`${base}/api/cron/reminders`, { headers: { Authorization: `Bearer ${secret}` } });
  console.log("daily-reminders:", res.status, await res.text());
}

export const config = { schedule: "0 6 * * *" };
