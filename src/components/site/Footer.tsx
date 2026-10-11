import Image from "next/image";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { nav, site, whatsappLink } from "@/lib/site";
import { defaultServices } from "@/lib/content";
import { getDict, href, pick, type Lang } from "@/lib/i18n";
import { InstagramIcon, LinkedInIcon, TikTokIcon, WhatsAppIcon, XIcon } from "@/components/icons";

export function Footer({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const wa = whatsappLink(t.wa.general);
  const socials = [
    { href: site.socials.instagram, label: t.footer.social.instagram, Icon: InstagramIcon },
    { href: site.socials.x, label: t.footer.social.x, Icon: XIcon },
    { href: site.socials.linkedin, label: t.footer.social.linkedin, Icon: LinkedInIcon },
    { href: site.socials.tiktok, label: t.footer.social.tiktok, Icon: TikTokIcon },
    { href: wa ?? "", label: t.footer.social.whatsapp, Icon: WhatsAppIcon },
  ].filter((s) => s.href);

  return (
    <footer className="relative overflow-hidden border-t border-white/5 bg-night text-white">
      <div className="pointer-events-none absolute -top-40 end-[-10%] size-[480px] rounded-full bg-violet/30 blur-3xl" />
      <div className="container-x relative grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <Image src="/images/logo-white.png" alt="Bariq — بريق" width={1136} height={476} className="h-12 w-auto" />
          <p className="mt-5 max-w-xs text-[15px] leading-8 text-white/75">{t.meta.description}</p>
          {socials.length > 0 && (
            <ul className="mt-6 flex gap-2">
              {socials.map(({ href: link, label, Icon }) => (
                <li key={label}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex size-10 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white hover:text-night"
                  >
                    <Icon className="size-[18px]" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h2 className="text-base font-semibold">{t.footer.quickLinks}</h2>
          <ul className="mt-4 space-y-2.5 text-[15px] text-white/75">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={href(lang, item.href)} className="hover:text-lilac">
                  {t.nav[item.key]}
                </Link>
              </li>
            ))}
            <li>
              <Link href={href(lang, "/booking")} className="hover:text-lilac">
                {t.nav.bookShort}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold">{t.footer.services}</h2>
          <ul className="mt-4 space-y-2.5 text-[15px] text-white/75">
            {defaultServices.map((s) => (
              <li key={s.slug}>
                <Link href={href(lang, `/services/${s.slug}`)} className="hover:text-lilac">
                  {pick(lang, s.title, s.title_en)}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-base font-semibold">{t.footer.contact}</h2>
          <ul className="mt-4 space-y-3 text-[15px] text-white/75">
            {site.phone && (
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-lilac" aria-hidden />
                <a href={`tel:${site.phone.replace(/\s/g, "")}`} dir="ltr" className="hover:text-lilac">
                  {site.phone}
                </a>
              </li>
            )}
            {site.email && (
              <li className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-lilac" aria-hidden />
                <a href={`mailto:${site.email}`} className="hover:text-lilac">
                  {site.email}
                </a>
              </li>
            )}
            {site.address && (
              <li className="flex items-start gap-3">
                <MapPin className="mt-1.5 size-4 shrink-0 text-lilac" aria-hidden />
                <span>{site.address}</span>
              </li>
            )}
          </ul>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link href={href(lang, "/booking")} className="btn btn-light btn-sm">
              {t.nav.book}
            </Link>
            {wa && (
              <a href={wa} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp btn-sm">
                <WhatsAppIcon className="size-4" />
                {t.footer.whatsapp}
              </a>
            )}
          </div>
        </div>
      </div>
      <div className="relative border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-6 text-sm text-white/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {t.brand.full}. {t.footer.rights}
          </p>
          <p lang={lang === "ar" ? "en" : "ar"}>{t.brand.other}</p>
        </div>
      </div>
    </footer>
  );
}
