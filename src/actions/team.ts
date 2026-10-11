"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSection, type Admin } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getDashT } from "@/lib/dash";
import { SECTIONS, type Member, type Role } from "@/lib/permissions";
import { fieldErrors } from "@/lib/validation";
import type { FormState } from "@/lib/types";

const roles = ["owner", "admin", "member"] as const;

async function memberSchema() {
  const { t } = await getDashT();
  return z.object({
    full_name: z.string().trim().min(2, t("اكتب الاسم.", "Enter a name.")).max(120),
    role: z.enum(roles),
    permissions: z.array(z.enum(SECTIONS)),
  });
}

function readMember(formData: FormData) {
  return {
    full_name: String(formData.get("full_name") ?? ""),
    role: String(formData.get("role") ?? "member"),
    permissions: formData.getAll("permissions").map(String),
  };
}

async function service() {
  const db = createServiceClient();
  if (!db) {
    const { t } = await getDashT();
    throw new Error(t("أضف SUPABASE_SERVICE_ROLE_KEY إلى إعدادات الخادم لإدارة المستخدمين.", "Add SUPABASE_SERVICE_ROLE_KEY to the server settings to manage users."));
  }
  return db;
}

/** Who may change whom: admins can't touch owners or create them; only owners manage owners. */
function mayEdit(me: Admin, target: Pick<Member, "role"> | null, nextRole?: Role) {
  if (me.member.role === "owner") return true;
  if (target?.role === "owner") return false;
  return nextRole !== "owner";
}

async function activeOwners(db: NonNullable<ReturnType<typeof createServiceClient>>) {
  const { count } = await db.from("admins").select("user_id", { count: "exact", head: true }).eq("role", "owner").eq("is_active", true);
  return count ?? 0;
}

export async function createMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireSection("users");
  const { t } = await getDashT();
  const raw = { ...readMember(formData), email: String(formData.get("email") ?? "").trim().toLowerCase(), password: String(formData.get("password") ?? "") };
  const schema = (await memberSchema()).extend({
    email: z.string().email(t("بريد إلكتروني غير صالح.", "Invalid email address.")),
    password: z.string().min(8, t("كلمة المرور 8 أحرف على الأقل.", "Password must be at least 8 characters.")).max(72),
  });
  const parsed = schema.safeParse(raw);
  const values = { ...raw, password: "", permissions: raw.permissions.join(",") };
  if (!parsed.success) return { ok: false, message: t("راجع الحقول المظللة.", "Check the highlighted fields."), errors: fieldErrors(parsed.error), values };
  const v = parsed.data;
  if (!mayEdit(me, null, v.role)) return { ok: false, message: t("فقط المالك يستطيع إضافة مالك آخر.", "Only an owner can add another owner."), values };

  try {
    const db = await service();
    const { data: created, error } = await db.auth.admin.createUser({ email: v.email, password: v.password, email_confirm: true, user_metadata: { full_name: v.full_name } });
    let userId = created?.user?.id;
    if (error) {
      // The person may already have an account (e.g. removed earlier): reuse it.
      if (!/already|registered|exists/i.test(error.message)) return { ok: false, message: error.message, values };
      const { data: found } = await db.from("admins").select("user_id").eq("email", v.email).maybeSingle();
      if (found) return { ok: false, message: t("هذا البريد مضاف للفريق بالفعل.", "This email is already on the team."), values };
      const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
      userId = list?.users.find((u) => u.email?.toLowerCase() === v.email)?.id;
      if (!userId) return { ok: false, message: error.message, values };
      await db.auth.admin.updateUserById(userId, { password: v.password });
    }
    const { error: insertError } = await db.from("admins").upsert({
      user_id: userId,
      email: v.email,
      full_name: v.full_name,
      role: v.role,
      permissions: v.role === "member" ? v.permissions : [],
      is_active: true,
    });
    if (insertError) return { ok: false, message: insertError.message, values };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e), values };
  }
  revalidatePath("/dashboard/team");
  redirect("/dashboard/team?saved=1");
}

