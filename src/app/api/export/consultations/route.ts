import { getAdmin } from "@/lib/supabase/server";
import type { Consultation } from "@/lib/types";
import { getDashLang } from "@/lib/dash";

const STATUS: Record<string, { ar: string; en: string }> = {
  pending: { ar: "بانتظار التأكيد", en: "Pending" },
  confirmed: { ar: "مؤكد", en: "Confirmed" },
  completed: { ar: "مكتمل", en: "Completed" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
};

const COLUMNS: [string, string, (c: Consultation, lang: "ar" | "en") => unknown][] = [
  ["التاريخ", "Date", (c) => c.scheduled_date],
  ["الوقت", "Time", (c) => c.scheduled_time.slice(0, 5)],
  ["الاسم", "Name", (c) => c.full_name],
  ["الشركة", "Company", (c) => c.company],
  ["الهاتف", "Phone", (c) => c.phone],
  ["البريد", "Email", (c) => c.email],
  ["الخدمة", "Service", (c) => c.service_slug],
  ["القناة", "Channel", (c) => c.channel],
  ["الحالة", "Status", (c, lang) => STATUS[c.status]?.[lang] ?? c.status],
  ["الرسالة", "Message", (c) => c.message],
  ["ملاحظات داخلية", "Internal notes", (c) => c.admin_notes],
  ["اللغة", "Language", (c) => c.lang],
  ["تاريخ الطلب", "Requested at", (c) => c.created_at],
];

/** Excel-friendly CSV (UTF-8 BOM so Arabic opens correctly). Cells starting with =,+,-,@ are prefixed to block formula injection. */
function cell(v: unknown) {
  let s = v == null ? "" : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET() {
  const admin = await getAdmin();
  if (!admin) return new Response("Unauthorized", { status: 401 });
  if (!admin.can("bookings")) return new Response("Forbidden", { status: 403 });
  const { data, error } = await admin.supabase.from("consultations").select("*").order("scheduled_date", { ascending: false }).order("scheduled_time", { ascending: false });
  if (error) return new Response(error.message, { status: 500 });

  const lang = await getDashLang();
  const rows = [
    COLUMNS.map(([ar, en]) => cell(lang === "en" ? en : ar)).join(","),
    ...(data as Consultation[]).map((c) => COLUMNS.map(([, , get]) => cell(get(c, lang))).join(",")),
  ];
  const day = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bariq-consultations-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
