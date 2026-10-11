"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion, X } from "lucide-react";
import { whatsappLink } from "@/lib/site";
import { getDict, href, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { ForwardArrow, WhatsAppIcon } from "@/components/icons";

type Turn = { from: "bot" | "user"; text: string; link?: { href: string; label: string } };

/** Floating WhatsApp button that opens a small chat: welcome, quick answers, then hand-off to WhatsApp Business. */
export function WhatsAppButton({ lang }: { lang: Lang }) {
  const t = getDict(lang).chat;
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([{ from: "bot", text: t.welcome }]);
  const [lastQuestion, setLastQuestion] = useState<string>();
  const panel = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const log = useRef<HTMLDivElement>(null);

  const wa = whatsappLink(t.waMessage(lastQuestion));

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" });
  }, [turns]);

  if (!wa) return null;

  const ask = (faq: (typeof t.faqs)[number]) => {
    setLastQuestion(faq.q);
    setTurns((prev) => [
      ...prev,
      { from: "user", text: faq.q },
      { from: "bot", text: faq.a, link: "link" in faq && faq.link ? { href: href(lang, faq.link.href), label: faq.link.label } : undefined },
    ]);
  };

  const asked = new Set(turns.filter((x) => x.from === "user").map((x) => x.text));
  const remaining = t.faqs.filter((f) => !asked.has(f.q));

  return (
    <div className="fixed bottom-5 start-5 z-50 flex flex-col items-start gap-3 sm:bottom-6 sm:start-6">
      {open && (
        <div
          ref={panel}
          role="dialog"
          aria-modal="false"
          aria-labelledby="chat-title"
          className="flex max-h-[min(640px,calc(100dvh-120px))] w-[min(380px,calc(100vw-40px))] flex-col overflow-hidden rounded-[24px] border border-line bg-card shadow-[0_24px_60px_-12px_rgb(35_11_75/.45)]"
        >
          <div className="flex items-center gap-3 bg-night px-4 py-3.5 text-white">
            <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
              <Image src="/images/logo-white.png" alt="" width={1136} height={476} className="h-5 w-auto" />
              <span className="absolute bottom-0.5 end-0.5 size-2.5 rounded-full border-2 border-night bg-whatsapp" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p id="chat-title" className="font-bold leading-6">
                {t.title}
              </p>
              <p className="truncate text-xs text-white/70">{t.status}</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                toggle.current?.focus();
              }}
              aria-label={t.close}
              className="flex size-9 items-center justify-center rounded-full hover:bg-white/10"
            >
              <X className="size-5" />
            </button>
          </div>

          <div ref={log} className="flex-1 space-y-3 overflow-y-auto bg-tint/60 px-4 py-4" aria-live="polite">
            {turns.map((turn, i) => (
              <div key={i} className={cn("flex", turn.from === "user" ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-[14px] leading-6",
                    turn.from === "user" ? "rounded-ee-md bg-violet text-white" : "rounded-es-md border border-line bg-card text-ink",
                  )}
                >
                  {turn.text}
                  {turn.link && (
                    <Link href={turn.link.href} onClick={() => setOpen(false)} className="mt-2 flex w-fit items-center gap-1 font-semibold text-accent underline-offset-4 hover:underline">
                      {turn.link.label}
                      <ForwardArrow className="size-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            ))}

            {remaining.length > 0 && (
              <div className="pt-1">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted">
                  <MessageCircleQuestion className="size-4" aria-hidden />
                  {turns.length > 1 ? t.more : t.faqTitle}
                </p>
                <div className="flex flex-wrap gap-2">
                  {remaining.map((faq, i) => (
                    <button
                      key={faq.q}
                      type="button"
                      data-autofocus={i === 0 ? true : undefined}
                      onClick={() => ask(faq)}
                      className="rounded-full border-[1.5px] border-violet/30 bg-card px-3 py-1.5 text-start text-[13px] font-semibold text-accent transition-colors hover:border-accent hover:bg-tint"
                    >
                      {faq.q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-line bg-card p-3">
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              data-autofocus={remaining.length === 0 ? true : undefined}
              className="btn btn-whatsapp w-full"
            >
              <WhatsAppIcon className="size-5" />
              {t.continue}
            </a>
            <p className="mt-1.5 text-center text-[11px] text-muted">{t.continueHint}</p>
          </div>
        </div>
      )}

      <button
        ref={toggle}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? t.close : t.open}
        className="group relative flex items-center gap-2 rounded-full bg-whatsapp-dark p-3.5 text-white shadow-[0_12px_28px_-8px_rgb(18_140_75/.6)] transition-transform hover:scale-105"
      >
        {!open && <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-whatsapp opacity-25 motion-reduce:hidden" />}
        {open ? <X className="size-7" /> : <WhatsAppIcon className="size-7" />}
      </button>
    </div>
  );
}
