export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

type L = "ar" | "en";
const intlLocale = (lang: L) => (lang === "en" ? "en-GB" : "ar-u-nu-latn");
const fmt = (lang: L, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(intlLocale(lang), opts);

/** Parses a plain `YYYY-MM-DD` date at local noon so it never shifts a day across time zones. */
export function parseDay(day: string) {
  return new Date(`${day}T12:00:00`);
}

export function formatDate(value: string | Date | null | undefined, lang: L = "ar") {
  if (!value) return "";
  const d = typeof value === "string" ? (value.length === 10 ? parseDay(value) : new Date(value)) : value;
  return fmt(lang, { day: "numeric", month: "long", year: "numeric" }).format(d);
}

export function formatDay(day: string, lang: L = "ar") {
  return fmt(lang, { weekday: "long", day: "numeric", month: "long" }).format(parseDay(day));
}

export function formatShortWeekday(day: string, lang: L = "ar") {
  return fmt(lang, { weekday: "short" }).format(parseDay(day));
}

export function formatShortMonth(day: string, lang: L = "ar") {
  return fmt(lang, { month: "short" }).format(parseDay(day));
}

/** Today's date (YYYY-MM-DD) in the given IANA time zone. */
export function todayIn(timeZone: string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

/** Adds whole days to a YYYY-MM-DD string without touching time zones. */
export function addDays(day: string, n: number) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** 0 = Sunday … 6 = Saturday, for a YYYY-MM-DD string. */
export function weekdayOf(day: string) {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

export function dayOfMonth(day: string) {
  return Number(day.slice(8, 10));
}

export function toDayString(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** "14:00:00" or "14:00" → "2:00 م" / "2:00 PM" */
export function formatTime(time: string, lang: L = "ar") {
  const [hStr, m] = time.split(":");
  const h = Number(hStr);
  const suffix = lang === "en" ? (h >= 12 ? "PM" : "AM") : h >= 12 ? "م" : "ص";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${m} ${suffix}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function readingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}
