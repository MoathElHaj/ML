import { getAdmin } from "@/lib/supabase/server";
import type { Consultation } from "@/lib/types";

const STATUS: Record<string, string> = { pending: "بانتظار التأكيد", confirmed: "مؤكد", completed: "مكتمل", cancelled: "ملغي" };

const COLUMNS: [string, (c: Consultation) => unknown][] = [
  ["التاريخ", (c) => c.scheduled_date],
  ["الوقت", (c) => c.scheduled_time.slice(0, 5)],
  ["الاسم", (c) => c.full_name],
  ["الشركة", (c) => c.company],
  ["الهاتف", (c) => c.phone],
  ["البريد", (c) => c.email],
  ["الخدمة", (c) => c.service_slug],
  ["القناة", (c) => c.channel],
  ["الحالة", (c) => STATUS[c.status] ?? c.status],
  ["الرسالة", (c) => c.message],
  ["ملاحظات داخلية", (c) => c.admin_notes],
  ["اللغة", (c) => c.lang],
  ["تاريخ الطلب", (c) => c.created_at],
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
  const { data, error } = await admin.supabase.from("consultations").select("*").order("scheduled_date", { ascending: false }).order("scheduled_time", { ascending: false });
  if (error) return new Response(error.message, { status: 500 });

  const rows = [COLUMNS.map(([h]) => cell(h)).join(","), ...(data as Consultation[]).map((c) => COLUMNS.map(([, get]) => cell(get(c))).join(","))];
  const day = new Date().toISOString().slice(0, 10);
  return new Response("﻿" + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bariq-consultations-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
