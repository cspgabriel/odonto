/**
 * CareNova – Auth & role helpers
 * Supabase Auth + public.users for role
 */

import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { log, logStart, requestLog } from "@/lib/debug";
import { getDbErrorCode } from "@/lib/utils";

export type UserRole = "admin" | "doctor" | "receptionist" | "nurse";

export interface AppUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  approvedAt: Date | null;
}

export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

const AUTH_USER_TIMEOUT_MS = 10_000;

export async function getAuthUser() {
  const end = logStart("auth.getAuthUser");
  const supabase = await createClient();
  const userPromise = supabase.auth.getUser();
  const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
    setTimeout(() => resolve({ data: { user: null } }), AUTH_USER_TIMEOUT_MS)
  );
  const result = await Promise.race([userPromise, timeoutPromise]);
  end();
  return result.data.user;
}

/** Get current app user (auth + role from public.users). Returns null if not found or on DB error (e.g. timeout). */
export async function getCurrentUser(): Promise<AppUser | null> {
  try {
    const result = await Promise.race([
      _getCurrentUserInternal(),
      new Promise<null>((resolve) =>
        setTimeout(() => {
          console.error("[CareNova] getCurrentUser timed out after 15s");
          resolve(null);
        }, 15000)
      ),
    ]);
    return result;
  } catch (error) {
    console.error("[CareNova] getCurrentUser error:", error);
    return null;
  }
}

async function _getCurrentUserInternal(): Promise<AppUser | null> {
  const end = logStart("auth.getCurrentUser");
  try {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
      end();
      return null;
    }

    const [row] = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        approvedAt: users.approvedAt,
      })
      .from(users)
      .where(eq(users.id, authUser.id))
      .limit(1);

    if (!row) {
      end();
      return null;
    }
    end();
    return {
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      role: row.role as UserRole,
      approvedAt: row.approvedAt,
    };
  } catch (err) {
    end();
    const code = getDbErrorCode(err);
    const msg = err instanceof Error ? err.message : String(err);
    log("auth.getCurrentUser", `error code=${code} (returning null)`);
    requestLog("auth.getCurrentUser.error", `code=${code} ${msg}`);
    return null;
  }
}

/** Get role for current user. Returns null if not authenticated or no app user. */
export async function getUserRole(): Promise<UserRole | null> {
  const user = await getCurrentUser();
  return user?.role ?? null;
}

/** Require one of the given roles. Throws if not allowed. */
export function requireRole(
  userRole: UserRole | null,
  allowed: UserRole[]
): asserts userRole is UserRole {
  if (!userRole || !allowed.includes(userRole)) {
    throw new Error("Forbidden");
  }
}

/** Check if user has one of the allowed roles. */
export function hasRole(
  userRole: UserRole | null,
  allowed: UserRole[]
): userRole is UserRole {
  return !!userRole && allowed.includes(userRole);
}
