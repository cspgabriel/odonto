import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/config";

/**
 * Supabase email confirmation redirects here with ?code=... (PKCE).
 * We exchange the code for a session (sets cookies) then redirect to login
 * with confirmed=1 so the login page shows "Your account is confirmed. You can now sign in."
 */
export async function GET(request: Request) {
  const baseUrl = getSiteUrl();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/login";

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login?error=missing_code`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession:", error.message);
    return NextResponse.redirect(`${baseUrl}/login?error=confirm_failed`);
  }

  // Redirect to login with success flag so we show "Your account is confirmed"
  const redirectUrl = next.startsWith("/") ? `${baseUrl}${next}` : `${baseUrl}/login`;
  const separator = redirectUrl.includes("?") ? "&" : "?";
  return NextResponse.redirect(`${redirectUrl}${separator}confirmed=1`);
}
