import Link from "next/link";
import { redirect } from "next/navigation";
import { Mail, MailOpen, Phone, Trash2 } from "lucide-react";
import { getAdmin } from "@/lib/supabase/server";
import { deleteMessage, setMessageRead } from "@/actions/admin";
import type { Message } from "@/lib/types";
import { cn, formatDate } from "@/lib/utils";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { EmptyRow, Panel } from "@/components/dashboard/ui";
import { WhatsAppIcon } from "@/components/icons";

export const metadata = { title: "الرسائل" };

export default async function MessagesAdmin(props: PageProps<"/dashboard/messages">) {
  const admin = await getAdmin();
  if (!admin) redirect("/login");
  const { filter } = await props.searchParams;
  const unreadOnly = filter === "unread";
  let q = admin.supabase.from("messages").select("*").order("created_at", { ascending: false }).limit(200);
  if (unreadOnly) q = q.eq("is_read", false);
  const { data } = await q;
  const messages = (data ?? []) as Message[];

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold text-night">الرسائل</h1>
          <p className="mt-1 text-muted">رسائل نموذج «تواصل معنا».</p>
        </div>
        <nav aria-label="تصفية الرسائل" className="flex gap-2">
          {[
            { href: "/dashboard/messages", label: "الكل", active: !unreadOnly },
            { href: "/dashboard/messages?filter=unread", label: "غير المقروءة", active: unreadOnly },
          ].map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={t.active ? "page" : undefined}
              className={cn(
                "rounded-full border-[1.5px] px-4 py-2 text-sm font-semibold",
                t.active ? "border-night bg-night text-white" : "border-line bg-white text-night hover:border-violet",
              )}
            >
              {t.label}
            </Link>
          ))}
        </nav>
      </div>

      {messages.length === 0 ? (
        <Panel>
          <EmptyRow>{unreadOnly ? "لا توجد رسائل غير مقروءة." : "لا توجد رسائل بعد."}</EmptyRow>
        </Panel>
      ) : (
        <div className="space-y-3">
          {messages.map((m) => {
            const digits = m.phone?.replace(/\D/g, "").replace(/^00/, "");
            return (
              <article key={m.id} className={cn("rounded-[20px] border bg-white p-5", m.is_read ? "border-line" : "border-violet/50 shadow-[var(--shadow-soft)]")}>
                <header className="flex flex-wrap items-center gap-2">
                  {!m.is_read && <span className="rounded-full bg-violet px-2 py-0.5 text-xs font-semibold text-white">جديدة</span>}
                  <h2 className="font-bold text-night">{m.full_name}</h2>
                  <time className="ms-auto text-sm text-muted" dateTime={m.created_at}>
                    {formatDate(m.created_at)}
                  </time>
                </header>
                {m.subject && <p className="mt-1 font-semibold text-violet">{m.subject}</p>}
                <p className="mt-2 whitespace-pre-line text-[15px] leading-7 text-night">{m.body}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {digits && (
                    <a
                      href={`https://wa.me/${digits}?text=${encodeURIComponent(`مرحباً ${m.full_name}، شكراً لتواصلك مع بريق.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-whatsapp btn-sm"
                    >
                      <WhatsAppIcon className="size-4" />
                      رد عبر واتساب
                    </a>
                  )}
                  {m.phone && (
                    <a href={`tel:${m.phone.replace(/\s/g, "")}`} className="btn btn-outline btn-sm">
                      <Phone className="size-4" aria-hidden />
                      <span dir="ltr">{m.phone}</span>
                    </a>
                  )}
                  {m.email && (
                    <a href={`mailto:${m.email}?subject=${encodeURIComponent(`رد: ${m.subject ?? "رسالتك إلى بريق"}`)}`} className="btn btn-outline btn-sm">
                      <Mail className="size-4" aria-hidden />
                      {m.email}
                    </a>
                  )}
                  <div className="ms-auto flex gap-2">
                    <form action={setMessageRead}>
                      <input type="hidden" name="id" value={m.id} />
                      <input type="hidden" name="value" value={String(!m.is_read)} />
                      <button type="submit" className="btn btn-outline btn-sm">
                        {m.is_read ? <Mail className="size-4" aria-hidden /> : <MailOpen className="size-4" aria-hidden />}
                        {m.is_read ? "تعيين كغير مقروءة" : "تعيين كمقروءة"}
                      </button>
                    </form>
                    <form action={deleteMessage}>
                      <input type="hidden" name="id" value={m.id} />
                      <ConfirmButton className="btn btn-danger btn-sm" aria-label={`حذف رسالة ${m.full_name}`} message="حذف هذه الرسالة نهائياً؟">
                        <Trash2 className="size-4" aria-hidden />
                      </ConfirmButton>
                    </form>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </>
  );
}
