// ⚠️ REQUIRED: Run these indexes in Supabase SQL Editor if not already done:
// CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup
//   ON login_attempts(email, success, attempted_at DESC);
// CREATE INDEX IF NOT EXISTS idx_login_attempts_ip
//   ON login_attempts(ip_address, success, attempted_at DESC);
// CREATE INDEX IF NOT EXISTS idx_auth_audit_log_created
//   ON auth_audit_log(created_at DESC);
// CREATE INDEX IF NOT EXISTS idx_user_sessions_token
//   ON user_sessions(session_token);
// CREATE INDEX IF NOT EXISTS idx_user_sessions_user
//   ON user_sessions(user_id, is_revoked);

import { db } from "@/lib/db";
import { authAuditLog, loginAttempts } from "@/lib/db/schema";
import { eq, and, count, gte, lt } from "drizzle-orm";

export type AuthEvent =
  | "login_success"
  | "login_failed"
  | "logout"
  | "signup"
  | "password_reset_requested"
  | "session_expired"
  | "forbidden_access";

const AUDIT_TIMEOUT_MS = 5000;

export async function logAuthEvent(params: {
  userId?: string | null;
  email?: string | null;
  event: AuthEvent;
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const insertPromise = db.insert(authAuditLog).values({
    userId: params.userId ?? null,
    email: params.email ?? null,
    event: params.event,
    ipAddress: params.ipAddress ?? null,
    userAgent: params.userAgent ?? null,
    metadata: params.metadata ?? null,
  });
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("audit timeout")), AUDIT_TIMEOUT_MS)
  );
  try {
    await Promise.race([insertPromise, timeoutPromise]);
  } catch {
    // Audit logging must NEVER break the auth flow
    // Silently fail — logging is non-critical
  }
}

export async function recordLoginAttempt(
  email: string,
  ipAddress: string | null,
  success: boolean
) {
  const insertPromise = db.insert(loginAttempts).values({
    email: email.toLowerCase().trim(),
    ipAddress,
    success,
  });
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("record attempt timeout")), AUDIT_TIMEOUT_MS)
  );
  try {
    await Promise.race([insertPromise, timeoutPromise]);
  } catch {
    // Silent fail — must not break login
  }
}

const RATE_LIMIT_CHECK_TIMEOUT_MS = 2000;
const SAFE_DEFAULT = { blocked: false, remainingAttempts: 5 };

export async function isRateLimited(
  email: string,
  ipAddress: string | null
): Promise<{ blocked: boolean; remainingAttempts: number }> {
  const checkPromise = async () => {
    const windowStart = new Date(Date.now() - 15 * 60 * 1000);

    const [emailResult] = await db
      .select({ value: count() })
      .from(loginAttempts)
      .where(
        and(
          eq(loginAttempts.email, email.toLowerCase().trim()),
          eq(loginAttempts.success, false),
          gte(loginAttempts.attemptedAt, windowStart)
        )
      );

    const emailAttempts = Number(emailResult?.value ?? 0);
    if (emailAttempts >= 5) {
      return { blocked: true, remainingAttempts: 0 };
    }

    if (ipAddress) {
      const [ipResult] = await db
        .select({ value: count() })
        .from(loginAttempts)
        .where(
          and(
            eq(loginAttempts.ipAddress, ipAddress),
            eq(loginAttempts.success, false),
            gte(loginAttempts.attemptedAt, windowStart)
          )
        );
      const ipAttempts = Number(ipResult?.value ?? 0);
      if (ipAttempts >= 10) {
        return { blocked: true, remainingAttempts: 0 };
      }
    }

    return { blocked: false, remainingAttempts: 5 - emailAttempts };
  };

  const timeoutPromise = new Promise<typeof SAFE_DEFAULT>((resolve) => {
    setTimeout(() => {
      if (process.env.CARENOVA_DEBUG === "1") {
        console.warn("[CareNova] isRateLimited timed out — allowing request");
      }
      resolve(SAFE_DEFAULT);
    }, RATE_LIMIT_CHECK_TIMEOUT_MS);
  });

  try {
    return await Promise.race([checkPromise(), timeoutPromise]);
  } catch (error) {
    if (process.env.CARENOVA_DEBUG === "1") {
      console.warn("[CareNova] isRateLimited failed, allowing request:", error);
    }
    return SAFE_DEFAULT;
  }
}

export async function cleanupOldAttempts() {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours
  try {
    await db
      .delete(loginAttempts)
      .where(lt(loginAttempts.attemptedAt, cutoff));
    await db
      .delete(authAuditLog)
      .where(lt(authAuditLog.createdAt, cutoff));
  } catch {
    // Silent fail
  }
}
