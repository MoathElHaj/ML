"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState, type PointerEvent as ReactPointerEvent } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type Variants } from "motion/react";
import { CalendarCheck, Check, Code2, Megaphone, MessageCircle, Palette, Smartphone, Sparkles, TrendingUp, type LucideIcon } from "lucide-react";
import { dirOf, getDict, href, type Lang } from "@/lib/i18n";
import { ForwardArrow } from "@/components/icons";
import { HeroArt } from "@/components/art/HeroArt";

// Three.js only loads in the browser, after the hero text has painted.
const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false, loading: () => null });

const ease = [0.22, 1, 0.36, 1] as const;

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.11, delayChildren: 0.1 } },
};
const item: Variants = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.8, ease } },
};

const orbitIcons: { Icon: LucideIcon; className: string; tone: string; delay: number; duration: number }[] = [
  { Icon: Megaphone, className: "-top-7 start-[18%]", tone: "bg-violet text-white", delay: 0.5, duration: 5.5 },
  { Icon: Palette, className: "top-[38%] -end-5 hidden sm:flex", tone: "bg-card text-accent", delay: 0.65, duration: 6.5 },
  { Icon: Code2, className: "-bottom-6 end-[22%]", tone: "bg-deep text-lilac", delay: 0.8, duration: 5 },
  { Icon: Smartphone, className: "top-[30%] -start-5 hidden sm:flex", tone: "bg-lilac text-night", delay: 0.95, duration: 6 },
];

function FloatingChip({ Icon, className, tone, delay, duration, still }: (typeof orbitIcons)[number] & { still: boolean }) {
  return (
    <motion.span
      aria-hidden
      className={`absolute z-10 flex size-12 items-center justify-center rounded-2xl border border-white/40 shadow-[var(--shadow-lift)] backdrop-blur ${tone} ${className}`}
      initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
      animate={still ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 1, scale: 1, rotate: 0, y: [0, -10, 0] }}
      transition={{
        opacity: { delay, duration: 0.5 },
        scale: { delay, type: "spring", stiffness: 260, damping: 16 },
        rotate: { delay, type: "spring", stiffness: 200, damping: 14 },
        y: { delay: delay + 0.6, duration, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <Icon className="size-5" />
    </motion.span>
  );
}

export function Hero({ lang, servicesCount }: { lang: Lang; servicesCount: number }) {
  const t = getDict(lang);
  const h = t.home;
  const reduce = useReducedMotion() ?? false;
  const [showScene, setShowScene] = useState(false);

  // Start the 3D scene once the browser is idle, so it never delays the first paint.
  useEffect(() => {
    if (reduce) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void) => number };
    const start = () => setShowScene(true);
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(start);
      return () => (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(start, 400);
    return () => window.clearTimeout(id);
  }, [reduce]);

  // Gentle 3D tilt of the hero image toward the pointer.
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-9, 9]), { stiffness: 140, damping: 18 });
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [7, -7]), { stiffness: 140, damping: 18 });
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
      <div className="grid-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(70%_60%_at_70%_30%,black,transparent)]" />
      {showScene && <HeroScene dir={dirOf(lang)} />}

      <div className="container-x relative grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <motion.div variants={container} initial={reduce ? false : "hidden"} animate="show">
          <motion.span variants={item} className="eyebrow">
            <motion.span
              className="inline-flex"
              animate={reduce ? undefined : { rotate: [0, 18, -12, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 2.5 }}
            >
              <Sparkles className="size-4" aria-hidden />
            </motion.span>
            {h.eyebrow}
          </motion.span>
          <h1 className="mt-6 text-[40px] font-bold leading-[1.3] text-ink sm:text-[52px] lg:text-[58px]">
            <motion.span variants={item} className="block">
              {h.title1}
            </motion.span>
            <motion.span variants={item} className="text-gradient text-shimmer block">
              {h.title2}
            </motion.span>
          </h1>
          <motion.p variants={item} className="mt-6 max-w-xl text-lg leading-9 text-muted">
            {h.intro}
          </motion.p>
          <motion.div variants={item} className="mt-9 flex flex-wrap gap-3">
            <motion.span whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} className="inline-flex">
              <Link href={href(lang, "/booking")} className="btn btn-primary">
                <CalendarCheck className="size-5" aria-hidden />
                {t.nav.book}
              </Link>
            </motion.span>
            <motion.span whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }} className="group inline-flex">
              <Link href={href(lang, "/services")} className="btn btn-outline">
                {h.explore}
                <ForwardArrow className="size-4 transition-transform rtl:group-hover:-translate-x-1 ltr:group-hover:translate-x-1" />
              </Link>
            </motion.span>
          </motion.div>
          <motion.ul variants={item} className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-[15px] text-ink">
            {h.trust.map((label, i) => (
              <li key={label} className="flex items-center gap-2">
                <motion.span
                  className="flex size-5 items-center justify-center rounded-full bg-violet text-white"
                  initial={reduce ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.12, type: "spring", stiffness: 400, damping: 15 }}
                >
                  <Check className="size-3.5" aria-hidden strokeWidth={3} />
                </motion.span>
                {label}
              </li>
            ))}
          </motion.ul>
        </motion.div>

        <motion.div
          className="relative mx-auto w-full max-w-[560px] lg:max-w-none"
          style={{ perspective: 1200 }}
          initial={reduce ? false : { opacity: 0, scale: 0.92, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease, delay: 0.25 }}
          onPointerMove={onMove}
          onPointerLeave={onLeave}
        >
          <div className="absolute -inset-4 -z-10 rounded-[40px] bg-gradient-to-br from-lilac/60 to-violet/10 blur-2xl dark:from-violet/40" />
          <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="relative">
            <div role="img" aria-label={h.heroAlt} className="relative aspect-[600/412] overflow-hidden rounded-[32px] border-[6px] border-card bg-tint shadow-[var(--shadow-lift)]">
              <HeroArt />
            </div>

            {orbitIcons.map((chip) => (
              <FloatingChip key={chip.className} {...chip} still={reduce} />
            ))}

            <motion.div
              className="absolute -bottom-6 start-2 flex items-center gap-3 rounded-2xl border border-line bg-card/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur sm:-start-6"
              style={{ translateZ: 40 }}
              initial={reduce ? false : { opacity: 0, y: 20 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: [0, -8, 0] }}
              transition={{ opacity: { delay: 0.7 }, y: { delay: 0.7, duration: 6, repeat: Infinity, ease: "easeInOut" } }}
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-violet text-white">
                <TrendingUp className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">{h.floatGrowth}</p>
                <p className="text-xs text-muted">{h.floatGrowthSub}</p>
              </div>
            </motion.div>
            <motion.div
              className="absolute -top-5 end-2 hidden items-center gap-3 rounded-2xl border border-line bg-card/95 px-4 py-3 shadow-[var(--shadow-soft)] backdrop-blur sm:flex sm:-end-4"
              style={{ translateZ: 40 }}
              initial={reduce ? false : { opacity: 0, y: -20 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, y: [0, 8, 0] }}
              transition={{ opacity: { delay: 0.85 }, y: { delay: 0.85, duration: 7, repeat: Infinity, ease: "easeInOut" } }}
            >
              <span className="flex size-11 items-center justify-center rounded-xl bg-tint text-accent">
                <MessageCircle className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">{h.floatServices(servicesCount)}</p>
                <p className="text-xs text-muted">{h.floatServicesSub}</p>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
