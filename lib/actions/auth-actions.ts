"use server";

import { redirect } from "next/navigation";
import { getCachedCurrentUser } from "@/lib/cache";
import { getAuthUser, getCurrentUser, requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { db } from "@/lib/db";
import { users, authAuditLog, staff } from "@/lib/db/schema";
import { eq, desc, and, isNull, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { createNotification } from "@/lib/actions/notification-actions";
import { logStart, requestLog } from "@/lib/debug";
import { getDbErrorCode } from "@/lib/utils";
import { getClientIp, getUserAgent } from "@/lib/auth/request-context";
import { logAuthEvent, recordLoginAttempt, isRateLimited } from "@/lib/auth/audit";
import { upsertSession } from "@/lib/auth/session-tracking";
import { fireAndForget } from "@/lib/utils/safe-async";
import {
  getUserActiveSessions,
  revokeSession,
} from "@/lib/auth/session-tracking";
import { validatePassword } from "@/lib/auth/password-policy";
import { siteConfig } from "@/lib/config";

const AVATARS_BUCKET = "avatars";
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type UserRole = "admin" | "doctor" | "receptionist" | "nurse";

export async function signOut() {
  const ip = await getClientIp();
  const ua = await getUserAgent();

  const supabase = await createClient();
  await supabase.auth.signOut();

  fireAndForget(
    async () => {
      const user = await getCurrentUser();
      if (user) {
        await logAuthEvent({
          userId: user.id,
          email: user.email,
          event: "logout",
          ipAddress: ip,
          userAgent: ua,
        });
      }
    },
    "logout-audit"
  );

  redirect("/login");
}

/**
 * Sign in with email/password on the server so the session is stored in cookies
 * and the next request to /dashboard sees the user. Use this instead of
 * client-side signInWithPassword + redirect to avoid 307 back to login.
 */
export async function signIn(
  email: string,
  password: string
): Promise<{ error?: string }> {
  const ip = await getClientIp();
  const ua = await getUserAgent();
  const emailNormalized = email.toLowerCase().trim();

  const { blocked } = await isRateLimited(emailNormalized, ip);
  if (blocked) {
    fireAndForget(
      () =>
        logAuthEvent({
          email: emailNormalized,
          event: "login_failed",
          ipAddress: ip,
          userAgent: ua,
          metadata: { reason: "rate_limited" },
        }),
      "rate-limit-log"
    );
    return {
      error:
        "Too many failed login attempts. Please try again in 15 minutes.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: emailNormalized,
    password,
  });

  if (error || !data.user) {
    fireAndForget(
      () => recordLoginAttempt(emailNormalized, ip, false),
      "login-attempt-fail"
    );
    fireAndForget(
      () =>
        logAuthEvent({
          email: emailNormalized,
          event: "login_failed",
          ipAddress: ip,
          userAgent: ua,
          metadata: { reason: "invalid_credentials" },
        }),
      "login-fail-log"
    );
    if (
      error?.message?.includes("fetch") ||
      error?.message?.includes("network") ||
      error?.message?.includes("Failed to fetch")
    ) {
      return {
        error: "Cannot reach Supabase. Check your connection and try again.",
      };
    }
    if (error?.message && /email not confirmed|not confirmed|confirm your email/i.test(error.message)) {
      return {
        error: "Please confirm your email using the link we sent. After confirming, you can sign in here.",
      };
    }
    return { error: "Invalid email or password." };
  }

  fireAndForget(
    () => recordLoginAttempt(emailNormalized, ip, true),
    "login-attempt-success"
  );
  fireAndForget(
    () =>
      logAuthEvent({
        userId: data.user.id,
        email: emailNormalized,
        event: "login_success",
        ipAddress: ip,
        userAgent: ua,
      }),
    "login-success-log"
  );
  if (data.session) {
  fireAndForget(
    () =>
      upsertSession({
        userId: data.user.id,
        sessionToken: data.session!.access_token,
        ipAddress: ip,
        userAgent: ua,
        expiresAt: new Date((data.session!.expires_at ?? 0) * 1000),
      }),
    "session-upsert"
  );
  }

  redirect("/dashboard");
}

const VALID_ROLES: UserRole[] = ["admin", "doctor", "receptionist", "nurse"];
/** Self-signup is only allowed for these roles (admin cannot self-register). */
const SIGNUP_ALLOWED_ROLES: UserRole[] = ["doctor", "receptionist", "nurse"];

/**
 * Sign up with email/password. Rate limited and audit logged.
 * Use from signup form via server action.
 */
export async function signUp(credentials: {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
  role?: string;
  emailRedirectTo?: string;
}): Promise<{ success: true } | { success: false; error: string }> {
  const ip = await getClientIp();
  const ua = await getUserAgent();
  const emailNormalized = credentials.email.toLowerCase().trim();

  // Signup is not rate-limited so new emails can always register. Login remains rate-limited.

  const passwordCheck = validatePassword(credentials.password);
  if (!passwordCheck.isValid) {
    return { success: false, error: passwordCheck.errors[0] ?? "Invalid password" };
  }

  const requestedRole = credentials.role as UserRole | undefined;
  const role =
    requestedRole && SIGNUP_ALLOWED_ROLES.includes(requestedRole)
      ? requestedRole
      : "receptionist";
  const phone = credentials.phone?.trim() || undefined;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: emailNormalized,
    password: credentials.password,
    options: {
      emailRedirectTo: credentials.emailRedirectTo ?? siteConfig.auth.callbackUrl,
      data: {
        full_name: credentials.fullName ?? "",
        phone: phone ?? null,
        role,
      },
    },
  });

  if (error) {
    if (/already been registered|already exists|duplicate/i.test(error.message)) {
      return {
        success: false,
        error:
          "An account with this email already exists. If you've confirmed your email, sign in instead.",
      };
    }
    return { success: false, error: error.message };
  }

  if (data.user && !data.session) {
    fireAndForget(
      () =>
        logAuthEvent({
          email: emailNormalized,
          event: "signup",
          ipAddress: ip,
          userAgent: ua,
        }),
      "signup-confirm-log"
    );
    return {
      success: false,
      error: "Check your email to confirm your account.",
    };
  }

  fireAndForget(
    () =>
      logAuthEvent({
        userId: data.user?.id ?? null,
        email: emailNormalized,
        event: "signup",
        ipAddress: ip,
        userAgent: ua,
      }),
    "signup-success-log"
  );

  return { success: true };
}

