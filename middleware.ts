import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const start = Date.now();
  const method = request.method;
  const path = request.nextUrl.pathname;

  const response = await updateSession(request);

  const duration = Date.now() - start;
  const status = response.status;
  const color = duration < 500 ? "✅" : duration < 2000 ? "⚠️" : "🔴";
  console.log(`${color} [${method}] ${path} → ${status} in ${duration}ms`);

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
