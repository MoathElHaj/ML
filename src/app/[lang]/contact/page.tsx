import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, Clock, Mail, MapPin, Phone } from "lucide-react";
import { site, whatsappLink } from "@/lib/site";
import { getDict, href, langFrom } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/site/parts";
import { ContactForm } from "@/components/forms/ContactForm";
import { WhatsAppIcon } from "@/components/icons";
import { Reveal } from "@/components/motion/Reveal";

export async function generateMetadata(props: PageProps<"/[lang]/contact">): Promise<Metadata> {
  const lang = await langFrom(props.params);
  const t = getDict(lang).contact;
  return pageMeta(lang, "/contact", t.metaTitle, t.metaDescription);
}

export default async function ContactPage(props: PageProps<"/[lang]/contact">) {
  const lang = await langFrom(props.params);
  const t = getDict(lang);
  const c = t.contact;
  const wa = whatsappLink(t.wa.contact);
  const items = [
    wa && { Icon: WhatsAppIcon, title: c.whatsapp, value: c.whatsappValue, link: wa, external: true, accent: "bg-whatsapp-dark text-white" },
    site.phone && { Icon: Phone, title: c.phone, value: site.phone, link: `tel:${site.phone.replace(/\s/g, "")}`, ltr: true },
    site.email && { Icon: Mail, title: c.email, value: site.email, link: `mailto:${site.email}` },
    site.address && { Icon: MapPin, title: c.address, value: site.address },
  ].filter(Boolean) as {
    Icon: React.ComponentType<{ className?: string }>;
    title: string;
    value: string;
    link?: string;
    external?: boolean;
    ltr?: boolean;
    accent?: string;
  }[];

  return (
    <>
      <PageHero eyebrow={c.eyebrow} title={c.title} intro={c.intro} />
      <section className="container-x grid gap-10 py-14 sm:py-16 lg:grid-cols-[1fr_1.5fr]">
        <Reveal variant="stagger" className="space-y-4">
          {items.map(({ Icon, title, value, link, external, ltr, accent }) => {
            const body = (
              <>
                <span className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${accent ?? "bg-tint text-accent"}`}>
                  <Icon className="size-6" />
                </span>
                <div>
                  <p className="font-semibold text-ink">{title}</p>
                  <p className="text-[15px] text-muted" dir={ltr ? "ltr" : undefined}>
                    {value}
                  </p>
                </div>
              </>
            );
            return link ? (
              <a
                key={title}
                href={link}
                target={external ? "_blank" : undefined}
                rel={external ? "noopener noreferrer" : undefined}
                className="card flex items-center gap-4 p-5 transition-colors hover:border-accent"
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
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-tint text-accent">
              <Clock className="size-6" aria-hidden />
            </span>
            <div>
              <p className="font-semibold text-ink">{c.hours}</p>
              <p className="text-[15px] text-muted">{c.hoursValue}</p>
            </div>
          </div>
          <Link href={href(lang, "/booking")} className="flex items-center gap-4 rounded-[24px] bg-violet p-5 text-white transition-colors hover:bg-deep">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <CalendarCheck className="size-6" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">{c.talk}</p>
              <p className="text-[15px] text-white/80">{c.talkSub}</p>
            </div>
          </Link>
        </Reveal>
        <div className="card p-6 sm:p-8">
          <h2 className="mb-6 text-2xl font-bold text-ink">{c.formTitle}</h2>
          <ContactForm lang={lang} />
        </div>
      </section>
    </>
  );
}
