import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Clock, Mail, MapPin, Phone } from "lucide-react";
import { site, whatsappLink } from "@/lib/site";
import { PageHero } from "@/components/site/parts";
import { ContactForm } from "@/components/forms/ContactForm";
import { WhatsAppIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "تواصل معنا",
  description: "تواصل مع وكالة بريق الرقمية عبر واتساب أو البريد أو نموذج التواصل، أو احجز استشارة مجانية.",
};

export default function ContactPage() {
  const wa = whatsappLink("مرحباً بريق، أود التواصل معكم");
  const items = [
    wa && { Icon: WhatsAppIcon, title: "واتساب", value: "راسلنا مباشرة", href: wa, external: true, accent: "bg-whatsapp-dark text-white" },
    site.phone && { Icon: Phone, title: "الهاتف", value: site.phone, href: `tel:${site.phone.replace(/\s/g, "")}`, ltr: true },
    site.email && { Icon: Mail, title: "البريد الإلكتروني", value: site.email, href: `mailto:${site.email}` },
    site.address && { Icon: MapPin, title: "العنوان", value: site.address },
  ].filter(Boolean) as {
    Icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string;
    href?: string;
    external?: boolean;
    ltr?: boolean;
    accent?: string;
  }[];

  return (
    <>
      <PageHero eyebrow="تواصل معنا" title="يسعدنا سماع فكرتك" intro="اختر الطريقة الأنسب لك، وسنرد عليك خلال يوم عمل واحد." />
      <section className="container-x grid gap-10 py-14 sm:py-16 lg:grid-cols-[1fr_1.5fr]">
        <div className="space-y-4">
          {items.map(({ Icon, title, value, href, external, ltr, accent }) => {
            const body = (
              <>
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${accent ?? "bg-lilac-50 text-violet"}`}>
                  <Icon className="size-6" />
                </span>
                <div>
                  <p className="font-semibold text-night">{title}</p>
                  <p className="text-[15px] text-muted" dir={ltr ? "ltr" : undefined}>
                    {value}
                  </p>
                </div>
              </>
            );
            return href ? (
              <a
                key={title}
                href={href}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="card flex items-center gap-4 p-5 transition-colors hover:border-violet"
              >
                {body}
              </a>
            ) : (
              <div key={title} className="card flex items-center gap-4 p-5">
                {body}
              </div>
            );
          })}
          <div className="card flex items-center gap-4 p-5">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-lilac-50 text-violet">
              <Clock className="size-6" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-night">ساعات العمل</p>
              <p className="text-[15px] text-muted">الأحد – الخميس، 10 صباحاً – 7 مساءً</p>
            </div>
          </div>
          <Link href="/booking" className="flex items-center gap-4 rounded-[24px] bg-violet p-5 text-white transition-colors hover:bg-deep">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <CalendarCheck className="size-6" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">تفضّل الحديث مباشرة؟</p>
              <p className="text-[15px] text-white/80">احجز استشارة مجانية 30 دقيقة</p>
            </div>
          </Link>
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold text-night">أرسل لنا رسالة</h2>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
