"use server";

import { cookies } from "next/headers";
import {
  LANDING_THEME_COOKIE,
  DASHBOARD_THEME_COOKIE,
  LANDING_LOCALE_COOKIE,
  DASHBOARD_LOCALE_COOKIE,
  type ThemeLocaleContext,
} from "@/lib/preferences/constants";

const THEME_MODE_KEY = "theme_mode";
const THEME_PRESET_KEY = "theme_preset";
const CURRENCY_KEY = "preferred_currency";
const LOCALE_KEY = "preferred_locale";
const MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/** Set theme for landing (path /) or dashboard (/dashboard, /login, etc.). */
export async function setThemeModeCookie(
  context: ThemeLocaleContext,
  value: "light" | "dark" | "system"
) {
  const cookieStore = await cookies();
  const key = context === "landing" ? LANDING_THEME_COOKIE : DASHBOARD_THEME_COOKIE;
  cookieStore.set(key, value, { path: "/", maxAge: MAX_AGE });
  if (context === "dashboard") {
    cookieStore.set(THEME_MODE_KEY, value, { path: "/", maxAge: MAX_AGE });
  }
}

/** @deprecated Use setThemeModeCookie(context, value). Kept for backward compat. */
export async function setThemeModeCookieLegacy(value: "light" | "dark" | "system") {
  const cookieStore = await cookies();
  cookieStore.set(THEME_MODE_KEY, value, { path: "/", maxAge: MAX_AGE });
}

export async function setThemePresetCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(THEME_PRESET_KEY, value, { path: "/", maxAge: MAX_AGE });
}

export async function setCurrencyCookie(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(CURRENCY_KEY, value, { path: "/", maxAge: MAX_AGE });
}

/** Set locale for landing (path /) or dashboard (/dashboard, /login, etc.). */
export async function setLocaleCookie(context: ThemeLocaleContext, value: string) {
  const cookieStore = await cookies();
  const key = context === "landing" ? LANDING_LOCALE_COOKIE : DASHBOARD_LOCALE_COOKIE;
  cookieStore.set(key, value, { path: "/", maxAge: MAX_AGE });
  if (context === "dashboard") {
    cookieStore.set(LOCALE_KEY, value, { path: "/", maxAge: MAX_AGE });
  }
}

/** @deprecated Use setLocaleCookie(context, value). Kept for backward compat. */
export async function setLocaleCookieLegacy(value: string) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_KEY, value, { path: "/", maxAge: MAX_AGE });
}

export async function setMultiDoctorCookie(value: boolean) {
  const cookieStore = await cookies();
  // Using imported constant would be cleaner, but for now matching the style
  cookieStore.set("landing_show_doctors", value ? "true" : "false", { path: "/", maxAge: MAX_AGE });
}
