"use server";

import { db } from "@/lib/db";
import { rolePermissions } from "@/lib/db/schema";
import { getCurrentUser, requireRole } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { PERMISSION_KEYS } from "@/lib/constants/permissions";
import type { UserRole } from "@/lib/auth";

const ADMIN_ONLY: UserRole[] = ["admin"];

type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function getRolePermissions(role: string): Promise<
  ActionResult<{ key: string; granted: boolean }[]>
> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };
    requireRole(user.role ?? null, ADMIN_ONLY);

    const existing = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.role, role));

    const permMap = new Map(
      existing.map((p) => [p.permissionKey, p.granted])
    );

    const result = PERMISSION_KEYS.map((key) => ({
      key,
      granted: permMap.get(key) ?? false,
    }));

    return { success: true, data: result };
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function saveRolePermissions(input: {
  role: string;
  permissions: { key: string; granted: boolean }[];
}): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };
    requireRole(user.role ?? null, ADMIN_ONLY);

    await Promise.all(
      input.permissions.map((p) =>
        db
          .insert(rolePermissions)
          .values({
            role: input.role,
            permissionKey: p.key,
            granted: p.granted,
          })
          .onConflictDoUpdate({
            target: [rolePermissions.role, rolePermissions.permissionKey],
            set: {
              granted: p.granted,
              updatedAt: new Date(),
            },
          })
      )
    );

    revalidatePath("/dashboard/permissions");
    revalidatePath("/dashboard", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred" };
  }
}

export async function getAllRolePermissionCounts(): Promise<
  ActionResult<Record<string, number>>
> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };
    requireRole(user.role ?? null, ADMIN_ONLY);

    const all = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.granted, true));

    const counts: Record<string, number> = {};
    for (const row of all) {
      counts[row.role] = (counts[row.role] ?? 0) + 1;
    }

    return { success: true, data: counts };
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred" };
  }
}

/** Grant or revoke a permission for all roles. Used for "grant to everyone" / "revoke from everyone" */
export async function setPermissionForAllRoles(input: {
  permissionKey: string;
  granted: boolean;
}): Promise<ActionResult<void>> {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: "Unauthorized" };
    requireRole(user.role ?? null, ADMIN_ONLY);

    const { ROLES } = await import("@/lib/constants/permissions");
    await Promise.all(
      ROLES.map((role) =>
        db
          .insert(rolePermissions)
          .values({
            role,
            permissionKey: input.permissionKey,
            granted: input.granted,
          })
          .onConflictDoUpdate({
            target: [rolePermissions.role, rolePermissions.permissionKey],
            set: {
              granted: input.granted,
              updatedAt: new Date(),
            },
          })
      )
    );

    revalidatePath("/dashboard/permissions");
    revalidatePath("/dashboard", "layout");
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof Error)
      return { success: false, error: error.message };
    return { success: false, error: "An unexpected error occurred" };
  }
}

/** Check if a role has a specific permission (reads from DB). Admin bypass: if role is admin, returns true. */
export async function hasPermission(
  role: string | null,
  permissionKey: string
): Promise<boolean> {
  if (!role) return false;
  if (role === "admin") return true;
  try {
    const [row] = await db
      .select({ granted: rolePermissions.granted })
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.role, role),
          eq(rolePermissions.permissionKey, permissionKey)
        )
      )
      .limit(1);
    return row?.granted === true;
  } catch {
    return false;
  }
}

/** Get all granted permission keys for a role (for UI and guards). Admin returns all keys. */
export async function getGrantedPermissionKeysForRole(
  role: string | null
): Promise<string[]> {
  if (!role) return [];
  if (role === "admin") return [...PERMISSION_KEYS];
  try {
    const rows = await db
      .select({ permissionKey: rolePermissions.permissionKey })
      .from(rolePermissions)
      .where(
        and(
          eq(rolePermissions.role, role),
          eq(rolePermissions.granted, true)
        )
      );
    const keys = rows.map((r) => r.permissionKey);
    return keys;
  } catch (e) {
    console.error("getGrantedPermissionKeysForRole error:", e);
    return [];
  }
}