/**
 * Update the current user's profile picture (avatar URL).
 * Persists in Supabase Auth user_metadata.avatar_url.
 */
export async function updateProfilePicture(
  avatarUrl: string | null
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
      return { success: false, error: "Not authenticated" };
    }
    const supabase = await createClient();
    const url = typeof avatarUrl === "string" ? avatarUrl.trim() || null : null;
    const { error } = await supabase.auth.updateUser({
      data: { avatar_url: url ?? null },
    });
    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update profile picture";
    return { success: false, error: message };
  }
}

/**
 * Upload avatar image to Supabase Storage and return public URL.
 * Automatically creates the "avatars" bucket if it doesn't exist.
 */
export async function uploadAvatar(
  formData: FormData
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
      return { success: false, error: "Not authenticated" };
    }
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return { success: false, error: "No file provided" };
    }
    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      return { success: false, error: "Image must be under 2MB" };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: "Use JPEG, PNG, WebP or GIF" };
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { success: false, error: "Server configuration error. Set SUPABASE_SERVICE_ROLE_KEY." };
    }

    // Auto-create the avatars bucket if it doesn't exist
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === AVATARS_BUCKET);
    if (!bucketExists) {
      const { error: createError } = await supabase.storage.createBucket(AVATARS_BUCKET, {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
        fileSizeLimit: 5 * 1024 * 1024,
      });
      if (createError && !createError.message?.toLowerCase().includes("already exists")) {
        return { success: false, error: `Could not create storage bucket 'avatars': ${createError.message}` };
      }
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${authUser.id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(AVATARS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });
    if (uploadError) {
      return { success: false, error: uploadError.message };
    }
    const { data: urlData } = supabase.storage.from(AVATARS_BUCKET).getPublicUrl(path);
    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { success: false, error: message };
  }
}

/**
 * Update user's full name in both Supabase Auth metadata and public.users table.
 */
export async function updateUserName(
  fullName: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const trimmedName = fullName.trim();
    if (!trimmedName) {
      return { success: false, error: "Name cannot be empty" };
    }

    const supabase = await createClient();

    // Update Supabase Auth metadata
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: trimmedName },
    });
    if (authError) {
      return { success: false, error: authError.message };
    }

    // Update public.users table
    await db
      .update(users)
      .set({ fullName: trimmedName })
      .where(eq(users.id, authUser.id));

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update name";
    return { success: false, error: message };
  }
}

/**
 * Update user's email address.
 * Note: Supabase will send a verification email to the new address.
 */