export async function updateMember(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireSection("users");
  const { t } = await getDashT();
  const userId = String(formData.get("user_id") ?? "");
  const raw = readMember(formData);
  const values = { ...raw, permissions: raw.permissions.join(",") };
  const parsed = (await memberSchema()).safeParse(raw);
  if (!parsed.success) return { ok: false, message: t("راجع الحقول المظللة.", "Check the highlighted fields."), errors: fieldErrors(parsed.error), values };
  const v = parsed.data;

  try {
    const db = await service();
    const { data: target } = await db.from("admins").select("role").eq("user_id", userId).maybeSingle();
    if (!target) return { ok: false, message: t("المستخدم غير موجود.", "User not found."), values };
    if (!mayEdit(me, target as Member, v.role)) return { ok: false, message: t("لا تملك صلاحية تعديل هذا المستخدم.", "You can't edit this user."), values };
    if (userId === me.user.id && v.role !== me.member.role)
      return { ok: false, message: t("لا يمكنك تغيير دورك بنفسك. اطلب ذلك من مالك آخر.", "You can't change your own role. Ask another owner."), values };
    if (target.role === "owner" && v.role !== "owner" && (await activeOwners(db)) <= 1)
      return { ok: false, message: t("يجب أن يبقى مالك واحد على الأقل.", "There must be at least one owner."), values };

    const { error } = await db
      .from("admins")
      .update({ full_name: v.full_name, role: v.role, permissions: v.role === "member" ? v.permissions : [] })
      .eq("user_id", userId);
    if (error) return { ok: false, message: error.message, values };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e), values };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: t("تم حفظ الصلاحيات.", "Permissions saved.") };
}

export async function setMemberActive(formData: FormData) {
  const me = await requireSection("users");
  const userId = String(formData.get("user_id") ?? "");
  const active = formData.get("active") === "1";
  if (userId === me.user.id) return;
  const db = createServiceClient();
  if (!db) return;
  const { data: target } = await db.from("admins").select("role").eq("user_id", userId).maybeSingle();
  if (!target || !mayEdit(me, target as Member)) return;
  if (!active && target.role === "owner" && (await activeOwners(db)) <= 1) return;
  // A paused member fails every dashboard check immediately (getAdmin requires is_active).
  await db.from("admins").update({ is_active: active }).eq("user_id", userId);
  revalidatePath("/dashboard/team");
}

export async function resetMemberPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireSection("users");
  const { t } = await getDashT();
  const userId = String(formData.get("user_id") ?? "");
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { ok: false, message: t("كلمة المرور 8 أحرف على الأقل.", "Password must be at least 8 characters.") };
  try {
    const db = await service();
    const { data: target } = await db.from("admins").select("role").eq("user_id", userId).maybeSingle();
    if (!target || !mayEdit(me, target as Member)) return { ok: false, message: t("لا تملك صلاحية تعديل هذا المستخدم.", "You can't edit this user.") };
    const { error } = await db.auth.admin.updateUserById(userId, { password });
    if (error) return { ok: false, message: error.message };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
  return { ok: true, message: t("تم تعيين كلمة المرور الجديدة. أرسلها للمستخدم بطريقة آمنة.", "New password set. Share it with the user securely.") };
}

export async function removeMember(formData: FormData) {
  const me = await requireSection("users");
  const userId = String(formData.get("user_id") ?? "");
  if (userId === me.user.id) return;
  const db = createServiceClient();
  if (!db) return;
  const { data: target } = await db.from("admins").select("role").eq("user_id", userId).maybeSingle();
  if (!target || !mayEdit(me, target as Member)) return;
  if (target.role === "owner" && (await activeOwners(db)) <= 1) return;
  // Tasks, clients and notes keep existing; their assignee/author becomes empty.
  await db.auth.admin.deleteUser(userId);
  revalidatePath("/dashboard/team");
  redirect("/dashboard/team");
}

/** Any member: update their own name and password. */
export async function updateMyAccount(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireSection();
  const { t } = await getDashT();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (fullName.length < 2) return { ok: false, message: t("اكتب الاسم.", "Enter a name."), errors: { full_name: t("اكتب الاسم.", "Enter a name.") } };
  if (password && password.length < 8)
    return { ok: false, message: t("كلمة المرور 8 أحرف على الأقل.", "Password must be at least 8 characters."), errors: { password: t("8 أحرف على الأقل.", "At least 8 characters.") } };

  const db = createServiceClient();
  if (db) await db.from("admins").update({ full_name: fullName }).eq("user_id", me.user.id);
  if (password) {
    const { error } = await me.supabase.auth.updateUser({ password });
    if (error) return { ok: false, message: error.message };
  }
  revalidatePath("/dashboard", "layout");
  return { ok: true, message: password ? t("تم حفظ الاسم وكلمة المرور.", "Name and password saved.") : t("تم الحفظ.", "Saved.") };
}
