import Link from "next/link";
import { notFound } from "next/navigation";
import { Pause, Play, Trash2 } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { removeMember, setMemberActive } from "@/actions/team";
import type { Member } from "@/lib/permissions";
import { formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { EditMemberForm, ResetPasswordForm } from "@/components/dashboard/team";
import { Panel } from "@/components/dashboard/ui";

export default async function MemberPage(props: PageProps<"/dashboard/team/[id]">) {
  const admin = await requireSection("users");
  const { t, lang } = await getDashT();
  const { id } = await props.params;
  const { data } = await admin.supabase.from("admins").select("user_id, email, full_name, role, permissions, is_active, created_at").eq("user_id", id).maybeSingle();
  if (!data) notFound();
  const m = data as Member & { created_at: string };
  const isSelf = m.user_id === admin.user.id;
  const iAmOwner = admin.member.role === "owner";
  const editable = iAmOwner || m.role !== "owner";

  return (
    <>
      <div className="mb-8">
        <Link href="/dashboard/team" className="text-sm font-semibold text-violet hover:underline">
          {t("→ المستخدمون", "← Users")}
        </Link>
        <h1 className="mt-2 text-[28px] font-bold text-night">{m.full_name || m.email}</h1>
        <p className="mt-1 text-muted">
          <span dir="ltr">{m.email}</span> · {t("أضيف في", "Added")} {formatDate(m.created_at, lang)}
        </p>
      </div>

      {!editable ? (
        <p className="rounded-2xl border border-line bg-white px-5 py-4 text-muted">{t("فقط المالك يستطيع تعديل حساب مالك.", "Only an owner can edit an owner's account.")}</p>
      ) : (
        <div className="space-y-6">
          <EditMemberForm member={{ user_id: m.user_id, full_name: m.full_name, role: m.role, permissions: m.permissions }} canGrantOwner={iAmOwner} isSelf={isSelf} />

          {isSelf ? (
            <p className="rounded-2xl border border-line bg-white px-5 py-4 text-sm text-muted">
              {t("لتغيير كلمة مرورك استخدم صفحة", "To change your own password use")}{" "}
              <Link href="/dashboard/account" className="font-semibold text-violet hover:underline">
                {t("حسابي", "My account")}
              </Link>
              .
            </p>
          ) : (
            <>
              <Panel title={t("كلمة المرور", "Password")}>
                <div className="p-5">
                  <ResetPasswordForm userId={m.user_id} />
                </div>
              </Panel>
              <Panel title={t("الوصول", "Access")}>
                <div className="flex flex-wrap gap-3 p-5">
                  <form action={setMemberActive}>
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <input type="hidden" name="active" value={m.is_active ? "0" : "1"} />
                    <ConfirmButton
                      className="btn btn-outline btn-sm"
                      message={m.is_active ? t("إيقاف دخول هذا المستخدم مؤقتاً؟", "Pause this user's access?") : t("إعادة تفعيل هذا المستخدم؟", "Re-activate this user?")}
                    >
                      {m.is_active ? <Pause className="size-4" aria-hidden /> : <Play className="size-4" aria-hidden />}
                      {m.is_active ? t("إيقاف مؤقت", "Pause access") : t("إعادة التفعيل", "Re-activate")}
                    </ConfirmButton>
                  </form>
                  <form action={removeMember}>
                    <input type="hidden" name="user_id" value={m.user_id} />
                    <ConfirmButton
                      className="btn btn-danger btn-sm"
                      message={t("حذف هذا المستخدم نهائياً؟ تبقى مهامه وعملاؤه بدون مسؤول.", "Delete this user permanently? Their tasks and clients stay, unassigned.")}
                    >
                      <Trash2 className="size-4" aria-hidden />
                      {t("حذف المستخدم", "Delete user")}
                    </ConfirmButton>
                  </form>
                </div>
              </Panel>
            </>
          )}
        </div>
      )}
    </>
  );
}
