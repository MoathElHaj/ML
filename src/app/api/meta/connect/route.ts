import { randomBytes } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/supabase/server";
import { isMetaConfigured, oauthUrl } from "@/lib/meta";

/** Starts "Connect Meta": sends the admin to Facebook Login with a one-time state value. */
export async function GET(request: NextRequest) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.redirect(new URL("/login", request.url));
  if (!admin.can("marketing")) return NextResponse.redirect(new URL("/dashboard?denied=marketing", request.url));
  if (!isMetaConfigured) return NextResponse.redirect(new URL("/dashboard/marketing?meta=not_configured", request.url));

  const state = randomBytes(24).toString("hex");
  const redirectUri = new URL("/api/meta/callback", request.url).toString();
  const response = NextResponse.redirect(oauthUrl(state, redirectUri));
  response.cookies.set("meta_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: request.nextUrl.protocol === "https:",
    path: "/api/meta",
    maxAge: 600,
  });
  return response;
}
