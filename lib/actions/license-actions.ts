"use server";

import { invalidateLicenseCache } from "@/lib/cache/invalidators";
import { db } from "@/lib/db";
import { license } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function verifyAndActivateLicense(
  purchaseCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const testCode = process.env.LICENSE_TEST_CODE;

    // Local/dev bypass: no Envato dependency.
    if (process.env.NODE_ENV !== "production" && testCode && purchaseCode === testCode) {
      const existing = await db
        .select()
        .from(license)
        .where(eq(license.purchaseCode, purchaseCode))
        .limit(1);

      if (!existing[0]) {
        await db.insert(license).values({
          purchaseCode,
          buyerUsername: "test",
          domain: "localhost",
          isValid: true,
          envatoData: null,
        });
      }

      invalidateLicenseCache();
      return { success: true };
    }

    // If already activated, keep it.
    const existing = await db
      .select()
      .from(license)
      .where(eq(license.purchaseCode, purchaseCode))
      .limit(1);

    if (existing[0]?.isValid) {
      return { success: true };
    }

    return {
      success: false,
      error:
        "Local mode only. Use LICENSE_TEST_CODE for activation during testing.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Activation failed";
    return {
      success: false,
      error: message.includes("duplicate key")
        ? "This test license is already activated."
        : `Activation failed: ${message}`,
    };
  }
}

export async function checkLicense(): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(license)
      .where(eq(license.isValid, true))
      .limit(1);
    return result.length > 0;
  } catch {
    return false;
  }
}
