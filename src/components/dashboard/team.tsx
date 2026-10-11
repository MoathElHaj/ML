"use client";

import { useActionState, useState } from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import { createMember, resetMemberPassword, updateMember, updateMyAccount } from "@/actions/team";
import { PRESETS, ROLE_LABELS, SECTION_LABELS, SECTIONS, type Role, type Section } from "@/lib/permissions";
import type { FormState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TextField } from "@/components/forms/Field";
import { Card, SaveBar } from "./kit";
import { useT } from "./DashLang";

const initial: FormState = { ok: false };

function RoleAndPermissions({
  role: initialRole,
  permissions: initialPermissions,
  canGrantOwner,
  locked,
  error,
}: {
  role: Role;
  permissions: string[];
  canGrantOwner: boolean;
  /** Editing yourself: the role can't change. */
  locked?: boolean;
  error?: string;
}) {
  const { t, lang } = useT();
  const [role, setRole] = useState<Role>(initialRole);
  const [perms, setPerms] = useState<Set<string>>(new Set(initialPermissions));
  const roles: Role[] = canGrantOwner ? ["owner", "admin", "member"] : ["admin", "member"];
  const roleHint: Record<Role, string> = {
    owner: t("كل الصلاحيات، ويدير المستخدمين والمالكين.", "Full access, manages users and owners."),
    admin: t("كل الصلاحيات، ويدير المستخدمين (عدا المالكين).", "Full access, manages users (except owners)."),
    member: t("يرى فقط الأقسام التي تختارها له.", "Sees only the sections you pick."),
  };

  return (
    <>
      <fieldset disabled={locked}>
        <legend className="field-label">{t("الدور", "Role")}</legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {roles.map((r) => (
            <label
              key={r}
              className={cn(
                "flex cursor-pointer flex-col rounded-2xl border-[1.5px] p-4 transition-colors",
                role === r ? "border-violet bg-lilac-50" : "border-line hover:border-violet/50",
                locked && "cursor-not-allowed opacity-70",
              )}
            >
              <span className="flex items-center gap-2">
                <input type="radio" name="role" value={r} checked={role === r} onChange={() => setRole(r)} className="accent-violet" />
                <span className="font-semibold text-night">{ROLE_LABELS[r][lang]}</span>
              </span>
              <span className="mt-1 text-sm text-muted">{roleHint[r]}</span>
            </label>
          ))}
        </div>
        {locked && <input type="hidden" name="role" value={role} />}
      </fieldset>

      {role === "member" ? (
        <fieldset>
          <legend className="field-label">{t("الأقسام المسموح بها", "Allowed sections")}</legend>
          <div className="mb-3 flex flex-wrap gap-2">
            <span className="text-sm text-muted">{t("قوالب جاهزة:", "Presets:")}</span>
            {PRESETS.map((p) => (
              <button key={p.key} type="button" onClick={() => setPerms(new Set(p.sections))} className="rounded-full bg-lilac-50 px-3 py-1 text-sm font-semibold text-violet hover:bg-lilac-100">
                {lang === "en" ? p.en : p.ar}
              </button>
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {SECTIONS.map((s: Section) => (
              <label key={s} className={cn("flex cursor-pointer items-start gap-3 rounded-2xl border p-3.5 transition-colors", perms.has(s) ? "border-violet bg-lilac-50" : "border-line")}>
                <input
                  type="checkbox"
                  name="permissions"
                  value={s}
                  checked={perms.has(s)}
                  onChange={(e) => {
                    const next = new Set(perms);
                    if (e.target.checked) next.add(s);
                    else next.delete(s);
                    setPerms(next);
                  }}
                  className="mt-1 size-4 accent-violet"
                />
                <span>
                  <span className="block font-semibold text-night">{SECTION_LABELS[s][lang]}</span>
                  <span className="block text-sm text-muted">{SECTION_LABELS[s].hint[lang]}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="field-hint">{t("كل عضو يرى «المهام» المسندة إليه دائماً، و«نظرة عامة».", "Everyone always sees their own tasks and the overview.")}</p>
          {error && <p className="field-error">{error}</p>}
        </fieldset>
      ) : (
        <p className="flex items-center gap-2 rounded-2xl bg-lilac-50 px-4 py-3 text-sm text-night">
          <ShieldCheck className="size-5 text-violet" aria-hidden />
          {t("هذا الدور يصل إلى كل أقسام لوحة التحكم.", "This role can access every section of the dashboard.")}
        </p>
      )}
    </>
  );
}

export function NewMemberForm({ canGrantOwner }: { canGrantOwner: boolean }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(createMember, initial);
  const e = state.errors ?? {};
  const v = state.values ?? {};
  return (
    <form action={action} className="space-y-6">
      <Card title={t("بيانات المستخدم", "User details")} description={t("يدخل المستخدم بهذا البريد وكلمة المرور المؤقتة، ويستطيع تغييرها من «حسابي».", "They sign in with this email and temporary password, and can change it from “My account”.")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label={t("الاسم", "Name")} name="full_name" required defaultValue={v.full_name} error={e.full_name} />
          <TextField label={t("البريد الإلكتروني", "Email")} name="email" type="email" dir="ltr" required defaultValue={v.email} error={e.email} autoComplete="off" />
          <TextField
            label={t("كلمة مرور مؤقتة", "Temporary password")}
            name="password"
            type="password"
            dir="ltr"
            required
            minLength={8}
            autoComplete="new-password"
            error={e.password}
            hint={t("8 أحرف على الأقل.", "At least 8 characters.")}
          />
        </div>
      </Card>
      <Card title={t("الدور والصلاحيات", "Role & permissions")}>
        <RoleAndPermissions role={(v.role as Role) || "member"} permissions={v.permissions ? v.permissions.split(",") : ["bookings", "messages", "clients"]} canGrantOwner={canGrantOwner} error={e.permissions} />
      </Card>
      <SaveBar pending={pending} state={state} label={t("إضافة المستخدم", "Add user")} />
    </form>
  );
}

export function EditMemberForm({
  member,
  canGrantOwner,
  isSelf,
}: {
  member: { user_id: string; full_name: string | null; role: Role; permissions: string[] };
  canGrantOwner: boolean;
  isSelf: boolean;
}) {
  const { t } = useT();
  const [state, action, pending] = useActionState(updateMember, initial);
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="user_id" value={member.user_id} />
      <Card title={t("الدور والصلاحيات", "Role & permissions")}>
        <TextField label={t("الاسم", "Name")} name="full_name" required defaultValue={member.full_name ?? ""} error={e.full_name} className="max-w-md" />
        <RoleAndPermissions role={member.role} permissions={member.permissions} canGrantOwner={canGrantOwner || member.role === "owner"} locked={isSelf} error={e.permissions} />
      </Card>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}

export function ResetPasswordForm({ userId }: { userId: string }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(resetMemberPassword, initial);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="user_id" value={userId} />
      <TextField label={t("كلمة مرور جديدة", "New password")} name="password" type="password" dir="ltr" minLength={8} required autoComplete="new-password" className="max-w-md" />
      <SaveBar pending={pending} state={state} label={t("تعيين كلمة المرور", "Set password")} />
    </form>
  );
}

export function MyAccountForm({ fullName, email }: { fullName: string; email: string }) {
  const { t } = useT();
  const [state, action, pending] = useActionState(updateMyAccount, initial);
  const e = state.errors ?? {};
  return (
    <form action={action} className="space-y-6">
      <Card title={t("بياناتي", "My details")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField label={t("الاسم", "Name")} name="full_name" required defaultValue={fullName} error={e.full_name} />
          <TextField label={t("البريد الإلكتروني", "Email")} name="email_display" dir="ltr" value={email} readOnly disabled />
        </div>
      </Card>
      <Card title={t("تغيير كلمة المرور", "Change password")} description={t("اتركها فارغة إن لم ترد تغييرها.", "Leave empty to keep your current password.")}>
        <TextField
          label={t("كلمة المرور الجديدة", "New password")}
          name="password"
          type="password"
          dir="ltr"
          minLength={8}
          autoComplete="new-password"
          error={e.password}
          className="max-w-md"
        />
        <p className="flex items-center gap-2 text-sm text-muted">
          <KeyRound className="size-4" aria-hidden />
          {t("استخدم 12 حرفاً أو أكثر تمزج بين الحروف والأرقام.", "Use 12+ characters mixing letters and numbers.")}
        </p>
      </Card>
      <SaveBar pending={pending} state={state} />
    </form>
  );
}
