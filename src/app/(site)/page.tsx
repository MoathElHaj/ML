import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CalendarCheck, Check, Mail, MessageCircle, Sparkles, TrendingUp } from "lucide-react";
import { getPosts, getProjects, getServices } from "@/lib/data";
import { processSteps, values } from "@/lib/content";
import { site, whatsappLink } from "@/lib/site";
import { CtaBand, PostCard, ProjectCard, SectionHeading, ServiceCard } from "@/components/site/parts";
import { ContactForm } from "@/components/forms/ContactForm";
import { WhatsAppIcon } from "@/components/icons";

export const revalidate = 60;

const skills = [
  "إدارة السوشيال ميديا",
  "الإعلانات الممولة",
  "تحسين محركات البحث",
  "الهوية البصرية",
  "تصميم UI/UX",
  "المتاجر الإلكترونية",
  "تطبيقات iOS وAndroid",
  "صناعة المحتوى",
  "الموشن جرافيك",
  "لوحات التحكم",
];

export default async function HomePage() {
  const [services, projects, posts] = await Promise.all([getServices(), getProjects({ limit: 4 }), getPosts(3)]);
  const wa = whatsappLink("مرحباً بريق، أود الاستفسار عن خدماتكم");

  return (
    <>
      {/* Hero */}
      <section className="hero-glow relative -mt-[72px] overflow-hidden pt-[72px]">
        <div className="grid-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_70%_30%,black,transparent)]" />
        <div className="container-x relative grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
          <div>
            <span className="eyebrow">
              <Sparkles className="size-4" aria-hidden />
              وكالة تسويق رقمي وتقنية متكاملة
            </span>
            <h1 className="mt-6 text-[40px] font-bold leading-[1.3] text-night sm:text-[52px] lg:text-[58px]">
              نصنع حضورك الرقمي
              <br />
              <span className="text-gradient">بلمعة لا تُنسى</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-9 text-muted">
              من الاستراتيجية والتسويق إلى التصميم والمواقع وتطبيقات الجوال: فريق واحد يبني لعلامتك تجربة رقمية متكاملة تجذب
              عملاءك وتنمّي مبيعاتك.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/booking" className="btn btn-primary">
                <CalendarCheck className="size-5" aria-hidden />
                احجز استشارة مجانية
              </Link>
              <Link href="/services" className="btn btn-outline">
                استكشف خدماتنا
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
            <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[15px] text-night">
              {["استشارة أولى مجانية", "خطة وتكلفة واضحة", "دعم بعد الإطلاق"].map((t) => (
                <li key={t} className="flex items-center gap-2">
                  <span className="flex size-5 items-center justify-center rounded-full bg-violet text-white">
                    <Check className="size-3.5" aria-hidden strokeWidth={3} />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="relative mx-auto w-full max-w-[560px] lg:max-w-none">
            <div className="absolute -inset-4 -z-10 rounded-[40px] bg-gradient-to-br from-lilac/60 to-violet/10 blur-2xl" />
            <div className="relative aspect-[16/11] overflow-hidden rounded-[32px] border-[6px] border-white bg-night shadow-[var(--shadow-lift)]">
              <Image
                src="/images/hero.jpg"
                alt="منظومة خدمات بريق الرقمية: تسويق وتصميم وتطوير"
                fill
                priority
                sizes="(min-width: 1024px) 560px, 100vw"
                className="object-cover"
              />
            </div>
            <div className="animate-float absolute -bottom-6 start-2 flex items-center gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur sm:-start-6">
              <span className="flex size-11 items-center justify-center rounded-xl bg-violet text-white">
                <TrendingUp className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-night">نمو قابل للقياس</p>
                <p className="text-xs text-muted">تقارير أداء شهرية واضحة</p>
              </div>
            </div>
            <div
              className="animate-float absolute -top-5 end-2 hidden items-center gap-3 rounded-2xl border border-line bg-white/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur sm:flex sm:-end-4"
              style={{ animationDelay: "1.5s" }}
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-lilac-50 text-violet">
                <MessageCircle className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-night">{services.length} خدمات متكاملة</p>
                <p className="text-xs text-muted">تحت سقف واحد</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Skills marquee */}
      <section aria-label="مجالات خبرتنا" className="overflow-hidden bg-night py-5 text-white">
        <div className="animate-marquee flex w-max gap-3">
          {[...skills, ...skills].map((s, i) => (
            <span
              key={i}
              aria-hidden={i >= skills.length}
              className="flex items-center gap-3 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-5 py-2 text-[15px] font-medium"
            >
              <Sparkles className="size-4 text-lilac" aria-hidden />
              {s}
            </span>
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="container-x py-20 sm:py-24" aria-labelledby="services-title">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="eyebrow">خدماتنا</span>
            <h2 id="services-title" className="mt-4 text-[28px] font-bold text-night sm:text-4xl">
              كل ما تحتاجه علامتك <span className="text-gradient">لتلمع رقمياً</span>
            </h2>
            <p className="mt-4 text-[17px] leading-8 text-muted">
              أربع خدمات متكاملة يقدمها فريق واحد، لتحصل على نتائج متناسقة دون التنقل بين أكثر من جهة.
            </p>
          </div>
          <Link href="/services" className="btn btn-outline shrink-0">
            كل الخدمات
            <ArrowLeft className="size-4" aria-hidden />
          </Link>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s, i) => (
            <ServiceCard key={s.id} service={s} index={i} />
          ))}
        </div>
      </section>

      {/* About */}
      <section className="bg-lilac-50/70 py-20 sm:py-24" aria-labelledby="about-title">
        <div className="container-x grid items-center gap-12 lg:grid-cols-2">
          <div className="relative">
            <div className="relative aspect-[4/3] overflow-hidden rounded-[32px] bg-night">
              <Image src="/images/about.jpg" alt="" fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            </div>
            <div className="absolute -bottom-6 end-6 rounded-2xl bg-violet px-6 py-4 text-white shadow-[var(--shadow-lift)]">
              <p className="text-sm text-white/80">شعارنا</p>
              <p className="text-lg font-bold">نلمّع حضورك، وننمّي أعمالك</p>
            </div>
          </div>
          <div>
            <span className="eyebrow">من نحن</span>
            <h2 id="about-title" className="mt-4 text-[28px] font-bold text-night sm:text-4xl">
              شريكك الرقمي من <span className="text-gradient">الفكرة حتى النمو</span>
            </h2>
            <p className="mt-5 text-[17px] leading-9 text-muted">
              بريق وكالة رقمية تجمع المسوّق والمصمم والمطوّر في فريق واحد. نؤمن أن الحضور الرقمي الناجح لا يُبنى بالحدس، بل
              بخطة واضحة وتنفيذ متقن وقياس مستمر، ولذلك نعمل معك كشريك لا كمورد.
            </p>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2">
              {values.map((v) => (
                <li key={v.title} className="flex gap-3">
                  <span className="mt-1 flex size-6 shrink-0 items-center justify-center rounded-full bg-violet text-white">
                    <Check className="size-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-night">{v.title}</p>
                    <p className="text-[15px] leading-7 text-muted">{v.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link href="/about" className="btn btn-dark mt-9">
              تعرّف علينا أكثر
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="container-x py-20 sm:py-24" aria-labelledby="process-title">
        <SectionHeading eyebrow="كيف نعمل" title="أربع خطوات" highlight="من الفكرة إلى النتيجة" />
        <ol className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {processSteps.map((step, i) => (
            <li key={step.title} className="card relative p-7">
              <span className="text-5xl font-bold text-lilac" dir="ltr">
                0{i + 1}
              </span>
              <h3 className="mt-4 text-xl font-bold text-night">{step.title}</h3>
              <p className="mt-2 text-[15px] leading-7 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Portfolio */}
      {projects.length > 0 && (
        <section className="bg-lilac-50/70 py-20 sm:py-24" aria-labelledby="work-title">
          <div className="container-x">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-2xl">
                <span className="eyebrow">أعمالنا</span>
                <h2 id="work-title" className="mt-4 text-[28px] font-bold text-night sm:text-4xl">
                  مشاريع <span className="text-gradient">نفخر بها</span>
                </h2>
              </div>
              <Link href="/portfolio" className="btn btn-outline shrink-0">
                كل الأعمال
                <ArrowLeft className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="mt-12 grid gap-x-8 gap-y-12 md:grid-cols-2">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} large />
              ))}
            </div>
          </div>
        </section>
      )}

      <CtaBand />

      {/* Blog */}
      {posts.length > 0 && (
        <section className="container-x pb-20 sm:pb-24" aria-labelledby="blog-title">
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <span className="eyebrow">المدونة</span>
              <h2 id="blog-title" className="mt-4 text-[28px] font-bold text-night sm:text-4xl">
                أفكار ونصائح <span className="text-gradient">لنمو أعمالك</span>
              </h2>
            </div>
            <Link href="/blog" className="btn btn-outline shrink-0">
              كل المقالات
              <ArrowLeft className="size-4" aria-hidden />
            </Link>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* Contact */}
      <section className="bg-lilac-50/70 py-20 sm:py-24" aria-labelledby="contact-title">
        <div className="container-x grid gap-10 lg:grid-cols-[1fr_1.3fr]">
          <div>
            <span className="eyebrow">تواصل معنا</span>
            <h2 id="contact-title" className="mt-4 text-[28px] font-bold text-night sm:text-4xl">
              لنبدأ <span className="text-gradient">مشروعك القادم</span>
            </h2>
            <p className="mt-4 text-[17px] leading-8 text-muted">
              أرسل لنا فكرتك وسنعود إليك خلال يوم عمل، أو راسلنا مباشرة على واتساب لرد أسرع.
            </p>
            <div className="mt-8 space-y-3">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="card flex items-center gap-4 p-4 transition-colors hover:border-whatsapp-dark">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-whatsapp-dark text-white">
                    <WhatsAppIcon className="size-6" />
                  </span>
                  <div>
                    <p className="font-semibold text-night">واتساب</p>
                    <p className="text-sm text-muted">رد سريع خلال ساعات العمل</p>
                  </div>
                </a>
              )}
              {site.email && (
                <a href={`mailto:${site.email}`} className="card flex items-center gap-4 p-4 transition-colors hover:border-violet">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-lilac-50 text-violet">
                    <Mail className="size-6" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-night">البريد الإلكتروني</p>
                    <p className="text-sm text-muted">{site.email}</p>
                  </div>
                </a>
              )}
              <Link href="/booking" className="card flex items-center gap-4 p-4 transition-colors hover:border-violet">
                <span className="flex size-12 items-center justify-center rounded-xl bg-violet text-white">
                  <CalendarCheck className="size-6" aria-hidden />
                </span>
                <div>
                  <p className="font-semibold text-night">استشارة مجانية</p>
                  <p className="text-sm text-muted">اختر الموعد المناسب لك</p>
                </div>
              </Link>
            </div>
          </div>
          <div className="card p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
