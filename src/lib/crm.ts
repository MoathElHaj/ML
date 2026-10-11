import type { ContactActivity, ContactSource, ContactStage } from "@/lib/types";

export const STAGES: ContactStage[] = ["new", "contacted", "qualified", "proposal", "won", "lost"];

export const STAGE_META: Record<ContactStage, { ar: string; en: string; tone: string; dot: string }> = {
  new: { ar: "جديد", en: "New", tone: "border-violet/25 bg-violet/10 text-violet", dot: "bg-violet" },
  contacted: { ar: "تم التواصل", en: "Contacted", tone: "border-sky-200 bg-sky-50 text-sky-900", dot: "bg-sky-500" },
  qualified: { ar: "مهتم", en: "Qualified", tone: "border-indigo-200 bg-indigo-50 text-indigo-900", dot: "bg-indigo-500" },
  proposal: { ar: "عرض سعر", en: "Proposal", tone: "border-amber-200 bg-amber-50 text-amber-900", dot: "bg-amber-500" },
  won: { ar: "تم التعاقد", en: "Won", tone: "border-emerald-200 bg-emerald-50 text-emerald-900", dot: "bg-emerald-500" },
  lost: { ar: "لم يتم", en: "Lost", tone: "border-zinc-200 bg-zinc-100 text-zinc-700", dot: "bg-zinc-400" },
};

export const SOURCES: ContactSource[] = ["whatsapp", "meta_ads", "meta_lead_form", "google_ads", "instagram", "booking", "contact_form", "website", "referral", "manual", "other"];

export const SOURCE_META: Record<ContactSource, { ar: string; en: string; tone: string }> = {
  whatsapp: { ar: "واتساب", en: "WhatsApp", tone: "bg-emerald-50 text-emerald-900" },
  meta_ads: { ar: "إعلانات Meta", en: "Meta ads", tone: "bg-blue-50 text-blue-900" },
  meta_lead_form: { ar: "نموذج Meta", en: "Meta lead form", tone: "bg-blue-50 text-blue-900" },
  google_ads: { ar: "إعلانات Google", en: "Google Ads", tone: "bg-amber-50 text-amber-900" },
  instagram: { ar: "إنستغرام", en: "Instagram", tone: "bg-pink-50 text-pink-900" },
  booking: { ar: "حجز استشارة", en: "Booking", tone: "bg-lilac-50 text-violet" },
  contact_form: { ar: "تواصل معنا", en: "Contact form", tone: "bg-lilac-50 text-violet" },
  website: { ar: "الموقع", en: "Website", tone: "bg-lilac-50 text-violet" },
  referral: { ar: "توصية", en: "Referral", tone: "bg-teal-50 text-teal-900" },
  manual: { ar: "يدوي", en: "Manual", tone: "bg-zinc-100 text-zinc-700" },
  other: { ar: "أخرى", en: "Other", tone: "bg-zinc-100 text-zinc-700" },
};

export const ACTIVITY_META: Record<ContactActivity["kind"], { ar: string; en: string }> = {
  note: { ar: "ملاحظة", en: "Note" },
  call: { ar: "مكالمة", en: "Call" },
  whatsapp_in: { ar: "رسالة واتساب واردة", en: "WhatsApp received" },
  whatsapp_out: { ar: "رسالة واتساب", en: "WhatsApp sent" },
  email: { ar: "بريد", en: "Email" },
  meeting: { ar: "اجتماع", en: "Meeting" },
  booking: { ar: "حجز استشارة", en: "Booking" },
  message: { ar: "رسالة من الموقع", en: "Website message" },
  lead: { ar: "نموذج إعلان", en: "Lead form" },
  stage: { ar: "تغيير المرحلة", en: "Stage change" },
  task: { ar: "مهمة", en: "Task" },
};

/** wa.me link with digits only. */
export function waLink(phone: string | null, text?: string) {
  const d = phone?.replace(/\D/g, "").replace(/^00/, "");
  if (!d) return null;
  return `https://wa.me/${d.length === 8 ? `968${d}` : d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
