import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeRippleProvider } from "@/contexts/theme-ripple-context";
import { ThemeRippleGlobal } from "@/components/theme-ripple-global";
import { PreferencesProvider } from "@/contexts/preferences-context";
import { THEME_PRESET_VALUES } from "@/types/preferences/theme";
import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  VALID_CURRENCIES,
  VALID_LOCALES,
  LANDING_THEME_COOKIE,
  DASHBOARD_THEME_COOKIE,
  LANDING_LOCALE_COOKIE,
  DASHBOARD_LOCALE_COOKIE,
  isLandingPath,
  type CurrencyCode,
  type LocaleCode,
} from "@/lib/preferences/constants";
import "./globals.css";
import { fontVariablesClassName } from "./fonts";

/** Static imports for landing messages (Next.js cannot resolve dynamic import paths for JSON). */
const LANDING_MESSAGES: Record<
  "dental" | "general" | "ophthalmology",
  Record<"en" | "pt-BR" | "fr" | "ar" | "es", () => Promise<{ default: Record<string, unknown> }>>
> = {
  dental: {
    en: () => import("@/messages/landing/dental/en.json").then((m) => ({ default: m.default as Record<string, unknown> })),
    "pt-BR": () => import("@/messages/landing/dental/en.json").then((m) => ({ default: m.default as Record<string, unknown> })),
    fr: () => import("@/messages/landing/dental/fr.json").then((m) => ({ default: m.default as Record<string, unknown> })),
    ar: () => import("@/messages/landing/dental/ar.json").then((m) => ({ default: m.default as Record<string, unknown> })),
    es: () => import("@/messages/landing/dental/es.json").then((m) => ({ default: m.default as Record<string, unknown> })),
  },
  general: {
    en: () => import("@/messages/landing/general/en.json").then((m) => ({ default: m.default as Record<string, unknown> })),
    "pt-BR": () => import("@/messages/landing/general/en.json").then((m) => ({ default: m.default as Record<string, unknown> })),
    fr: () => import("@/messages/landing/general/fr.json").then((m) => ({ default: m.default as Record<string, unknown> })),
    ar: () => import("@/messages/landing/general/ar.json").then((m) => ({ default: m.default as Record<string, unknown> })),
    es: () => import("@/messages/landing/general/es.json").then((m) => ({ default: m.default as Record<string, unknown> })),
  },
  ophthalmology: {
    en: () => import("@/messages/landing/ophthalmology/en.json").then((m) => ({ default: m.default as Record<string, unknown> })),
    "pt-BR": () => import("@/messages/landing/ophthalmology/en.json").then((m) => ({ default: m.default as Record<string, unknown> })),
    fr: () => import("@/messages/landing/ophthalmology/fr.json").then((m) => ({ default: m.default as Record<string, unknown> })),
    ar: () => import("@/messages/landing/ophthalmology/ar.json").then((m) => ({ default: m.default as Record<string, unknown> })),
    es: () => import("@/messages/landing/ophthalmology/es.json").then((m) => ({ default: m.default as Record<string, unknown> })),
  },
};

