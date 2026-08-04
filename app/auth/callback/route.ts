import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Magic-link landing. Exchanges the `code`, reads the role from the database,
 * and sends the user to their role home: admin → /admin, dentist → /dentist,
 * patient → the `next` param or /account. A bad or reused link goes to the
 * sign-in page with the link_expired error state.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  const rawNext = searchParams.get("next");
  const next =
    rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/account";

  if (code) {
    const supabase = await createClient();
    // The app sends OTPs server-side (no PKCE challenge), so the emailed and
    // admin-generated links carry a plain token, not an auth code. Verify it
    // by token_hash — exchangeCodeForSession only accepts PKCE auth codes.
    const { error } = await supabase.auth.verifyOtp({
      token_hash: code,
      type: "magiclink",
    });
    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();
        const home =
          profile?.role === "admin" ? "/admin" : profile?.role === "dentist" ? "/dentist" : next;
        return NextResponse.redirect(new URL(home, request.url));
      }
    }
  }

  return NextResponse.redirect(new URL("/auth/sign-in?error=link_expired", request.url));
}
