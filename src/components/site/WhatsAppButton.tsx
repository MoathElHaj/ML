import { whatsappLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/icons";

export function WhatsAppButton() {
  const href = whatsappLink("مرحباً بريق، أود الاستفسار عن خدماتكم");
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل معنا عبر واتساب"
      className="group fixed bottom-5 start-5 z-50 flex items-center gap-2 rounded-full bg-whatsapp-dark p-3.5 text-white shadow-[0_12px_28px_-8px_rgb(18_140_75/.6)] transition-transform hover:scale-105 sm:bottom-6 sm:start-6"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-whatsapp opacity-25 motion-reduce:hidden" />
      <WhatsAppIcon className="size-7" />
      <span className="hidden pe-1 text-sm font-semibold sm:group-hover:inline">راسلنا الآن</span>
    </a>
  );
}
