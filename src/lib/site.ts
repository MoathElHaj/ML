export const site = {
  name: "بريق",
  nameEn: "Bariq",
  fullName: "وكالة بريق الرقمية",
  fullNameEn: "Bariq Digital Agency",
  tagline: "نصنع حضورك الرقمي بلمعة لا تُنسى",
  description:
    "وكالة بريق الرقمية: تسويق رقمي، تصميم جرافيك، تطوير مواقع وتطبيقات موبايل. نحوّل أفكارك إلى تجارب رقمية تنمّي أعمالك.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  whatsapp: (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "").replace(/\D/g, ""),
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "",
  address: process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "",
  socials: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "",
    x: process.env.NEXT_PUBLIC_X_URL || "",
    linkedin: process.env.NEXT_PUBLIC_LINKEDIN_URL || "",
    tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL || "",
  },
} as const;

export const nav = [
  { href: "/", label: "الرئيسية" },
  { href: "/services", label: "خدماتنا" },
  { href: "/portfolio", label: "أعمالنا" },
  { href: "/pricing", label: "الأسعار" },
  { href: "/about", label: "من نحن" },
  { href: "/blog", label: "المدونة" },
  { href: "/contact", label: "تواصل معنا" },
] as const;

/** Consultation booking rules. Days use JS numbering: 0 = Sunday … 6 = Saturday. */
export const booking = {
  workingDays: [0, 1, 2, 3, 4],
  slots: ["10:00", "11:00", "12:00", "13:00", "14:00", "16:00", "17:00", "18:00"],
  daysAhead: 21,
  durationMinutes: 30,
  /** Business time zone: decides what "today" is for bookings, on the server and in the browser alike. */
  timeZone: process.env.NEXT_PUBLIC_BUSINESS_TIMEZONE || "Asia/Muscat",
};

export const channels = [
  { value: "online", label: "اجتماع أونلاين" },
  { value: "phone", label: "مكالمة هاتفية" },
  { value: "office", label: "زيارة لمقرنا" },
] as const;

export function whatsappLink(text?: string) {
  if (!site.whatsapp) return null;
  const q = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${site.whatsapp}${q}`;
}