export async function updateUserEmail(
  newEmail: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const trimmedEmail = newEmail.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      return { success: false, error: "Invalid email address" };
    }

    const supabase = await createClient();

    // Update email in Supabase Auth (triggers verification email)
    const { error: authError } = await supabase.auth.updateUser({
      email: trimmedEmail,
    });
    if (authError) {
      return { success: false, error: authError.message };
    }

    // Update public.users table
    await db
      .update(users)
      .set({ email: trimmedEmail })
      .where(eq(users.id, authUser.id));

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update email";
    return { success: false, error: message };
  }
}

/**
 * Update user's password.
 * Requires current password for verification.
 */
export async function updateUserPassword(
  currentPassword: string,
  newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
      return { success: false, error: "Not authenticated" };
    }

    if (!newPassword || newPassword.length < 8) {
      return { success: false, error: "Password must be at least 8 characters" };
    }

    const supabase = await createClient();

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: authUser.email ?? "",
      password: currentPassword,
    });

    if (verifyError) {
      return { success: false, error: "Current password is incorrect" };
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update password";
    return { success: false, error: message };
  }
}

/** User shape returned by ensureAppUser when successful. */
export type EnsureAppUserResult = {
  success: true;
  role: UserRole;
  user: {
    id: string;
    fullName: string;
    email: string;
    role: UserRole;
    approvedAt: Date | null;
  };
};

/**
 * Ensures the current Supabase Auth user has a row in public.users.
 * Called from dashboard layout. New users get default role "receptionist".
 * Returns the user object to avoid a second DB round-trip for getCachedCurrentUser.
 */
export async function ensureAppUser(): Promise<
  EnsureAppUserResult | { success: false; error: string }
> {
  const endEnsure = logStart("ensureAppUser.total");
  try {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
      endEnsure();
      return { success: false, error: "Not authenticated" };
    }

    const endSelect = logStart("ensureAppUser.select");
    const [existing] = await db
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
    endSelect();

    if (existing) {
      endEnsure();
      return {
        success: true,
        role: existing.role as UserRole,
        user: {
          id: existing.id,
          fullName: existing.fullName,
          email: existing.email,
          role: existing.role as UserRole,
          approvedAt: existing.approvedAt,
        },
      };
    }

    const fullName =
      (authUser.user_metadata?.full_name as string) ||
      authUser.email?.split("@")[0] ||
      "User";
    const email = authUser.email ?? "";
    const metaRole = authUser.user_metadata?.role as string | undefined;
    const role: UserRole =
      metaRole && VALID_ROLES.includes(metaRole as UserRole)
        ? (metaRole as UserRole)
        : "receptionist";
    const phone = (authUser.user_metadata?.phone as string)?.trim() || null;

    const endInsert = logStart("ensureAppUser.insert");
    await db.insert(users).values({
      id: authUser.id,
      fullName,
      email,
      role,
      phone: phone || undefined,
      approvedAt: role === 'admin' ? new Date() : null,
    });
    endInsert();
    fireAndForget(
      () =>
        createNotification(
          "staff_pending",
          "New staff pending approval",
          `${fullName} (${email}) signed up and is waiting for approval.`,
          "/dashboard/staff",
          null
        )
    );
    endEnsure();
    return {
      success: true,
      role,
      user: {
        id: authUser.id,
        fullName,
        email,
        role,
        approvedAt: null,
      },
    };
  } catch (err) {
    endEnsure();
    const message = err instanceof Error ? err.message : "Failed to sync user";
    const code = getDbErrorCode(err);
    requestLog("ensureAppUser.error", `code=${code} ${message}`);
    console.error("ensureAppUser:", err);
    const causeMessage =
      err instanceof Error && err.cause instanceof Error ? err.cause.message : "";
    const isStatementTimeout = code === "57014" || message.includes("statement timeout");
    const isNetworkError =
      !isStatementTimeout &&
      typeof message === "string" &&
      (message.includes("fetch failed") ||
        message.includes("ENOTFOUND") ||
        message.includes("getaddrinfo") ||
        message.includes("timeout") ||
        message.includes("Connect Timeout") ||
        causeMessage.includes("ENOTFOUND") ||
        causeMessage.includes("getaddrinfo"));
    const isDbAuth =
      !isStatementTimeout &&
      !isNetworkError &&
      typeof message === "string" &&
      (message.includes("password authentication failed") ||
        message.includes("28P01") ||
        message.includes("connection") ||
        message.includes("relation") ||
        message.includes("does not exist") ||
        message.includes("42P01"));
    const friendlyError = isStatementTimeout
      ? "Database query timed out. Try again; if it keeps happening, in Supabase run: ALTER ROLE postgres SET statement_timeout = '60s'; (SQL Editor)."
      : isNetworkError
        ? "Cannot reach server. Check your internet connection and that Supabase (and your database host) is reachable. If you're offline or behind a firewall, connect and try again."
        : isDbAuth
          ? message.includes("does not exist") || message.includes("42P01")
            ? "Database tables are missing. Run: npm run db:push (in the project folder) to create tables in Supabase, then refresh."
            : "Database connection failed. Check DATABASE_URL in .env: use the database password from Supabase Dashboard → Settings → Database (use 'Reset database password' if unsure)."
          : message;
    // Duplicate email: app user row exists for this email but with a different auth id (e.g. user re-created in Auth)
    const isDuplicateEmail =
      code === "23505" &&
      (message.includes("users_email_unique") || message.includes("unique constraint"));
    if (isDuplicateEmail) {
      return {
        success: false,
        error: "EMAIL_ALREADY_REGISTERED",
      };
    }
    return { success: false, error: friendlyError };
  }
}

