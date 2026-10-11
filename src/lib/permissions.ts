/** Dashboard sections a team member can be given. Owners and admins have all of them plus user management. */
export const SECTIONS = ["bookings", "messages", "clients", "tasks", "content", "pricing", "marketing", "settings"] as const;
export type Section = (typeof SECTIONS)[number];
export type Role = "owner" | "admin" | "member";

export const SECTION_LABELS: Record<Section, { ar: string; en: string; hint: { ar: string; en: string } }> = {
  bookings: { ar: "الاستشارات والمواعيد", en: "Bookings", hint: { ar: "جدول الاستشارات، التأكيد وتغيير المواعيد", en: "Consultation schedule, confirmations, rescheduling" } },
  messages: { ar: "الرسائل", en: "Messages", hint: { ar: "رسائل نموذج تواصل معنا", en: "Contact form inbox" } },
  clients: { ar: "العملاء", en: "Clients", hint: { ar: "العملاء المحتملون من الموقع وواتساب والإعلانات", en: "Leads from the website, WhatsApp and ads" } },
  tasks: { ar: "كل المهام", en: "All tasks", hint: { ar: "إدارة مهام الفريق كله (كل عضو يرى مهامه دائماً)", en: "Manage the whole team's tasks (everyone always sees their own)" } },
  content: { ar: "المحتوى", en: "Content", hint: { ar: "الخدمات والأعمال والمدونة", en: "Services, portfolio and blog" } },
  pricing: { ar: "الأسعار والباقات", en: "Pricing", hint: { ar: "باقات صفحة الأسعار", en: "Pricing page packages" } },
  marketing: { ar: "الحملات الإعلانية", en: "Campaigns", hint: { ar: "Meta وحملات الإعلانات", en: "Meta and ad campaigns" } },
  settings: { ar: "الإعدادات", en: "Settings", hint: { ar: "المواعيد والبريد والتتبع والتكاملات", en: "Booking hours, email, tracking, integrations" } },
};

export const ROLE_LABELS: Record<Role, { ar: string; en: string }> = {
  owner: { ar: "المالك", en: "Owner" },
  admin: { ar: "مدير", en: "Admin" },
  member: { ar: "عضو فريق", en: "Team member" },
};

/** Quick presets for the member role. */
export const PRESETS: { key: string; ar: string; en: string; sections: Section[] }[] = [
  { key: "sales", ar: "مبيعات وخدمة عملاء", en: "Sales & support", sections: ["bookings", "messages", "clients"] },
  { key: "content", ar: "محرر محتوى", en: "Content editor", sections: ["content"] },
  { key: "marketing", ar: "تسويق", en: "Marketing", sections: ["marketing", "clients", "content"] },
];

export type Member = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  permissions: string[];
  is_active: boolean;
  dashboard_lang: "ar" | "en";
};

export function isManager(m: Pick<Member, "role"> | null | undefined) {
  return m?.role === "owner" || m?.role === "admin";
}

export function canAccess(m: Pick<Member, "role" | "permissions"> | null | undefined, section: Section) {
  return Boolean(m) && (isManager(m) || m!.permissions.includes(section));
}
