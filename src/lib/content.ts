import type { Lang } from "./i18n";
import type { Service } from "./types";

/**
 * Bariq's four core services. Mirrors supabase/seed.sql and is shown only while the
 * database is not connected, so the site never renders an empty services section.
 */
export const defaultServices: Service[] = [
  {
    id: "default-digital-marketing",
    slug: "digital-marketing",
    title: "التسويق الرقمي",
    title_en: "Digital Marketing",
    summary: "حملات مدروسة على منصات التواصل ومحركات البحث تحوّل المتابعين إلى عملاء.",
    summary_en: "Well-planned campaigns on social media and search engines that turn followers into customers.",
    description:
      "نبني لعلامتك استراتيجية تسويق رقمي متكاملة تبدأ بفهم جمهورك ومنافسيك، ثم ندير حساباتك وحملاتك الإعلانية ونقيس النتائج باستمرار حتى يتحول كل ريال تنفقه إلى نمو حقيقي.",
    description_en:
      "We build a complete digital marketing strategy for your brand, starting with your audience and competitors. Then we run your accounts and ad campaigns and measure results continuously, so every rial you spend turns into real growth.",
    icon: "megaphone",
    image_url: "/images/service-marketing.jpg",
    features: [
      "إدارة حسابات التواصل الاجتماعي",
      "الإعلانات الممولة على Meta وGoogle وTikTok وSnapchat",
      "تحسين الظهور في محركات البحث SEO",
      "صناعة المحتوى وتقارير أداء شهرية",
    ],
    features_en: [
      "Social media account management",
      "Paid ads on Meta, Google, TikTok and Snapchat",
      "Search engine optimization (SEO)",
      "Content creation and monthly performance reports",
    ],
    sort_order: 1,
    is_published: true,
  },
  {
    id: "default-graphic-design",
    slug: "graphic-design",
    title: "تصميم الجرافيك",
    title_en: "Graphic Design",
    summary: "هويات بصرية وتصاميم تلفت الانتباه وتبقى في الذاكرة.",
    summary_en: "Brand identities and designs that catch the eye and stay memorable.",
    description:
      "نصمم هوية بصرية تعبّر عن شخصيتك من الشعار حتى أصغر تفصيلة، ونحوّل رسائلك إلى تصاميم واضحة وجذابة لكل منصة: من منشورات التواصل إلى المطبوعات والعروض التقديمية.",
    description_en:
      "We design a visual identity that expresses who you are, from the logo down to the smallest detail, and turn your messages into clear, attractive designs for every channel: from social posts to print and presentations.",
    icon: "palette",
    image_url: "/images/service-design.jpg",
    features: [
      "تصميم الشعارات والهويات البصرية",
      "تصاميم منصات التواصل الاجتماعي",
      "المطبوعات والعروض التقديمية",
      "الموشن جرافيك والفيديو القصير",
    ],
    features_en: ["Logo and brand identity design", "Social media designs", "Print and presentations", "Motion graphics and short videos"],
    sort_order: 2,
    is_published: true,
  },
  {
    id: "default-web-development",
    slug: "web-development",
    title: "تطوير المواقع",
    title_en: "Web Development",
    summary: "مواقع ومتاجر سريعة وآمنة، مصممة لتحويل الزوار إلى عملاء.",
    summary_en: "Fast, secure websites and online stores designed to turn visitors into customers.",
    description:
      "نطوّر مواقع تعريفية ومتاجر إلكترونية وأنظمة مخصصة بأحدث التقنيات، بتصميم متجاوب مع كل الشاشات وسرعة تحميل عالية وتجربة استخدام مدروسة، مع لوحة تحكم تديرون منها المحتوى بسهولة.",
    description_en:
      "We build company websites, online stores and custom systems with modern technology: responsive on every screen, fast to load, thoughtfully designed, and with a dashboard that makes managing your content easy.",
    icon: "monitor-smartphone",
    image_url: "/images/service-web.jpg",
    features: [
      "مواقع الشركات والمواقع التعريفية",
      "المتاجر الإلكترونية وبوابات الدفع",
      "لوحات التحكم والأنظمة المخصصة",
      "تحسين السرعة وتجربة المستخدم",
    ],
    features_en: ["Company and brochure websites", "Online stores and payment gateways", "Dashboards and custom systems", "Speed and user-experience optimization"],
    sort_order: 3,
    is_published: true,
  },
  {
    id: "default-mobile-development",
    slug: "mobile-development",
    title: "تطوير تطبيقات الموبايل",
    title_en: "Mobile App Development",
    summary: "تطبيقات iOS وAndroid بتجربة سلسة تضع خدماتك في جيب عملائك.",
    summary_en: "iOS and Android apps with a smooth experience that puts your services in your customers' pockets.",
    description:
      "نصمم ونطوّر تطبيقات جوال أصلية ومتعددة المنصات، من دراسة الفكرة وتصميم الواجهات حتى النشر على المتاجر والدعم المستمر، مع ربط كامل بأنظمتك وبوابات الدفع.",
    description_en:
      "We design and build native and cross-platform mobile apps, from shaping the idea and designing the interface to publishing on the app stores and ongoing support, fully connected to your systems and payment gateways.",
    icon: "smartphone",
    image_url: "/images/service-mobile.jpg",
    features: [
      "تطبيقات iOS وAndroid",
      "تصميم واجهات وتجربة المستخدم UI/UX",
      "الربط مع الأنظمة وبوابات الدفع",
      "النشر على المتاجر والدعم الفني",
    ],
    features_en: ["iOS and Android apps", "UI/UX design", "System and payment integrations", "App store publishing and support"],
    sort_order: 4,
    is_published: true,
  },
];

