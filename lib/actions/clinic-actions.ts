"use server";

import { revalidatePath } from "next/cache";
import { invalidateClinicCache } from "@/lib/cache/invalidators";
import { db } from "@/lib/db";
import { clinics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { log, logStart } from "@/lib/debug";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getDbErrorCode } from "@/lib/utils";

const LOGOS_BUCKET = "logos";
const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const ALLOWED_LOGO_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export type ClinicType = "general" | "dental" | "ophthalmology";

export interface CurrentClinic {
  id: string;
  name: string;
  type: ClinicType;
  heroTagline: string | null;
  heroSubtitle: string | null;
  keyBenefitsLine: string | null;
  logoUrl: string | null;
  siteName: string | null;
  primaryColor: string | null;
  accentColor: string | null;
  heroBgColor: string | null;
  footerText: string | null;
}

const CLINIC_QUERY_TIMEOUT_MS = 1500;

/**
 * Returns the current (single) clinic. Used for landing and dashboard UI variants.
 * If table is missing or empty (migration not run), returns a safe default so UI does not break.
 * Uses a client-side timeout to avoid waiting for DB statement_timeout when Supabase is slow.
 */
export async function getCurrentClinic(): Promise<CurrentClinic> {
  const end = logStart("getCurrentClinic");
  const defaultClinic: CurrentClinic = {
    id: "",
    name: "Dental Clinic",
    type: "general",
    heroTagline: null,
    heroSubtitle: null,
    keyBenefitsLine: null,
    logoUrl: null,
    siteName: null,
    primaryColor: null,
    accentColor: null,
    heroBgColor: null,
    footerText: null,
  };
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("clinic query timeout")), CLINIC_QUERY_TIMEOUT_MS)
    );
    const rows = await Promise.race([
      db
        .select({
          id: clinics.id,
          name: clinics.name,
          type: clinics.type,
          heroTagline: clinics.heroTagline,
          heroSubtitle: clinics.heroSubtitle,
          keyBenefitsLine: clinics.keyBenefitsLine,
          logoUrl: clinics.logoUrl,
          siteName: clinics.siteName,
          primaryColor: clinics.primaryColor,
          accentColor: clinics.accentColor,
          heroBgColor: clinics.heroBgColor,
          footerText: clinics.footerText,
        })
        .from(clinics)
        .limit(1),
      timeoutPromise,
    ]);
    const row = Array.isArray(rows) ? rows[0] : undefined;
    if (row) {
      end();
      return {
        id: row.id,
        name: row.name ?? defaultClinic.name,
        type: (row.type ?? "general") as ClinicType,
        heroTagline: row.heroTagline ?? null,
        heroSubtitle: row.heroSubtitle ?? null,
        keyBenefitsLine: row.keyBenefitsLine ?? null,
        logoUrl: row.logoUrl ?? null,
        siteName: row.siteName ?? null,
        primaryColor: row.primaryColor ?? null,
        accentColor: row.accentColor ?? null,
        heroBgColor: row.heroBgColor ?? null,
        footerText: row.footerText ?? null,
      };
    }
  } catch (err) {
    // Table missing, statement timeout (57014), connection timeout, or DbHandler exited; return default so UI doesn't crash
    const code = getDbErrorCode(err);
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("clinic query timeout")) log("getCurrentClinic", "client timeout, using default");
    else if (code === "57014") log("getCurrentClinic", "statement timeout, using default");
    else if (msg.includes("CONNECT_TIMEOUT") || msg.includes("DbHandler exited") || code === "XX000") {
      log("getCurrentClinic", "connection failed, using default");
    }
  }
  end();
  return defaultClinic;
}

/**
 * Updates clinic type (and optional name). Admin-only; validate role in caller.
 */
