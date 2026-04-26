/**
 * Shared preference constants for currency and locale.
 * Used by Settings, navbar shortcuts, and formatting.
 */

export const CURRENCY_OPTIONS = [
  { label: "US Dollar", value: "USD", symbol: "$" },
  { label: "Euro", value: "EUR", symbol: "€" },
  { label: "British Pound", value: "GBP", symbol: "£" },
  { label: "Swiss Franc", value: "CHF", symbol: "CHF" },
  { label: "Canadian Dollar", value: "CAD", symbol: "C$" },
] as const;

export const LOCALE_OPTIONS = [
  { label: "English", value: "en" },
  { label: "Português (Brasil)", value: "pt-BR" },
  { label: "Français", value: "fr" },
  { label: "Español", value: "es" },
  { label: "العربية", value: "ar" },
] as const;

export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]["value"];
export type LocaleCode = (typeof LOCALE_OPTIONS)[number]["value"];

export const VALID_CURRENCIES: readonly CurrencyCode[] = CURRENCY_OPTIONS.map(
  (o) => o.value
);
export const VALID_LOCALES: readonly LocaleCode[] = LOCALE_OPTIONS.map(
  (o) => o.value
);

export const DEFAULT_CURRENCY: CurrencyCode = "USD";
export const DEFAULT_LOCALE: LocaleCode = "pt-BR";

/** Context for theme/locale: landing (path /) vs dashboard (/dashboard, /login, etc.). */
export type ThemeLocaleContext = "landing" | "dashboard";

/** Cookie names for separate landing vs dashboard theme and locale. */
export const LANDING_THEME_COOKIE = "landing_theme";
export const DASHBOARD_THEME_COOKIE = "dashboard_theme";
/** Landing locale: public/users only. Never shared with dashboard. */
export const LANDING_LOCALE_COOKIE = "landing_locale";
/** Dashboard locale: admin/staff only. Never shared with landing. */
export const DASHBOARD_LOCALE_COOKIE = "dashboard_locale";
export const LANDING_DOCTORS_COOKIE = "landing_show_doctors";
/** Persist clinic type (dental | ophthalmology | general) across landing pages so footer/nav stay consistent. Set when ?clinic= is used. */
export const LANDING_CLINIC_DEMO_COOKIE = "landing_clinic_demo";

/**
 * Paths that belong to the landing (public) area. Use landing_locale cookie only.
 * All other paths (e.g. /dashboard, /login) use dashboard_locale / preferred_locale.
 */
export const LANDING_PATH_PREFIXES = ["/", "/appointment", "/blog", "/policies"] as const;

/** Returns true if pathname is a landing (public) route. Used to keep landing and dashboard locale 100% separated. */
export function isLandingPath(pathname: string): boolean {
  if (!pathname) return false; // empty/missing pathname → treat as dashboard so dashboard locale is used (e.g. loading/shimmer)
  if (pathname === "/") return true;
  return LANDING_PATH_PREFIXES.some(
    (prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(prefix + "/"))
  );
}
