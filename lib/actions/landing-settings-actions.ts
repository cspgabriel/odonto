"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { landingPageSettings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getAuthUser } from "@/lib/auth";
import { requirePermission, PermissionDeniedError } from "@/lib/auth/require-permission";
import { getCurrentClinic } from "./clinic-actions";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  brandingSchema,
  colorsSchema,
  contentSchema,
  seoSchema,
  typographySchema,
  ctaSchema,
  contactSchema,
  socialSchema,
  footerSchema,
  type LandingSettings,
} from "@/lib/validations/landing-settings";
import {
  getDefaultLandingSettingsForClinicType,
  mergeWithLandingDefaults,
} from "@/lib/constants/landing-defaults";
import type { ClinicType } from "@/lib/constants/landing-defaults";

const LANDING_ASSETS_BUCKET = "landing-assets";
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

/**
 * Get landing page settings from DB for public pages. No auth required.
 * Returns null if no clinic, no row, or clinic_type mismatch.
 * When displayClinicType is passed (e.g. demo mode), only returns DB data
 * if stored clinic_type matches; otherwise null so caller falls back to defaults.
 */
export async function getLandingSettingsPublic(
  displayClinicType?: "general" | "dental" | "ophthalmology"
): Promise<LandingSettings | null> {
  try {
    const clinic = await getCurrentClinic();
    if (!clinic?.id) return null;

    const [result] = await db
      .select()
      .from(landingPageSettings)
      .where(eq(landingPageSettings.clinicId, clinic.id))
      .limit(1);

    if (!result) return null;

    const effectiveType = displayClinicType ?? clinic.type;
    if ((result.clinicType as string) !== effectiveType) return null;

    const raw: LandingSettings = {
      branding: (result.branding as LandingSettings["branding"]) ?? null,
      colors: (result.colors as LandingSettings["colors"]) ?? null,
      content: (result.content as LandingSettings["content"]) ?? null,
      seo: (result.seo as LandingSettings["seo"]) ?? null,
      typography: (result.typography as LandingSettings["typography"]) ?? null,
      cta: (result.cta as LandingSettings["cta"]) ?? null,
      contact: (result.contact as LandingSettings["contact"]) ?? null,
      social: (result.social as LandingSettings["social"]) ?? null,
      footer: (result.footer as LandingSettings["footer"]) ?? null,
    };
    return raw;
  } catch {
    return null;
  }
}

/**
 * Get landing page settings for current clinic. If no row exists, creates one with
 * defaults and returns it so the client always receives a full object (no null).
 */
export async function getLandingSettings(): Promise<LandingSettings | null> {
  try {
    try {
      await requirePermission("settings.view");
    } catch {
      return null;
    }
    const clinic = await getCurrentClinic();

    if (!clinic?.id) {
      return null;
    }

    const [existing] = await db
      .select()
      .from(landingPageSettings)
      .where(eq(landingPageSettings.clinicId, clinic.id))
      .limit(1);

    if (existing) {
      const storedClinicType = (existing.clinicType as "general" | "dental" | "ophthalmology") ?? "general";
      if (storedClinicType !== clinic.type) {
        return getDefaultLandingSettingsForClinicType(clinic.type);
      }
      const raw: LandingSettings = {
        branding: (existing.branding as LandingSettings["branding"]) ?? null,
        colors: (existing.colors as LandingSettings["colors"]) ?? null,
        content: (existing.content as LandingSettings["content"]) ?? null,
        seo: (existing.seo as LandingSettings["seo"]) ?? null,
        typography: (existing.typography as LandingSettings["typography"]) ?? null,
        cta: (existing.cta as LandingSettings["cta"]) ?? null,
        contact: (existing.contact as LandingSettings["contact"]) ?? null,
        social: (existing.social as LandingSettings["social"]) ?? null,
        footer: (existing.footer as LandingSettings["footer"]) ?? null,
      };
      return mergeWithLandingDefaults(raw, clinic.type);
    }

    // No row: create one with clinic-type-aware defaults (dental → violet/rose colors)
    const defaults = getDefaultLandingSettingsForClinicType(clinic.type);
    const [inserted] = await db
      .insert(landingPageSettings)
      .values({
        clinicId: clinic.id,
        clinicType: clinic.type as ClinicType,
        branding: defaults.branding,
        colors: defaults.colors,
        content: defaults.content,
        seo: defaults.seo,
        typography: defaults.typography,
        cta: defaults.cta,
        contact: defaults.contact,
        social: defaults.social,
        footer: defaults.footer,
      })
      .returning();

    if (!inserted) {
      return null;
    }

    const raw: LandingSettings = {
      branding: (inserted.branding as LandingSettings["branding"]) ?? null,
      colors: (inserted.colors as LandingSettings["colors"]) ?? null,
      content: (inserted.content as LandingSettings["content"]) ?? null,
      seo: (inserted.seo as LandingSettings["seo"]) ?? null,
      typography: (inserted.typography as LandingSettings["typography"]) ?? null,
      cta: (inserted.cta as LandingSettings["cta"]) ?? null,
      contact: (inserted.contact as LandingSettings["contact"]) ?? null,
      social: (inserted.social as LandingSettings["social"]) ?? null,
      footer: (inserted.footer as LandingSettings["footer"]) ?? null,
    };
    return mergeWithLandingDefaults(raw, clinic.type);
  } catch (error) {
    console.error("[getLandingSettings] Error fetching landing settings:", error);
    return null;
  }
}

