/**
 * CareNova – Permission guards for server actions and pages.
 * Every permission key saved by the admin MUST be enforced here and in actions.
 * Reads from role_permissions DB table — NOT from constants (constants are fallback only).
 */

import { cache } from "react";
import { getCurrentUser } from "@/lib/auth";
import { getGrantedPermissionKeysForRole } from "@/lib/actions/permission-actions";
import { PERMISSION_KEYS } from "@/lib/constants/permissions";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/constants/permissions";

export class PermissionDeniedError extends Error {
  constructor(permission: string) {
    super(`Permission denied: ${permission}`);
    this.name = "PermissionDeniedError";
  }
}

/** Cached per request – reads from role_permissions DB. Admin bypass. Fallback to defaults when DB has no rows. */
export const getCurrentUserPermissions = cache(
  async (): Promise<{
    permissions: string[];
    can: (permission: string) => boolean;
  }> => {
    const user = await getCurrentUser();
    if (!user) {
      return { permissions: [], can: () => false };
    }
    // Admin always has everything — no DB read
    if (user.role === "admin") {
      return {
        permissions: [...PERMISSION_KEYS],
        can: () => true,
      };
    }
    // Read from DB — what admin actually saved
    const dbPermissions = await getGrantedPermissionKeysForRole(user.role);
    // Fallback to defaults when no rows in DB (e.g. before seed)
    const permissions =
      dbPermissions.length > 0
        ? dbPermissions
        : (DEFAULT_ROLE_PERMISSIONS[user.role] ?? []);
    return {
      permissions,
      can: (permission: string) => permissions.includes(permission),
    };
  }
);

/** Use at the top of every server action that needs a permission. Throws if denied. */
export async function requirePermission(permission: string): Promise<void> {
  const { can } = await getCurrentUserPermissions();
  if (!can(permission)) {
    throw new PermissionDeniedError(permission);
  }
}

/** Returns true/false – use for page redirects and UI visibility (e.g. hide buttons). */
export async function checkPermission(permission: string): Promise<boolean> {
  const { can } = await getCurrentUserPermissions();
  return can(permission);
}