export async function updateClinicType(
  clinicId: string,
  type: ClinicType,
  name?: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    let resolvedId = clinicId;
    if (!resolvedId) {
      // Server-side fallback: page may have loaded with cached default (id: "") when DB was slow
      const clinic = await getCurrentClinic();
      if (!clinic?.id) return { success: false, error: "Clinic not found" };
      resolvedId = clinic.id;
    }

    // 1. Update Clinic Table
    await db
      .update(clinics)
      .set({
        type,
        ...(name !== undefined && { name }),
        updatedAt: new Date(),
      })
      .where(eq(clinics.id, resolvedId));

    invalidateClinicCache();
    revalidatePath("/");
    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update clinic",
    };
  }
}

/**
 * Upload logo image to Supabase Storage and return public URL.
 */
export async function uploadLogo(
  formData: FormData
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
      return { success: false, error: "Not authenticated" };
    }
    const file = formData.get("file") as File | null;
    const logoType = (formData.get("type") as string) || "primary"; // primary, dark, favicon
    if (!file || !(file instanceof File)) {
      return { success: false, error: "No file provided" };
    }
    const maxSize = logoType === "favicon" ? 500 * 1024 : MAX_LOGO_SIZE_BYTES; // Favicon max 500KB
    if (file.size > maxSize) {
      return { success: false, error: `Image must be under ${logoType === "favicon" ? "500KB" : "2MB"}` };
    }
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      return { success: false, error: "Use JPEG, PNG, WebP or SVG" };
    }
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { success: false, error: "Server configuration error. Set SUPABASE_SERVICE_ROLE_KEY." };
    }
    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `clinic/${logoType}-${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from(LOGOS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: true });
    if (uploadError) {
      if (uploadError.message?.toLowerCase().includes("bucket") || uploadError.message?.toLowerCase().includes("not found")) {
        return { success: false, error: "Storage bucket missing. Create a public bucket named 'logos' in Supabase Dashboard → Storage." };
      }
      return { success: false, error: uploadError.message };
    }
    const { data: urlData } = supabase.storage.from(LOGOS_BUCKET).getPublicUrl(path);
    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { success: false, error: message };
  }
}

/**
 * Updates landing page overrides. Admin-only.
 */
export async function updateClinicLanding(
  clinicId: string,
  data: {
    heroTagline?: string | null;
    heroSubtitle?: string | null;
    keyBenefitsLine?: string | null;
    logoUrl?: string | null;
    logoDarkUrl?: string | null;
    faviconUrl?: string | null;
    siteName?: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
    heroBgColor?: string | null;
    footerText?: string | null;
    heroLayout?: string | null;
    heroAnimation?: string | null;
    sectionSpacing?: string | null;
    enableAnimations?: boolean | null;
    heroHeight?: string | null;
    ctaButtonStyle?: string | null;
    metaTitle?: string | null;
    metaDescription?: string | null;
    ctaText?: string | null;
    ctaLink?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    contactAddress?: string | null;
    socialFacebook?: string | null;
    socialTwitter?: string | null;
    socialInstagram?: string | null;
    socialLinkedin?: string | null;
    socialYoutube?: string | null;
  }
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    if (!clinicId) return { success: false, error: "Clinic ID required" };
    const updates: Record<string, any> = { updatedAt: new Date() };

    // Update only provided fields
    const fields = [
      "heroTagline", "heroSubtitle", "keyBenefitsLine", "logoUrl", "logoDarkUrl", "faviconUrl",
      "siteName", "primaryColor", "accentColor", "heroBgColor", "footerText",
      "heroLayout", "heroAnimation", "sectionSpacing", "enableAnimations", "heroHeight",
      "ctaButtonStyle", "metaTitle", "metaDescription", "ctaText", "ctaLink",
      "contactEmail", "contactPhone", "contactAddress",
      "socialFacebook", "socialTwitter", "socialInstagram", "socialLinkedin", "socialYoutube"
    ];

    fields.forEach(field => {
      if (data[field as keyof typeof data] !== undefined) {
        updates[field] = data[field as keyof typeof data] ?? null;
      }
    });

    await db.update(clinics).set(updates).where(eq(clinics.id, clinicId));
    invalidateClinicCache();
    revalidatePath("/");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : "Failed to update landing page",
    };
  }
}
