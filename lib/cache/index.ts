import { cache } from "react";
import { getCurrentClinic, type CurrentClinic } from "@/lib/actions/clinic-actions";
import { checkLicense } from "@/lib/actions/license-actions";
import { getLandingSettings, getLandingSettingsPublic } from "@/lib/actions/landing-settings-actions";
import { getDefaultLandingSettingsForClinicType, mergeWithLandingDefaults } from "@/lib/constants/landing-defaults";
import type { ClinicType } from "@/lib/constants/landing-defaults";
import { ensureAppUser } from "@/lib/actions/auth-actions";
import { registerClinicInvalidator, registerLicenseInvalidator } from "./invalidators";

export { invalidateClinicCache, invalidateLicenseCache } from "./invalidators";
import { getDepartments } from "@/lib/actions/department-actions";
import { getServices } from "@/lib/actions/service-actions";
import { getLabVendors } from "@/lib/actions/lab-vendor-actions";

/**
 * Cached per-request — deduplicates identical calls within one render cycle.
 * Use these in Server Components and layouts. Never use cache() for mutations.
 */

// Module-level cache for clinic — survives across requests, 5 min TTL
// Saves 1.5s + 1 connection per request (clinic times out on every request otherwise)
let clinicCache: { data: CurrentClinic; expiresAt: number } | null = null;

const DEFAULT_CLINIC: CurrentClinic = {
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

export async function getCachedClinic(): Promise<CurrentClinic> {
  if (clinicCache && Date.now() < clinicCache.expiresAt) {
    return clinicCache.data;
  }
  try {
    const result = await Promise.race([
      getCurrentClinic(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Clinic query timeout")), 5000)
      ),
    ]);
    // Only cache real clinic data; default (id: "") from timeout must not be cached
    if (result.id) {
      clinicCache = {
        data: result,
        expiresAt: Date.now() + 5 * 60 * 1000,
      };
    }
    return result;
  } catch (error) {
    console.error("[CareNova] getCachedClinic failed:", error);
    return clinicCache?.data ?? DEFAULT_CLINIC;
  }
}

registerClinicInvalidator(() => {
  clinicCache = null;
});

// Module-level cache for license — 1 hour TTL (same pattern as getCachedClinic)
let licenseCache: { data: boolean; expiresAt: number } | null = null;

export async function getCachedLicenseCheck(): Promise<boolean> {
  if (licenseCache && Date.now() < licenseCache.expiresAt) {
    return licenseCache.data;
  }
  try {
    const result = await Promise.race([
      checkLicense(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error("License check timeout")), 5000)
      ),
    ]);
    licenseCache = {
      data: result,
      expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour
    };
    return result;
  } catch (error) {
    console.error("[CareNova] getCachedLicenseCheck failed:", error);
    return licenseCache?.data ?? false;
  }
}

registerLicenseInvalidator(() => {
  licenseCache = null;
});

// Per-request cache: layout and page both use this — avoids duplicate users query
export const getCachedEnsureAppUser = cache(ensureAppUser);

export const getCachedCurrentUser = cache(async () => {
  const result = await getCachedEnsureAppUser();
  return result.success ? result.user : null;
});

/**
 * Returns landing page settings. Always tries to read from DB first;
 * merges DB data with clinic-type defaults. Falls back to pure defaults
 * only if DB read fails or returns null.
 */
export const getCachedLandingSettings = cache(
  async (clinicType?: ClinicType) => {
    try {
      const dbSettings = await getLandingSettingsPublic(clinicType ?? undefined);
      if (dbSettings) {
        return mergeWithLandingDefaults(dbSettings, clinicType ?? undefined);
      }
    } catch {
      // Fall through to defaults
    }
    if (clinicType != null) {
      return getDefaultLandingSettingsForClinicType(clinicType);
    }
    const authSettings = await getLandingSettings();
    return authSettings ?? getDefaultLandingSettingsForClinicType("general");
  }
);

export const getCachedDepartments = cache(async () => {
  return getDepartments();
});

export const getCachedServices = cache(async () => {
  return getServices();
});

export const getCachedLabVendors = cache(async () => {
  return getLabVendors();
});
