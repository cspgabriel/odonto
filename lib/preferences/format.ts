/**
 * Server-safe formatters for date, number, and currency.
 * Use when you have locale/currency from cookies (e.g. in server components).
 * For client components, prefer usePreferences().formatDate / formatAmount / formatNumber.
 */

import type { CurrencyCode, LocaleCode } from "./constants";
import { VALID_CURRENCIES, VALID_LOCALES } from "./constants";
import { DEFAULT_CURRENCY, DEFAULT_LOCALE } from "./constants";

export function formatDateWithLocale(
  date: Date | string,
  locale: string = DEFAULT_LOCALE
): string {
  const loc = VALID_LOCALES.includes(locale as LocaleCode) ? locale : DEFAULT_LOCALE;
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(loc, { dateStyle: "medium" }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(d);
  }
}

export function formatDateTimeWithLocale(
  date: Date | string,
  locale: string = DEFAULT_LOCALE
): string {
  const loc = VALID_LOCALES.includes(locale as LocaleCode) ? locale : DEFAULT_LOCALE;
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(loc, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  }
}

export function formatTimeWithLocale(
  date: Date | string,
  locale: string = DEFAULT_LOCALE
): string {
  const loc = VALID_LOCALES.includes(locale as LocaleCode) ? locale : DEFAULT_LOCALE;
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(loc, { timeStyle: "short" }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en", { timeStyle: "short" }).format(d);
  }
}

export function formatMonthWithLocale(
  date: Date | string,
  locale: string = DEFAULT_LOCALE
): string {
  const loc = VALID_LOCALES.includes(locale as LocaleCode) ? locale : DEFAULT_LOCALE;
  const d = typeof date === "string" ? new Date(date) : date;
  try {
    return new Intl.DateTimeFormat(loc, { month: "short" }).format(d);
  } catch {
    return new Intl.DateTimeFormat("en", { month: "short" }).format(d);
  }
}

export function formatAmountWithCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY
): string {
  const curr = VALID_CURRENCIES.includes(currency as CurrencyCode)
    ? currency
    : DEFAULT_CURRENCY;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: curr,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
}

export function formatNumberWithLocale(
  n: number,
  locale: string = DEFAULT_LOCALE
): string {
  const loc = VALID_LOCALES.includes(locale as LocaleCode) ? locale : DEFAULT_LOCALE;
  try {
    return new Intl.NumberFormat(loc).format(n);
  } catch {
    return new Intl.NumberFormat("en").format(n);
  }
}
