import { getCachedLicenseCheck } from "@/lib/cache";
import { NextResponse } from "next/server";

/**
 * GET /api/check-license
 * Returns { licensed: boolean } for middleware license checks.
 * Called from lib/supabase/middleware (Edge cannot access DB directly).
 */
export async function GET() {
  try {
    const licensed = await getCachedLicenseCheck();
    return NextResponse.json({ licensed });
  } catch {
    return NextResponse.json({ licensed: false });
  }
}
