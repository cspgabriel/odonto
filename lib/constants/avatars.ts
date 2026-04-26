import type { UserRole } from "@/lib/auth";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "") ?? "";
const ROLE_DEFAULTS_BASE = SUPABASE_URL
  ? `${SUPABASE_URL}/storage/v1/object/public/avatars/role-defaults`
  : "";

/**
 * Initial profile images per role when user has no custom avatar.
 * Images are stored in Supabase Storage (avatars/role-defaults/).
 * Run `npm run seed:role-avatars` to upload them.
 * Fallback to local public/ if Supabase URL is not configured.
 */
export const ROLE_INIT_AVATARS: Record<UserRole, string> = {
  admin: ROLE_DEFAULTS_BASE ? `${ROLE_DEFAULTS_BASE}/admin.png` : "/admin.png",
  doctor: ROLE_DEFAULTS_BASE ? `${ROLE_DEFAULTS_BASE}/doc.png` : "/doc.png",
  receptionist: ROLE_DEFAULTS_BASE ? `${ROLE_DEFAULTS_BASE}/receptionist.png` : "/receptionist.png",
  nurse: ROLE_DEFAULTS_BASE ? `${ROLE_DEFAULTS_BASE}/nurse.png` : "/nurse.png",
} as const;