type Text = { ar: string; en: string };
const t = (x: Text, lang: Lang) => x[lang];

const processStepsData: { title: Text; body: Text }[] = [
  {
    title: { ar: "نستمع ونفهم", en: "We listen" },
    body: { ar: "جلسة استشارية مجانية نتعرف فيها على أهدافك وجمهورك وتحدياتك.", en: "A free consultation to understand your goals, audience and challenges." },
  },
  {
    title: { ar: "نخطط بوضوح", en: "We plan clearly" },
    body: { ar: "خطة عمل وجدول زمني وتكلفة واضحة قبل أن نبدأ، بلا مفاجآت.", en: "A clear plan, timeline and cost before we start — no surprises." },
  },
  {
    title: { ar: "نصمم وننفّذ", en: "We design & build" },
    body: { ar: "فريق متخصص يحوّل الخطة إلى تصاميم ومنتجات وحملات بجودة عالية.", en: "A specialist team turns the plan into high-quality designs, products and campaigns." },
  },
  {
    title: { ar: "نطلق ونطوّر", en: "We launch & improve" },
    body: { ar: "نطلق المشروع ونتابع الأداء بالأرقام لنحسّن النتائج باستمرار.", en: "We launch, track performance with real numbers and keep improving results." },
  },
];

const valuesData: { title: Text; body: Text }[] = [
  { title: { ar: "الإبداع بهدف", en: "Creativity with purpose" }, body: { ar: "كل فكرة نقدمها مرتبطة بهدف تجاري يمكن قياسه.", en: "Every idea we bring is tied to a measurable business goal." } },
  { title: { ar: "الشفافية", en: "Transparency" }, body: { ar: "تقارير واضحة وتواصل مستمر في كل مرحلة من المشروع.", en: "Clear reports and constant communication at every stage." } },
  { title: { ar: "الجودة أولاً", en: "Quality first" }, body: { ar: "تفاصيل مدروسة في التصميم والكود والمحتوى.", en: "Careful attention to detail in design, code and content." } },
  { title: { ar: "شراكة طويلة", en: "Long-term partnership" }, body: { ar: "نبقى معك بعد الإطلاق بالدعم والتطوير والتحسين.", en: "We stay with you after launch with support, updates and improvements." } },
];

export const getProcessSteps = (lang: Lang) => processStepsData.map((s) => ({ title: t(s.title, lang), body: t(s.body, lang) }));
export const getValues = (lang: Lang) => valuesData.map((v) => ({ title: t(v.title, lang), body: t(v.body, lang) }));

/** Monthly marketing packages, priced in Omani rials. */
const packagesData = [
  {
    id: "starter",
    name: { ar: "باقة البداية", en: "Starter Package" },
    price: 250,
    tagline: { ar: "مثالية للمشاريع الجديدة التي تريد حضوراً رقمياً احترافياً", en: "Ideal for new businesses that want a professional online presence" },
    features: [
      { ar: "إعداد استراتيجية تسويقية", en: "Marketing strategy" },
      { ar: "إعداد خطة تسويق", en: "Marketing plan" },
      { ar: "إدارة منصات التواصل (ميتا + تيك توك + سناب شات + تويتر)", en: "Social media management (Meta + TikTok + Snapchat + X)" },
      { ar: "نشر 10 منشورات شهرياً", en: "10 posts per month" },
      { ar: "تصميم 3 فيديوهات ريلز", en: "3 Reels videos" },
      { ar: "خطة نمو للحساب", en: "Account growth plan" },
    ],
    cta: { ar: "اختر باقة البداية", en: "Choose Starter" },
    featured: false,
  },
  {
    id: "pro",
    name: { ar: "الباقة الاحترافية", en: "Professional Package" },
    price: 350,
    tagline: { ar: "الأكثر طلباً للشركات المتوسطة", en: "The most popular choice for mid-sized companies" },
    features: [
      { ar: "إعداد استراتيجية تسويقية", en: "Marketing strategy" },
      { ar: "إعداد خطة تسويق", en: "Marketing plan" },
      { ar: "تصميم 5 فيديوهات ريلز", en: "5 Reels videos" },
      { ar: "نشر 15 منشوراً شهرياً", en: "15 posts per month" },
      { ar: "خطة نمو متقدمة", en: "Advanced growth plan" },
      { ar: "تقارير شهرية", en: "Monthly reports" },
    ],
    cta: { ar: "اختر الباقة الاحترافية", en: "Choose Professional" },
    featured: true,
  },
  {
    id: "advanced",
    name: { ar: "الباقة المتقدمة", en: "Advanced Package" },
    price: 450,
    tagline: { ar: "للأعمال التي تريد نتائج قوية ومبيعات أعلى", en: "For businesses that want strong results and higher sales" },
    features: [
      { ar: "إعداد استراتيجية تسويقية", en: "Marketing strategy" },
      { ar: "إعداد خطة تسويق", en: "Marketing plan" },
      { ar: "تصميم 7 فيديوهات ريلز", en: "7 Reels videos" },
      { ar: "نشر 20 منشوراً شهرياً", en: "20 posts per month" },
      { ar: "خطة نمو متقدمة", en: "Advanced growth plan" },
      { ar: "تقارير شهرية", en: "Monthly reports" },
    ],
    cta: { ar: "اختر الباقة المتقدمة", en: "Choose Advanced" },
    featured: false,
  },
];

export const getMarketingPackages = (lang: Lang) =>
  packagesData.map((p) => ({
    id: p.id,
    name: t(p.name, lang),
    price: p.price,
    tagline: t(p.tagline, lang),
    features: p.features.map((f) => t(f, lang)),
    cta: t(p.cta, lang),
    featured: p.featured,
  }));
