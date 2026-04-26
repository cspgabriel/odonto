"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { setCurrencyCookie, setLocaleCookie } from "@/lib/actions/settings-actions";
import type { ThemeLocaleContext } from "@/lib/preferences/constants";
import type { CurrencyCode, LocaleCode } from "@/lib/preferences/constants";

interface PreferencesContextValue {
  currency: CurrencyCode;
  locale: LocaleCode;
  setCurrency: (value: CurrencyCode) => Promise<void>;
  setLocale: (value: LocaleCode) => Promise<void>;
  formatAmount: (amount: number) => string;
  formatDate: (date: Date | string) => string;
  formatDateTime: (date: Date | string) => string;
  formatTime: (date: Date | string) => string;
  formatNumber: (n: number) => string;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}

interface PreferencesProviderProps {
  children: ReactNode;
  initialCurrency: CurrencyCode;
  initialLocale: LocaleCode;
  /** "landing" for /, "dashboard" for /dashboard, /login, etc. Used to set the correct locale cookie. */
  localeSource: ThemeLocaleContext;
}

export function PreferencesProvider({
  children,
  initialCurrency,
  initialLocale,
  localeSource,
}: PreferencesProviderProps) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(initialCurrency);
  const [locale, setLocaleState] = useState<LocaleCode>(initialLocale);

  const setCurrency = useCallback(async (value: CurrencyCode) => {
    setCurrencyState(value);
    await setCurrencyCookie(value);
  }, []);

  const setLocale = useCallback(
    async (value: LocaleCode) => {
      setLocaleState(value);
      await setLocaleCookie(localeSource, value);
    },
    [localeSource]
  );

  const formatAmount = useCallback(
    (amount: number): string => {
      try {
        return new Intl.NumberFormat(locale, {
          style: "currency",
          currency,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          numberingSystem: "latn",
        }).format(amount);
      } catch {
        return new Intl.NumberFormat("en", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
          numberingSystem: "latn",
        }).format(amount);
      }
    },
    [currency, locale]
  );

  const formatDate = useCallback(
    (date: Date | string): string => {
      const d = typeof date === "string" ? new Date(date) : date;
      try {
        return new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
        }).format(d);
      } catch {
        return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(d);
      }
    },
    [locale]
  );

  const formatDateTime = useCallback(
    (date: Date | string): string => {
      const d = typeof date === "string" ? new Date(date) : date;
      try {
        return new Intl.DateTimeFormat(locale, {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(d);
      } catch {
        return new Intl.DateTimeFormat("en", {
          dateStyle: "medium",
          timeStyle: "short",
        }).format(d);
      }
    },
    [locale]
  );

  const formatTime = useCallback(
    (date: Date | string): string => {
      const d = typeof date === "string" ? new Date(date) : date;
      try {
        return new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(d);
      } catch {
        return new Intl.DateTimeFormat("en", { timeStyle: "short" }).format(d);
      }
    },
    [locale]
  );

  const formatNumber = useCallback(
    (n: number): string => {
      try {
        return new Intl.NumberFormat(locale, { numberingSystem: "latn" }).format(n);
      } catch {
        return new Intl.NumberFormat("en", { numberingSystem: "latn" }).format(n);
      }
    },
    [locale]
  );

  const value = useMemo<PreferencesContextValue>(
    () => ({
      currency,
      locale,
      setCurrency,
      setLocale,
      formatAmount,
      formatDate,
      formatDateTime,
      formatTime,
      formatNumber,
    }),
    [
      currency,
      locale,
      setCurrency,
      setLocale,
      formatAmount,
      formatDate,
      formatDateTime,
      formatTime,
      formatNumber,
    ]
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}
