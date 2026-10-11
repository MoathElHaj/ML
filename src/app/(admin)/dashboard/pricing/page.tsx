import Link from "next/link";
import { Eye, EyeOff, Pencil, Sparkles, Trash2 } from "lucide-react";
import { requireSection } from "@/lib/supabase/server";
import { getDashT } from "@/lib/dash";
import { deletePackage, togglePackage } from "@/actions/admin";
import type { Package } from "@/lib/types";
import { ConfirmButton } from "@/components/dashboard/ConfirmButton";
import { EmptyRow, PageHeader, Panel, PublishedBadge, SavedNotice } from "@/components/dashboard/ui";

export async function generateMetadata() {
  const { t } = await getDashT();
  return { title: t("الأسعار والباقات", "Pricing") };
}

const periodLabel = { month: { ar: "شهرياً", en: "monthly" }, year: { ar: "سنوياً", en: "yearly" }, once: { ar: "دفعة واحدة", en: "one-off" } } as const;

export default async function PricingAdmin(props: PageProps<"/dashboard/pricing">) {
  const admin = await requireSection("pricing");
  const { t, lang } = await getDashT();
  const { saved } = await props.searchParams;
  const { data } = await admin.supabase.from("packages").select("*").order("sort_order").order("created_at");
  const packages = (data ?? []) as Package[];

  return (
    <>
      <PageHeader title={t("الأسعار والباقات", "Pricing")} description={t("الباقات الظاهرة في صفحة «الأسعار» بالترتيب نفسه.", "Packages shown on the pricing page, in this order.")} action={{ href: "/dashboard/pricing/new", label: t("باقة جديدة", "New package") }} />
      <SavedNotice show={saved === "1"} />
      {packages.length === 0 ? (
        <Panel>
          <EmptyRow>{t("لا توجد باقات بعد.", "No packages yet.")}</EmptyRow>
        </Panel>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {packages.map((p) => (
            <article key={p.id} className={`flex flex-col rounded-[20px] border bg-white p-5 ${p.is_featured ? "border-violet ring-1 ring-violet" : "border-line"}`}>
              <div className="flex flex-wrap items-center gap-2">
                <PublishedBadge published={p.is_published} draftLabel={t("مخفية", "Hidden")} />
                {p.is_featured && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet px-2.5 py-0.5 text-xs font-semibold text-white">
                    <Sparkles className="size-3" aria-hidden /> {t("الأكثر طلباً", "Most popular")}
                  </span>
                )}
              </div>
              <h2 className="mt-3 text-lg font-bold text-night">{p.name}</h2>
              <p className="mt-1 text-2xl font-bold text-violet">
                {Number(p.price)} <span className="text-sm font-medium text-muted">{p.currency} · {periodLabel[p.period][lang]}</span>
              </p>
              <ul className="mt-3 flex-1 space-y-1 text-sm text-muted">
                {p.features.slice(0, 4).map((f) => (
                  <li key={f}>• {f}</li>
                ))}
                {p.features.length > 4 && <li>+ {p.features.length - 4} {t("أخرى", "more")}</li>}
              </ul>
              <div className="mt-4 flex gap-2">
                <Link href={`/dashboard/pricing/${p.id}`} className="btn btn-outline btn-sm flex-1">
                  <Pencil className="size-4" aria-hidden /> {t("تعديل", "Edit")}
                </Link>
                <form action={togglePackage}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="value" value={String(!p.is_published)} />
                  <button type="submit" className="btn btn-outline btn-sm" aria-label={p.is_published ? t(`إخفاء ${p.name}`, `Hide ${p.name}`) : t(`إظهار ${p.name}`, `Show ${p.name}`)}>
                    {p.is_published ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
                  </button>
                </form>
                <form action={deletePackage}>
                  <input type="hidden" name="id" value={p.id} />
                  <ConfirmButton className="btn btn-danger btn-sm" message={t(`حذف «${p.name}» نهائياً؟`, `Delete “${p.name}” permanently?`)} aria-label={t(`حذف ${p.name}`, `Delete ${p.name}`)}>
                    <Trash2 className="size-4" aria-hidden />
                  </ConfirmButton>
                </form>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
