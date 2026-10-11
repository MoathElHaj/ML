"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getDict, href, isLang } from "@/lib/i18n";

export default function NotFound() {
  const params = useParams<{ lang?: string }>();
  const lang = params.lang && isLang(params.lang) ? params.lang : "ar";
  const t = getDict(lang);
  return (
    <section className="hero-glow -mt-[72px] pt-[72px]">
      <div className="container-x flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
        <p className="text-7xl font-bold text-lilac" dir="ltr">
          404
        </p>
        <h1 className="mt-4 text-3xl font-bold text-ink">{t.notFound.title}</h1>
        <p className="mt-3 max-w-md text-muted">{t.notFound.body}</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href={href(lang, "/")} className="btn btn-primary">
            {t.common.homepage}
          </Link>
          <Link href={href(lang, "/services")} className="btn btn-outline">
            {t.nav.services}
          </Link>
        </div>
      </div>
    </section>
  );
}
