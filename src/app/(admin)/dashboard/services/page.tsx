import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { deleteService, toggleService } from "@/actions/admin";
import type { Service } from "@/lib/types";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { EmptyRow, PageHeader, Panel, PublishedBadge, SavedNotice } from "@/components/dashboard/ui";
import { ServiceIcon } from "@/components/icons";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("الخدمات", "Services") };
}

export default async function ServicesAdmin(props: PageProps<"/dashboard/services">) {
  const admin = await requireSection("content");
  const { t } = await getDashT();
  const { saved } = await props.searchParams;
  const { data } = await admin.supabase.from("services").select("*").order("sort_order").order("created_at");
  const services = (data ?? []) as Service[];

  return (
    <>
      <PageHeader title={t("الخدمات", "Services")} description={t("الخدمات التي تظهر في الموقع، بالترتيب نفسه.", "Services shown on the website, in this order.")} action={{ href: "/dashboard/services/new", label: t("خدمة جديدة", "New service") }} />
      <SavedNotice show={saved === "1"} />
      <Panel>
        {services.length === 0 ? (
          <EmptyRow>{t("لا توجد خدمات. أضف أول خدمة، أو شغّل ملف seed.sql لإضافة الخدمات الأربع.", "No services yet. Add one, or run seed.sql to add the four default services.")}</EmptyRow>
        ) : (
          <ul className="divide-y divide-line">
            {services.map((s) => (
              <li key={s.id} className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-night">
                    {s.image_url ? (
                      <Image src={s.image_url} alt="" fill sizes="64px" className="object-cover" />
                    ) : (
                      <ServiceIcon name={s.icon} className="absolute inset-0 m-auto size-6 text-lilac" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-night">{s.title}</p>
                      <PublishedBadge published={s.is_published} draftLabel={t("مخفية", "Hidden")} />
                    </div>
                    <p className="truncate text-sm text-muted">{s.summary}</p>
                    <p className="text-xs text-muted" dir="ltr">
                      /services/{s.slug} · #{s.sort_order}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <form action={toggleService}>
                    <input type="hidden" name="id" value={s.id} />
                    <input type="hidden" name="value" value={String(!s.is_published)} />
                    <button type="submit" className="btn btn-outline btn-sm" aria-label={s.is_published ? t(`إخفاء ${s.title}`, `Hide ${s.title}`) : t(`إظهار ${s.title}`, `Show ${s.title}`)}>
                      {s.is_published ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                      {s.is_published ? t("إخفاء", "Hide") : t("إظهار", "Show")}
                    </button>
                  </form>
                  <Link href={`/dashboard/services/${s.id}`} className="btn btn-outline btn-sm">
                    <Pencil className="size-4" aria-hidden />
                    {t("تعديل", "Edit")}
                  </Link>
                  <form action={deleteService}>
                    <input type="hidden" name="id" value={s.id} />
                    <ConfirmButton className="btn btn-danger btn-sm" aria-label={t(`حذف ${s.title}`, `Delete ${s.title}`)} message={t(`حذف خدمة «${s.title}»؟ ستبقى الأعمال المرتبطة بها لكن دون خدمة.`, `Delete “${s.title}”? Linked projects stay, without a service.`)}>
                      <Trash2 className="size-4" aria-hidden />
                    </ConfirmButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}
