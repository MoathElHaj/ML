import "server-only";
import type { getAdmin } from "@/lib/supabase/server";

type Admin = NonNullable<Awaited<ReturnType<typeof getAdmin>>>;

const SITE_IMAGES = [
  { url: "/images/hero.jpg", label: "الصورة الرئيسية" },
  { url: "/images/service-marketing.jpg", label: "التسويق الرقمي" },
  { url: "/images/service-design.jpg", label: "تصميم الجرافيك" },
  { url: "/images/service-web.jpg", label: "تطوير المواقع" },
  { url: "/images/service-mobile.jpg", label: "تطبيقات الموبايل" },
  { url: "/images/about.jpg", label: "من نحن" },
  { url: "/images/cta.jpg", label: "خلفية بنفسجية" },
  { url: "/images/blog-default.jpg", label: "خلفية تقنية" },
];

/** Images the admin can pick for an ad: the site's brand images plus uploaded portfolio covers. */
export async function adImages(admin: Admin) {
  const { data } = await admin.supabase.from("projects").select("title, cover_url").not("cover_url", "is", null).limit(12);
  const covers = (data ?? []).map((p) => ({ url: p.cover_url as string, label: p.title as string }));
  return [...SITE_IMAGES, ...covers];
}
