import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase/env";

const isAdminPath = (p: string) => p === "/login" || p === "/dashboard" || p.startsWith("/dashboard/");

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public site: Arabic is served without a prefix, English under /en.
  if (!isAdminPath(pathname)) {
    if (pathname === "/ar" || pathname.startsWith("/ar/")) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.slice(3) || "/";
      return NextResponse.redirect(url, 308);
    }
    if (pathname === "/en" || pathname.startsWith("/en/")) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = `/ar${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }

  // Dashboard: refresh the Supabase session and require sign-in.
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured) return response;

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (pathname.startsWith("/dashboard") && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // Everything except Next internals, API routes and files with an extension (images, icons, sitemap, robots).
  matcher: ["/((?!_next/|api/|.*\\.[a-zA-Z0-9]+$).*)"],
};
