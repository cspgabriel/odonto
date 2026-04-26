import { db } from "@/lib/db";
import { userSessions } from "@/lib/db/schema";
import { eq, and, lt, gte } from "drizzle-orm";
import crypto from "node:crypto";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function parseDeviceInfo(userAgent: string | null): string {
  if (!userAgent) return "Unknown Device";

  const ua = userAgent.toLowerCase();

  let browser = "Unknown Browser";
  if (ua.includes("chrome") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
  else if (ua.includes("edg")) browser = "Edge";

  let os = "Unknown OS";
  if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("mac os")) os = "macOS";
  else if (ua.includes("iphone")) os = "iPhone";
  else if (ua.includes("ipad")) os = "iPad";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("linux")) os = "Linux";

  return `${browser} on ${os}`;
}

export async function upsertSession(params: {
  userId: string;
  sessionToken: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
}) {
  const tokenHash = hashToken(params.sessionToken);
  const deviceInfo = parseDeviceInfo(params.userAgent);

  try {
    await db
      .insert(userSessions)
      .values({
        userId: params.userId,
        sessionToken: tokenHash,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        deviceInfo,
        lastActiveAt: new Date(),
        expiresAt: params.expiresAt,
        isRevoked: false,
      })
      .onConflictDoUpdate({
        target: [userSessions.sessionToken],
        set: {
          lastActiveAt: new Date(),
          ipAddress: params.ipAddress,
        },
      });
  } catch {
    // Silent fail — session tracking must not break auth
  }
}

export async function revokeSession(
  sessionId: string,
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await db
      .update(userSessions)
      .set({ isRevoked: true })
      .where(
        and(
          eq(userSessions.id, sessionId),
          eq(userSessions.userId, userId)
        )
      );
    return { success: true };
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "Failed to revoke session" };
  }
}

export async function revokeAllSessions(
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await db
      .update(userSessions)
      .set({ isRevoked: true })
      .where(eq(userSessions.userId, userId));
    return { success: true };
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "Failed to revoke sessions" };
  }
}

export async function getUserActiveSessions(userId: string): Promise<
  | { success: true; data: (typeof userSessions.$inferSelect)[] }
  | { success: false; error: string }
> {
  try {
    const sessions = await db
      .select()
      .from(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.isRevoked, false),
          gte(userSessions.expiresAt, new Date())
        )
      )
      .orderBy(userSessions.lastActiveAt);

    return { success: true, data: sessions };
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "Failed to load sessions" };
  }
}

export async function cleanupExpiredSessions() {
  try {
    await db
      .delete(userSessions)
      .where(lt(userSessions.expiresAt, new Date()));
  } catch {
    // Silent fail
  }
}
