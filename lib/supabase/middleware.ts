import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { LANDING_CLINIC_DEMO_COOKIE } from "@/lib/preferences/constants";

const VALID_DEMO_TYPES = ["dental", "general", "ophthalmology"] as const;

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const clinicParam = request.nextUrl.searchParams.get("clinic")?.toLowerCase().trim();
  const isDemoClinic = clinicParam && VALID_DEMO_TYPES.includes(clinicParam as (typeof VALID_DEMO_TYPES)[number]);

  if (process.env.NODE_ENV === "development") {
    console.log(`[CareNova] ${new Date().toISOString()} request.in | ${request.method} ${pathname}`);
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  if (isDemoClinic) {
    requestHeaders.set("x-clinic-demo", clinicParam!);
  }
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Persist clinic type across landing pages (/, /blog, /appointment, /policies) so footer/nav stay consistent
  const isLanding = pathname === "/" || pathname === "/appointment" || pathname.startsWith("/blog") || pathname.startsWith("/policies");
  if (isLanding && isDemoClinic) {
    response.cookies.set(LANDING_CLINIC_DEMO_COOKIE, clinicParam!, {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    });
  }

  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAuthRoute = pathname === "/login" || pathname === "/signup";

  // If logged in and visiting login/signup → redirect to dashboard (unless pending approval)
  // When user confirmed email but is not yet approved, dashboard redirects to /login?pending=1.
  // We must not redirect /login?pending=1 back to dashboard or we get ERR_TOO_MANY_REDIRECTS.
  if (isAuthRoute) {
    const pending = request.nextUrl.searchParams.get("pending") === "1";
    if (pending) {
      return response;
    }
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );
    try {
      const result = await Promise.race([
        supabase.auth.getUser(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Auth middleware timeout")), 6_000)
        ),
      ]);
      const user = result.data?.user ?? null;
      if (user) {
        const dashboardUrl = new URL("/dashboard", request.url);
        const redirectResponse = NextResponse.redirect(dashboardUrl);
        response.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c.name, c.value, c));
        return redirectResponse;
      }
    } catch {
      // On timeout/error, allow user to see login page
    }
    return response;
  }

  if (!isDashboard) {
    return response;
  }

  const traceT0 = Date.now();
  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+0ms | middleware.dashboard.auth.start`);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const AUTH_CHECK_TIMEOUT_MS = 6_000;
  let user = null;
  try {
    const result = await Promise.race([
      supabase.auth.getUser(),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Auth middleware timeout")),
          AUTH_CHECK_TIMEOUT_MS
        )
      ),
    ]);
    user = result.data?.user ?? null;
  } catch (error) {
    console.error("[Middleware] Auth check failed:", error);
    const loginUrl = new URL("/login", request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c.name, c.value, c));
    return redirectResponse;
  }

  if (!user) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | middleware.dashboard.auth.done | redirect to login (no user)`);
    }
    const loginUrl = new URL("/login", request.url);
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.cookies.getAll().forEach((c) => redirectResponse.cookies.set(c.name, c.value, c));
    return redirectResponse;
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | middleware.dashboard.auth.done | user ok, pass through`);
  }

  // Throttle session activity ping (every 5 min). Note: Edge middleware cannot
  // access DB, so updateSessionActivity is not called here. Session activity
  // is updated on signIn. For per-request lastActiveAt, use a Node API route.
  const lastPing = request.cookies.get("_session_ping")?.value;
  const now = Date.now();
  const fiveMinMs = 5 * 60 * 1000;
  if (!lastPing || now - Number.parseInt(lastPing, 10) > fiveMinMs) {
    response.cookies.set("_session_ping", String(now), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 5 * 60,
    });
  }

  return response;
}
