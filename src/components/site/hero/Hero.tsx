"use client";

import Link from "next/link";
import type { PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type Variants } from "motion/react";
import { CalendarCheck, Check, Layers, Sparkles, TrendingUp } from "lucide-react";
import { getDict, href, type Lang } from "@/lib/i18n";
import { ForwardArrow } from "@/components/icons";
import { HeroArt } from "@/components/art/HeroArt";

const ease = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
};

/** Slow-turning rings behind the illustration: the ring from Bariq's logo, kept quiet. */
function HeroRings() {
  return (
    <svg viewBox="0 0 600 600" className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[125%] max-w-none -translate-x-1/2 -translate-y-1/2" aria-hidden focusable="false">
      <circle cx="300" cy="300" r="230" fill="none" className="stroke-violet" strokeOpacity="0.07" strokeWidth="44" />
      <circle cx="300" cy="300" r="290" fill="none" className="stroke-violet" strokeOpacity="0.12" strokeWidth="1.5" strokeDasharray="3 10" />
      <g className="art-spin-slow">
        <circle cx="300" cy="300" r="290" fill="none" className="stroke-violet" strokeOpacity="0.45" strokeWidth="3" strokeDasharray="60 1760" strokeLinecap="round" />
        <circle cx="300" cy="10" r="6" className="fill-violet" opacity="0.5" />
      </g>
    </svg>
  );
}

function InfoCard({ icon, title, sub, className, delay, still }: { icon: React.ReactNode; title: string; sub: string; className: string; delay: number; still: boolean }) {
  return (
    <motion.div
      className={`absolute z-10 flex items-center gap-3 rounded-2xl border border-line bg-card/95 px-3.5 py-3 shadow-[var(--shadow-soft)] backdrop-blur ${className}`}
      initial={still ? false : { opacity: 0, y: 16, scale: 0.96 }}
      animate={still ? { opacity: 1 } : { opacity: 1, scale: 1, y: [0, -6, 0] }}
      transition={{
        opacity: { delay, duration: 0.5 },
        scale: { delay, duration: 0.5, ease },
        y: { delay: delay + 0.5, duration: 6, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      {icon}
      <div className="min-w-0">
        <p className="whitespace-nowrap text-sm font-bold leading-5 text-ink">{title}</p>
        <p className="whitespace-nowrap text-xs leading-5 text-muted">{sub}</p>
      </div>
    </motion.div>
  );
}

export function Hero({ lang, servicesCount }: { lang: Lang; servicesCount: number }) {
  const t = getDict(lang);
  const h = t.home;
  const reduce = useReducedMotion() ?? false;

  // Gentle tilt toward the mouse (desktop pointers only).
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-6, 6]), { stiffness: 120, damping: 20 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [5, -5]), { stiffness: 120, damping: 20 });
  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width - 0.5);
    py.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  return (
    <section className="hero-glow relative -mt-[72px] overflow-hidden pt-[72px]">
      <div className="grid-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(60%_55%_at_50%_35%,black,transparent)]" />

      <div className="container-x relative grid items-center gap-10 pb-14 pt-10 sm:gap-12 sm:pb-16 sm:pt-14 lg:min-h-[calc(100svh-72px)] lg:max-h-[860px] lg:grid-cols-[1fr_1.05fr] lg:gap-14 lg:py-16">
        {/* Text */}
        <motion.div
          variants={container}
          initial={reduce ? false : "hidden"}
          animate="show"
          className="mx-auto w-full max-w-xl text-center md:max-w-2xl lg:mx-0 lg:max-w-none lg:text-start"
        >
          <motion.span variants={item} className="eyebrow">
            <Sparkles className="size-4" aria-hidden />
            {h.eyebrow}
          </motion.span>

          <motion.h1 variants={item} className="mt-5 text-[34px] font-bold leading-[1.3] text-ink sm:mt-6 sm:text-[46px] lg:text-[54px] xl:text-[58px]">
            {h.title1}
            <span className="text-gradient text-shimmer mt-1 block pb-1">{h.title2}</span>
          </motion.h1>

          <motion.p variants={item} className="mx-auto mt-5 max-w-xl text-[16px] leading-8 text-muted sm:text-lg sm:leading-9 lg:mx-0">
            {h.intro}
          </motion.p>

          <motion.div variants={item} className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <Link href={href(lang, "/booking")} className="btn btn-primary w-full transition-transform hover:-translate-y-0.5 sm:w-auto">
              <CalendarCheck className="size-5" aria-hidden />
              {t.nav.book}
            </Link>
            <Link href={href(lang, "/services")} className="btn btn-outline group w-full sm:w-auto">
              {h.explore}
              <ForwardArrow className="size-4 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.ul variants={item} className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2.5 text-[14px] text-ink sm:text-[15px] lg:justify-start">
            {h.trust.map((label) => (
              <li key={label} className="flex items-center gap-2">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-violet/10 text-accent">
                  <Check className="size-3.5" aria-hidden strokeWidth={3} />
                </span>
                {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Visual */}
        <motion.div
          className="relative mx-auto w-full max-w-[560px] px-2 py-6 sm:px-6 sm:py-8 lg:max-w-none lg:px-8"
          style={{ perspective: 1200 }}
          initial={reduce ? false : { opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease, delay: 0.2 }}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          <HeroRings />
          <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="relative">
            <div
              role="img"
              aria-label={h.heroAlt}
              className="relative aspect-[600/412] overflow-hidden rounded-[24px] border-[5px] border-card bg-tint shadow-[var(--shadow-lift)] sm:rounded-[28px] sm:border-[6px]"
            >
              <HeroArt />
            </div>

            <InfoCard
              still={reduce}
              delay={0.6}
              className="-top-5 end-2 sm:-top-6 sm:-end-3"
              icon={
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-tint text-accent">
                  <Layers className="size-5" aria-hidden />
                </span>
              }
              title={h.floatServices(servicesCount)}
              sub={h.floatServicesSub}
            />
            <InfoCard
              still={reduce}
              delay={0.8}
              className="-bottom-6 start-2 hidden sm:flex sm:-start-3"
              icon={
                <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet text-white">
                  <TrendingUp className="size-5" aria-hidden />
                </span>
              }
              title={h.floatGrowth}
              sub={h.floatGrowthSub}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
