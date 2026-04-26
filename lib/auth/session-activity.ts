import { db } from "@/lib/db";
import { userSessions } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function updateSessionActivity(userId: string) {
  try {
    await db
      .update(userSessions)
      .set({ lastActiveAt: new Date() })
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.isRevoked, false)
        )
      );
  } catch {
    // Silent fail — never block a request
  }
}
