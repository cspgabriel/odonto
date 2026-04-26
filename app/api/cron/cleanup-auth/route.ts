import { NextRequest, NextResponse } from "next/server";
import { cleanupOldAttempts } from "@/lib/auth/audit";
import { cleanupExpiredSessions } from "@/lib/auth/session-tracking";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expectedSecret = `Bearer ${process.env.CRON_SECRET ?? ""}`;

  if (!process.env.CRON_SECRET || authHeader !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await Promise.all([
    cleanupOldAttempts(),
    cleanupExpiredSessions(),
  ]);

  return NextResponse.json({
    success: true,
    timestamp: new Date().toISOString(),
  });
}