export const metadata: Metadata = {
  title: "CareNova – Clinic Management",
  description: "Production-grade clinic management system",
  icons: {
    icon: "/favicon.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isLanding = isLandingPath(pathname);

  const cookieStore = await cookies();
  const themePreset = cookieStore.get("theme_preset")?.value ?? "default";
  const dataThemePreset = THEME_PRESET_VALUES.includes(themePreset as (typeof THEME_PRESET_VALUES)[number])
    ? themePreset
    : "default";

  const preferredCurrency = cookieStore.get("preferred_currency")?.value ?? DEFAULT_CURRENCY;
  const initialCurrency: CurrencyCode = VALID_CURRENCIES.includes(
    preferredCurrency as CurrencyCode
  )
    ? (preferredCurrency as CurrencyCode)
    : DEFAULT_CURRENCY;

  // Landing and dashboard locale are 100% separated: never read dashboard cookie on landing or vice versa.
  const localeCookieName = isLanding ? LANDING_LOCALE_COOKIE : DASHBOARD_LOCALE_COOKIE;
  const preferredLocale =
    cookieStore.get(localeCookieName)?.value ??
    (isLanding ? DEFAULT_LOCALE : cookieStore.get("preferred_locale")?.value ?? DEFAULT_LOCALE);
  const locale: LocaleCode = VALID_LOCALES.includes(preferredLocale as LocaleCode)
    ? (preferredLocale as LocaleCode)
    : DEFAULT_LOCALE;
  const localeSource = isLanding ? ("landing" as const) : ("dashboard" as const);

  const themeCookieName = isLanding ? LANDING_THEME_COOKIE : DASHBOARD_THEME_COOKIE;
  const themeFromCookie =
    cookieStore.get(themeCookieName)?.value ??
    (isLanding ? "light" : cookieStore.get("theme_mode")?.value ?? "light");
  const defaultTheme =
    themeFromCookie === "light" || themeFromCookie === "dark" || themeFromCookie === "system"
      ? themeFromCookie
      : "light";

  const isArabic = locale === "ar";
  const messages = await (async () => {
    const dashboardMessages = await (async () => {
      switch (locale) {
        case "ar": return import("@/messages/ar.json").then((m) => m.default as Record<string, unknown>);
        case "es": return import("@/messages/es.json").then((m) => m.default as Record<string, unknown>);
        case "fr": return import("@/messages/fr.json").then((m) => m.default as Record<string, unknown>);
        case "pt-BR": return import("@/messages/pt-BR.json").then((m) => m.default as Record<string, unknown>);
        default: return import("@/messages/en.json").then((m) => m.default as Record<string, unknown>);
      }
    })().catch(() => ({}));

    // On landing routes: merge clinic-type-specific translations under "landing"
    if (isLanding) {
      const VALID_CLINIC_TYPES = ["dental", "general", "ophthalmology"] as const;
      let clinicType: (typeof VALID_CLINIC_TYPES)[number] = "general";
      // Demo mode: ?clinic= param overrides DB (set by middleware as x-clinic-demo header)
      const demoClinic = headersList.get("x-clinic-demo")?.toLowerCase().trim();
      if (demoClinic && VALID_CLINIC_TYPES.includes(demoClinic as (typeof VALID_CLINIC_TYPES)[number])) {
        clinicType = demoClinic as (typeof VALID_CLINIC_TYPES)[number];
      } else {
        try {
          const { getCachedClinic } = await import("@/lib/cache");
          const clinic = await getCachedClinic();
          if (clinic?.type && VALID_CLINIC_TYPES.includes(clinic.type as (typeof VALID_CLINIC_TYPES)[number])) {
            clinicType = clinic.type as (typeof VALID_CLINIC_TYPES)[number];
          }
        } catch {
          // Fallback to general
        }
      }
      const loc: "en" | "pt-BR" | "fr" | "ar" | "es" =
        locale === "en" || locale === "pt-BR" || locale === "fr" || locale === "ar" || locale === "es"
          ? locale
          : "en";
      const loader = LANDING_MESSAGES[clinicType][loc];
      const landingMessages = (await loader()).default;
      return { ...dashboardMessages, landing: landingMessages };
    }
    return dashboardMessages;
  })().catch(() => ({}));

  return (
    <html
      lang={locale}
      dir={isArabic ? "rtl" : "ltr"}
      className={isArabic ? "locale-ar" : ""}
      data-theme-preset={dataThemePreset}
      suppressHydrationWarning
    >
      <body className={`${fontVariablesClassName} ${isArabic ? "font-arabic" : "font-sans"} min-h-screen bg-background antialiased`}>
        <ThemeProvider
          key={localeSource}
          attribute="class"
          defaultTheme={defaultTheme}
          storageKey={`${localeSource}-theme`}
          enableSystem
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <PreferencesProvider
              initialCurrency={initialCurrency}
              initialLocale={locale}
              localeSource={localeSource}
            >
              <ThemeRippleProvider>
                <ThemeRippleGlobal />
                {children}
              </ThemeRippleProvider>
            </PreferencesProvider>
          </NextIntlClientProvider>
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
