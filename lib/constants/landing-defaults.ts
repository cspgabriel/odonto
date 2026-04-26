import type { LandingSettings } from "@/lib/validations/landing-settings";

import DENTAL_JSON from "@/lib/data/landing-defaults/dental.json";
import GENERAL_JSON from "@/lib/data/landing-defaults/general.json";
import OPHTHALMOLOGY_JSON from "@/lib/data/landing-defaults/ophthalmology.json";

export { DENTAL_JSON, GENERAL_JSON, OPHTHALMOLOGY_JSON };

/**
 * Re-exporting colors for compatibility if needed.
 */
export const DENTAL_DEFAULT_COLORS = DENTAL_JSON.colors as NonNullable<LandingSettings["colors"]>;

export const DEFAULT_LANDING_ASSET_PATHS = {
  primaryLogo: "/Logo_light.svg",
  darkLogo: "/Logo_Dark.svg",
  favicon: "/favicon.svg",
} as const;

/* --- DENTAL DEFAULTS (ClinicMaster) --- */
export const DENTAL_LANDING_DEFAULTS = DENTAL_JSON as unknown as LandingSettings;

/* --- GENERAL DEFAULTS (CareNova) --- */
export const GENERAL_LANDING_DEFAULTS = GENERAL_JSON as unknown as LandingSettings;

/* --- OPHTHALMOLOGY DEFAULTS --- */
export const OPHTHALMOLOGY_LANDING_DEFAULTS = OPHTHALMOLOGY_JSON as unknown as LandingSettings;

/**
 * Main Default Export. 
 * Defaults to DENTAL settings.
 */
export const DEFAULT_LANDING_SETTINGS: LandingSettings = DENTAL_LANDING_DEFAULTS;

/**
 * Deep merge: source (from DB) overrides defaults.
 */
function deepMerge<T extends Record<string, unknown>>(defaults: T, source: T | null | undefined): T {
  if (source == null) return defaults;
  const out = { ...defaults };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const d = defaults[key];
    const s = source[key];
    if (s === null || s === undefined) continue;
    if (
      d != null &&
      typeof d === "object" &&
      !Array.isArray(d) &&
      s != null &&
      typeof s === "object" &&
      !Array.isArray(s)
    ) {
      (out as Record<string, unknown>)[key as string] = deepMerge(
        d as Record<string, unknown>,
        s as Record<string, unknown>
      ) as T[keyof T];
    } else {
      (out as Record<string, unknown>)[key as string] = s;
    }
  }
  return out;
}

/**
 * Deep-merge fetched settings with the appropriate defaults for the clinic type.
 * When clinicType is omitted, uses dental defaults for backward compatibility.
 */
export function mergeWithLandingDefaults(
  fetched: LandingSettings | null,
  clinicType?: ClinicType
): LandingSettings {
  const defaults =
    clinicType != null
      ? getDefaultLandingSettingsForClinicType(clinicType)
      : DEFAULT_LANDING_SETTINGS;
  return deepMerge(defaults, fetched) as LandingSettings;
}

export type ClinicType = "general" | "dental" | "ophthalmology";

/** Defaults for new or reset landing settings, by clinic type. */
export function getDefaultLandingSettingsForClinicType(
  clinicType: ClinicType
): LandingSettings {
  if (clinicType === "dental") {
    return DENTAL_LANDING_DEFAULTS;
  }
  if (clinicType === "ophthalmology") {
    return OPHTHALMOLOGY_LANDING_DEFAULTS;
  }
  // Default to General (CareNova)
  return GENERAL_LANDING_DEFAULTS;
}
