import type { Metadata } from "next";
import { CheckCircle2, Clock, Gift, ShieldCheck } from "lucide-react";
import { getServices } from "@/lib/data";
import { getBlockedDays, getBookingSettings } from "@/lib/settings";
import { getDict, langFrom } from "@/lib/i18n";
import { pageMeta } from "@/lib/seo";
import { PageHero } from "@/components/site/parts";
import { BookingForm } from "@/components/forms/BookingForm";
import { Reveal } from "@/components/motion/Reveal";

const perkIcons = [Gift, Clock, CheckCircle2, ShieldCheck];

export async function generateMetadata(props: PageProps<"/[lang]/booking">): Promise<Metadata> {
  const lang = await langFrom(props.params);
  const t = getDict(lang).booking;
  return pageMeta(lang, "/booking", t.metaTitle, t.metaDescription);
}

export default async function BookingPage(props: PageProps<"/[lang]/booking">) {
  const lang = await langFrom(props.params);
  const b = getDict(lang).booking;
  const { service } = await props.searchParams;
  const [services, booking, blocked] = await Promise.all([getServices(lang), getBookingSettings(), getBlockedDays()]);
  const defaultService = typeof service === "string" && services.some((s) => s.slug === service) ? service : undefined;

  return (
    <>
      <PageHero eyebrow={b.eyebrow} title={b.title} intro={b.intro} />
      <section className="container-x grid gap-10 py-14 sm:py-16 lg:grid-cols-[1fr_1.7fr]">
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <h2 className="text-2xl font-bold text-ink">{b.perksTitle}</h2>
          <Reveal as="ul" variant="stagger" className="mt-6 space-y-4">
            {b.perks.map((perk, i) => {
              const Icon = perkIcons[i];
              const title = typeof perk.title === "function" ? perk.title(booking.duration_minutes) : perk.title;
              return (
                <li key={title} className="flex gap-4">
                  <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-tint text-accent">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{title}</p>
                    <p className="text-[15px] text-muted">{perk.body}</p>
                  </div>
                </li>
              );
            })}
          </Reveal>
        </aside>
        <BookingForm
          lang={lang}
          services={services.map((s) => ({ slug: s.slug, title: s.title }))}
          defaultService={defaultService}
          rules={{
            working_days: booking.working_days,
            slots: booking.slots,
            days_ahead: booking.days_ahead,
            duration_minutes: booking.duration_minutes,
            time_zone: booking.time_zone,
            blocked,
          }}
        />
      </section>
    </>
  );
}
