import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/supabase/server";
import { exchangeCode, getMe, MetaError } from "@/lib/meta";

/** Facebook Login returns here: verify state, store a long-lived token, then pick ad account + Page. */
export async function GET(request: NextRequest) {
  const back = (status: string) => {
    const res = NextResponse.redirect(new URL(`/dashboard/marketing?meta=${status}`, request.url));
    res.cookies.delete({ name: "meta_oauth_state", path: "/api/meta" });
    return res;
  };

  const admin = await getAdmin();
  if (!admin) return NextResponse.redirect(new URL("/login", request.url));
  if (!admin.can("marketing")) return NextResponse.redirect(new URL("/dashboard?denied=marketing", request.url));

  const { searchParams } = request.nextUrl;
  if (searchParams.get("error")) return back("denied");
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  if (!code || !state || state !== request.cookies.get("meta_oauth_state")?.value) return back("invalid_state");

  try {
    const redirectUri = new URL("/api/meta/callback", request.url).toString();
    const { token, expiresAt } = await exchangeCode(code, redirectUri);
    const me = await getMe(token);
    const { error } = await admin.supabase.from("meta_connection").upsert({
      id: 1,
      access_token: token,
      token_expires_at: expiresAt,
      fb_user_id: me.id,
      fb_user_name: me.name,
      connected_at: new Date().toISOString(),
    });
    if (error) throw new Error(error.message);
    return back("connected");
  } catch (e) {
    console.error("meta callback", e instanceof MetaError ? e.message : e);
    return back("failed");
  }
}