/** List users pending admin approval (admin only). */
export async function getPendingStaff(): Promise<
  | { success: true; data: { id: string; fullName: string; email: string; role: string; createdAt: Date }[] }
  | { success: false; error: string }
> {
  try {
    const user = await getCachedCurrentUser();
    requireRole(user?.role ?? null, ["admin"]);

    const rows = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          isNull(users.approvedAt),
          isNull(users.rejectedAt),
          ne(users.role, "admin")
        )
      )
      .orderBy(desc(users.createdAt));

    return {
      success: true,
      data: rows.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        email: r.email,
        role: r.role as string,
        createdAt: r.createdAt,
      })),
    };
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "Failed to load pending staff" };
  }
}

/** Approve a staff member (admin only). Sets approved_at, adds them to staff table at top, notifies admin. */
export async function approveStaffMember(
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const admin = await getCachedCurrentUser();
    requireRole(admin?.role ?? null, ["admin"]);

    const [targetUser] = await db
      .select({ fullName: users.fullName, email: users.email, role: users.role })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!targetUser) {
      return { success: false, error: "User not found" };
    }

    await db
      .update(users)
      .set({ approvedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));

    const today = new Date().toISOString().slice(0, 10);
    const existingStaff = await db
      .select({ id: staff.id })
      .from(staff)
      .where(eq(staff.email, targetUser.email))
      .limit(1);
    if (existingStaff.length === 0) {
      await db.insert(staff).values({
        fullName: targetUser.fullName,
        email: targetUser.email,
        role: targetUser.role as "admin" | "doctor" | "nurse" | "receptionist",
        status: "approved",
        joinedDate: today,
      });
    }

    await createNotification(
      "staff_approved",
      "Staff approved",
      `${targetUser.fullName} (${targetUser.email}) has been approved and can access the dashboard.`,
      "/dashboard/staff",
      null
    );
    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "Failed to approve" };
  }
}

/** Decline a staff member (admin only). Sets rejected_at so they no longer appear in pending list. */
export async function declineStaffMember(
  userId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const admin = await getCachedCurrentUser();
    requireRole(admin?.role ?? null, ["admin"]);

    const [targetUser] = await db
      .select({ fullName: users.fullName, email: users.email })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    await db
      .update(users)
      .set({ rejectedAt: new Date(), updatedAt: new Date() })
      .where(eq(users.id, userId));

    if (targetUser) {
      await createNotification(
        "staff_declined",
        "Staff declined",
        `${targetUser.fullName} (${targetUser.email}) was declined.`,
        "/dashboard/staff",
        null
      );
    }
    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "Failed to decline" };
  }
}

/** Get audit log for current admin user (admin only). */
export async function getAuthAuditLog(options?: {
  userId?: string;
  limit?: number;
}): Promise<
  | { success: true; data: (typeof authAuditLog.$inferSelect)[] }
  | { success: false; error: string }
> {
  try {
    const user = await getCachedCurrentUser();
    requireRole(user?.role ?? null, ["admin"]);

    const limit = options?.limit ?? 50;

    const logs = await db
      .select()
      .from(authAuditLog)
      .orderBy(desc(authAuditLog.createdAt))
      .limit(limit);

    return { success: true, data: logs };
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "Failed to load audit log" };
  }
}

/** Get active sessions for current user. */
export async function getMyActiveSessions() {
  try {
    const user = await getCachedCurrentUser();
    if (!user) return { success: false as const, error: "Unauthorized" };

    return getUserActiveSessions(user.id);
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "Failed to load sessions" };
  }
}

/** Revoke a specific session (own sessions only). */
export async function revokeMySession(
  sessionId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const user = await getCachedCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };

    return revokeSession(sessionId, user.id);
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "Failed to revoke session" };
  }
}
