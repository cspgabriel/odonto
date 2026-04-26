/**
 * Registry for cache invalidation callbacks.
 * Clinic-actions imports invalidateClinicCache; cache imports clinic-actions.
 * This module breaks the cycle by having no dependency on clinic-actions.
 */
const clinicInvalidators: (() => void)[] = [];
const licenseInvalidators: (() => void)[] = [];

export function registerClinicInvalidator(fn: () => void): void {
  clinicInvalidators.push(fn);
}

export function invalidateClinicCache(): void {
  clinicInvalidators.forEach((fn) => fn());
}

export function registerLicenseInvalidator(fn: () => void): void {
  licenseInvalidators.push(fn);
}

export function invalidateLicenseCache(): void {
  licenseInvalidators.forEach((fn) => fn());
}
