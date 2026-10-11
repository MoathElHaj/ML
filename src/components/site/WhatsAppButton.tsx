import { whatsappLink } from "@/lib/site";
import { getDict, type Lang } from "@/lib/i18n";
import { WhatsAppIcon } from "@/components/icons";

export function WhatsAppButton({ lang }: { lang: Lang }) {
  const t = getDict(lang);
  const link = whatsappLink(t.wa.general);
  if (!link) return null;
  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t.common.whatsappAria}
      className="group fixed bottom-5 start-5 z-50 flex items-center gap-2 rounded-full bg-whatsapp-dark p-3.5 text-white shadow-[0_12px_28px_-8px_rgb(18_140_75/.6)] transition-transform hover:scale-105 sm:bottom-6 sm:start-6"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-whatsapp opacity-25 motion-reduce:hidden" />
      <WhatsAppIcon className="size-7" />
      <span className="hidden pe-1 text-sm font-semibold sm:group-hover:inline">{t.common.whatsappHover}</span>
    </a>
  );
}
