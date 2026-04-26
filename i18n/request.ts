import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  VALID_LOCALES,
  LANDING_LOCALE_COOKIE,
  DASHBOARD_LOCALE_COOKIE,
  isLandingPath,
  type LocaleCode,
} from "@/lib/preferences/constants";

const VALID_CLINIC_TYPES = ["dental", "general", "ophthalmology"] as const;

export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLanding = isLandingPath(pathname);
  // Landing and dashboard locale are 100% separated: use only the cookie for this context.
  const localeCookieName = isLanding ? LANDING_LOCALE_COOKIE : DASHBOARD_LOCALE_COOKIE;
  const preferredLocale =
    cookieStore.get(localeCookieName)?.value ??
    (isLanding ? DEFAULT_LOCALE : cookieStore.get("preferred_locale")?.value ?? DEFAULT_LOCALE);
  const locale: LocaleCode = VALID_LOCALES.includes(preferredLocale as LocaleCode)
    ? (preferredLocale as LocaleCode)
    : DEFAULT_LOCALE;

  const dashboardMessages = (await import(`../messages/${locale}.json`)).default;

  if (!isLanding) {
    return { locale, messages: dashboardMessages };
  }

  // For landing: load clinic-type-specific messages and merge under "landing"
  let clinicType: (typeof VALID_CLINIC_TYPES)[number] = "general";
  try {
    const { getCachedClinic } = await import("@/lib/cache");
    const clinic = await getCachedClinic();
    if (clinic?.type && VALID_CLINIC_TYPES.includes(clinic.type as (typeof VALID_CLINIC_TYPES)[number])) {
      clinicType = clinic.type as (typeof VALID_CLINIC_TYPES)[number];
    }
  } catch {
    // Fallback to general
  }

  let landingMessages: Record<string, unknown> = {};
  try {
    landingMessages = (
      await import(`../messages/landing/${clinicType}/${locale}.json`)
    ).default as Record<string, unknown>;
  } catch {
    try {
      landingMessages = (
        await import(`../messages/landing/general/${locale}.json`)
      ).default as Record<string, unknown>;
    } catch {
      // No landing messages
    }
  }

  return {
    locale,
    messages: {
      ...dashboardMessages,
      landing: landingMessages,
    },
  };
});