/**
 * Update a specific section of landing page settings.
 */
export async function updateLandingSettingsSection(
  section: "branding" | "colors" | "content" | "seo" | "typography" | "cta" | "contact" | "social" | "footer",
  data: any
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
      return { success: false, error: "Not authenticated" };
    }

    await requirePermission("settings.edit");

    const clinic = await getCurrentClinic();
    if (!clinic?.id) {
      return { success: false, error: "Clinic not found" };
    }

    // Validate based on section
    let validatedData: any;
    switch (section) {
      case "branding":
        validatedData = brandingSchema.parse(data);
        break;
      case "colors":
        validatedData = colorsSchema.parse(data);
        break;
      case "content":
        validatedData = contentSchema.parse(data);
        break;
      case "seo":
        validatedData = seoSchema.parse(data);
        break;
      case "typography":
        validatedData = typographySchema.parse(data);
        break;
      case "cta":
        validatedData = ctaSchema.parse(data);
        break;
      case "contact":
        validatedData = contactSchema.parse(data);
        break;
      case "social":
        validatedData = socialSchema.parse(data);
        break;
      case "footer":
        validatedData = footerSchema.parse(data);
        break;
      default:
        return { success: false, error: "Invalid section" };
    }

    // Check if settings exist
    const [existing] = await db
      .select()
      .from(landingPageSettings)
      .where(eq(landingPageSettings.clinicId, clinic.id))
      .limit(1);

    if (existing) {
      await db
        .update(landingPageSettings)
        .set({
          [section]: validatedData,
          clinicType: clinic.type as ClinicType,
          updatedAt: new Date(),
        })
        .where(eq(landingPageSettings.clinicId, clinic.id));
    } else {
      const defaults = getDefaultLandingSettingsForClinicType(clinic.type as ClinicType);
      await db.insert(landingPageSettings).values({
        clinicId: clinic.id,
        clinicType: clinic.type as ClinicType,
        branding: defaults.branding,
        colors: defaults.colors,
        content: defaults.content,
        seo: defaults.seo,
        typography: defaults.typography,
        cta: defaults.cta,
        contact: defaults.contact,
        social: defaults.social,
        footer: defaults.footer,
        [section]: validatedData,
      });
    }

    revalidatePath("/");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit settings." };
    }
    if (error instanceof Error && error.name === "ZodError") {
      return { success: false, error: "Validation failed: " + error.message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

/**
 * Update all landing page settings at once. Use for form submit / auto-save.
 * Validates each section with Zod before saving.
 */
export async function updateLandingSettingsFull(
  data: LandingSettings
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
      return { success: false, error: "Not authenticated" };
    }
    await requirePermission("settings.edit");
    const clinic = await getCurrentClinic();
    if (!clinic?.id) {
      return { success: false, error: "Clinic not found" };
    }

    const branding = brandingSchema.parse(data.branding ?? {});
    const colors = colorsSchema.parse(data.colors ?? {});
    const content = contentSchema.parse(data.content ?? {});
    const seo = seoSchema.parse(data.seo ?? {});
    const typography = typographySchema.parse(data.typography ?? {});
    const cta = ctaSchema.parse(data.cta ?? {});
    const contact = contactSchema.parse(data.contact ?? {});
    const social = socialSchema.parse(data.social ?? {});
    const footer = footerSchema.parse(data.footer ?? {});

    const [existing] = await db
      .select()
      .from(landingPageSettings)
      .where(eq(landingPageSettings.clinicId, clinic.id))
      .limit(1);

    const payload = {
      branding,
      colors,
      content,
      seo,
      typography,
      cta,
      contact,
      social,
      footer,
      clinicType: clinic.type as ClinicType,
      updatedAt: new Date(),
    };

    if (existing) {
      await db
        .update(landingPageSettings)
        .set(payload)
        .where(eq(landingPageSettings.clinicId, clinic.id));
    } else {
      await db.insert(landingPageSettings).values({
        clinicId: clinic.id,
        clinicType: clinic.type as ClinicType,
        branding,
        colors,
        content,
        seo,
        typography,
        cta,
        contact,
        social,
        footer,
        updatedAt: new Date(),
      });
    }

    revalidatePath("/");
    revalidatePath("/blog");
    revalidatePath("/appointment");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit settings." };
    }
    if (error instanceof Error && error.name === "ZodError") {
      return { success: false, error: "Validation failed: " + error.message };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update settings",
    };
  }
}

