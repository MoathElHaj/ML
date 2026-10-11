import Link from "next/link";
import { ChevronLeft, ChevronRight, ShieldCheck, UserRound } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { isServiceConfigured } from "@/lib/supabase/service";
import { getDashT } from "@/lib/dash";
import { ROLE_LABELS, SECTION_LABELS, type Member, type Section } from "@/lib/permissions";
import { cn, formatDate } from "@/lib/utils";
import { PageHeader, Panel, SavedNotice } from "@/components/dashboard/ui";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("المستخدمون والصلاحيات", "Users & roles") };
}

const roleStyle = {
  owner: "border-violet/30 bg-violet text-white",
  admin: "border-violet/25 bg-violet/10 text-violet",
  member: "border-line bg-white text-night",
} as const;

export default async function TeamPage(props: PageProps<"/dashboard/team">) {
  const admin = await requireSection("users");
  const { t, lang } = await getDashT();
  const { saved } = await props.searchParams;
  const { data } = await admin.supabase
    .from("admins")
    .select("user_id, email, full_name, role, permissions, is_active, created_at")
    .order("is_active", { ascending: false })
    .order("created_at");
  const members = (data ?? []) as (Member & { created_at: string })[];
  const Chevron = lang === "en" ? ChevronRight : ChevronLeft;

  return (
    <>
      <PageHeader
        title={t("المستخدمون والصلاحيات", "Users & roles")}
        description={t("أضف أعضاء الفريق وحدّد ما يستطيع كل منهم رؤيته وتعديله.", "Add team members and choose what each of them can see and change.")}
        action={{ href: "/dashboard/team/new", label: t("مستخدم جديد", "New user") }}
      />
      <SavedNotice show={saved === "1"} text={t("تمت إضافة المستخدم. أرسل له البريد وكلمة المرور المؤقتة بطريقة آمنة.", "User added. Share the email and temporary password with them securely.")} />
      {!isServiceConfigured && (
        <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[15px] text-amber-900">
          {t("لإضافة المستخدمين وتعديلهم أضف", "To add and edit users, add")} <code dir="ltr">SUPABASE_SERVICE_ROLE_KEY</code> {t("إلى إعدادات الخادم.", "to the server settings.")}
        </p>
      )}

      <Panel>
        <ul className="divide-y divide-line">
          {members.map((m) => {
            const isMe = m.user_id === admin.user.id;
            return (
              <li key={m.user_id}>
                <Link href={`/dashboard/team/${m.user_id}`} className={cn("flex items-center gap-4 px-5 py-4 transition-colors hover:bg-lilac-50/60", !m.is_active && "opacity-60")}>
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-lilac-50 text-lg font-bold text-violet" aria-hidden>
                    {(m.full_name || m.email || "?").trim().charAt(0).toUpperCase() || <UserRound className="size-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-night">{m.full_name || m.email}</span>
                      {isMe && <span className="rounded-full bg-lilac-50 px-2 py-0.5 text-xs font-semibold text-violet">{t("أنت", "You")}</span>}
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold", roleStyle[m.role])}>
                        {m.role !== "member" && <ShieldCheck className="size-3.5" aria-hidden />}
                        {ROLE_LABELS[m.role][lang]}
                      </span>
                      {!m.is_active && <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-700">{t("موقوف", "Paused")}</span>}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-muted" dir="ltr" style={{ textAlign: lang === "en" ? "left" : "right" }}>
                      {m.email}
                    </span>
                    {m.role === "member" && (
                      <span className="mt-1.5 flex flex-wrap gap-1.5">
                        {m.permissions.length ? (
                          m.permissions.map((p) => (
                            <span key={p} className="rounded-md bg-[#f3f0f9] px-2 py-0.5 text-xs text-night">
                              {SECTION_LABELS[p as Section]?.[lang] ?? p}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted">{t("المهام فقط", "Tasks only")}</span>
                        )}
                      </span>
                    )}
                  </span>
                  <span className="hidden text-sm text-muted sm:block">{formatDate(m.created_at, lang)}</span>
                  <Chevron className="size-5 shrink-0 text-muted" aria-hidden />
                </Link>
              </li>
            );
          })}
        </ul>
      </Panel>
    </>
  );
}