/**
 * Ensures a Supabase Storage bucket exists (public), creating it if not.
 * Uses the service-role admin client so no RLS issues.
 */
async function ensureBucketExists(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  bucketName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!supabase) return { ok: false, error: "Admin client unavailable" };

  // Check if it already exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    return { ok: false, error: listError.message };
  }

  const exists = buckets?.some((b) => b.name === bucketName);
  if (exists) return { ok: true };

  // Create it as a public bucket
  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "image/svg+xml"],
    fileSizeLimit: 10 * 1024 * 1024, // 10MB hard cap
  });

  if (createError) {
    // If another request raced to create it first, that's fine
    if (createError.message?.toLowerCase().includes("already exists")) {
      return { ok: true };
    }
    return { ok: false, error: `Could not create storage bucket '${bucketName}': ${createError.message}` };
  }

  return { ok: true };
}

/**
 * Upload an image asset for landing page (logos, hero images, service icons, etc.).
 */
export async function uploadLandingAsset(
  formData: FormData
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
      return { success: false, error: "Not authenticated" };
    }

    const file = formData.get("file") as File | null;
    const assetType = (formData.get("type") as string) || "general"; // logo, hero, service, testimonial, etc.

    if (!file || !(file instanceof File)) {
      return { success: false, error: "No file provided" };
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      return { success: false, error: "Image must be under 5MB" };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return { success: false, error: "Use JPEG, PNG, WebP or SVG" };
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return { success: false, error: "Server configuration error: SUPABASE_SERVICE_ROLE_KEY not set" };
    }

    // Auto-create the bucket if it doesn't exist yet
    const bucket = await ensureBucketExists(supabase, LANDING_ASSETS_BUCKET);
    if (!bucket.ok) {
      return { success: false, error: bucket.error };
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `landing/${assetType}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(LANDING_ASSETS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage
      .from(LANDING_ASSETS_BUCKET)
      .getPublicUrl(path);

    return { success: true, url: urlData.publicUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return { success: false, error: message };
  }
}

/**
 * Reset landing page settings to defaults.
 */
export async function resetLandingSettings(): Promise<
  { success: true } | { success: false; error: string }
> {
  try {
    const authUser = await getAuthUser();
    if (!authUser?.id) {
      return { success: false, error: "Not authenticated" };
    }
    await requirePermission("settings.edit");

    const clinic = await getCurrentClinic();
    if (!clinic?.id) {
      return { success: false, error: "Clinic not found" };
    }

    const [existing] = await db
      .select()
      .from(landingPageSettings)
      .where(eq(landingPageSettings.clinicId, clinic.id))
      .limit(1);

    const defaults = getDefaultLandingSettingsForClinicType(clinic.type as ClinicType);
    if (existing) {
      await db
        .update(landingPageSettings)
        .set({
          clinicType: clinic.type as ClinicType,
          branding: defaults.branding,
          colors: defaults.colors,
          content: defaults.content,
          seo: defaults.seo,
          typography: defaults.typography,
          cta: defaults.cta,
          contact: defaults.contact,
          social: defaults.social,
          footer: defaults.footer,
          updatedAt: new Date(),
        })
        .where(eq(landingPageSettings.clinicId, clinic.id));
    } else {
      await db.insert(landingPageSettings).values({
        clinicId: clinic.id,
        branding: defaults.branding,
        colors: defaults.colors,
        content: defaults.content,
        seo: defaults.seo,
        typography: defaults.typography,
        cta: defaults.cta,
        contact: defaults.contact,
        social: defaults.social,
        footer: defaults.footer,
      });
    }

    revalidatePath("/");
    revalidatePath("/dashboard/settings");
    return { success: true };
  } catch (error) {
    if (error instanceof PermissionDeniedError) {
      return { success: false, error: "You don't have permission to edit settings." };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reset settings",
    };
  }
}
