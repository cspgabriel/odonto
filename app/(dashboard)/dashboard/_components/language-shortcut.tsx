"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePreferences } from "@/contexts/preferences-context";
import {
  DASHBOARD_LOCALE_COOKIE,
  LOCALE_OPTIONS,
} from "@/lib/preferences/constants";
import type { LocaleCode } from "@/lib/preferences/constants";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function setLocaleCookiesClientSide(value: string) {
  const opts = `path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
  document.cookie = `${DASHBOARD_LOCALE_COOKIE}=${encodeURIComponent(value)}; ${opts}`;
  document.cookie = `preferred_locale=${encodeURIComponent(value)}; ${opts}`;
}

// Flag emojis for each locale
const FLAG_EMOJIS: Record<LocaleCode, string> = {
  en: "🇺🇸",
  fr: "🇫🇷",
  es: "🇪🇸",
  ar: "🇸🇦",
  "pt-BR": "🇧🇷",
};

const LOCALE_LABEL_KEYS: Record<LocaleCode, "languageEnglish" | "languageFrench" | "languageSpanish" | "languageArabic" | "languagePortuguese"> = {
  en: "languageEnglish",
  fr: "languageFrench",
  es: "languageSpanish",
  ar: "languageArabic",
  "pt-BR": "languagePortuguese",
};

export function LanguageShortcut() {
  const t = useTranslations("settings");
  const tHeader = useTranslations("header");
  const tCommon = useTranslations("common");
  const { locale } = usePreferences();
  const current = LOCALE_OPTIONS.find((o) => o.value === locale);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingValue, setPendingValue] = useState<LocaleCode | null>(null);

  const pendingOption = pendingValue
    ? LOCALE_OPTIONS.find((o) => o.value === pendingValue)
    : null;

  function handleSelect(value: string) {
    if (value === locale) return;
    setPendingValue(value as LocaleCode);
    setConfirmOpen(true);
  }

  function handleConfirm() {
    if (!pendingValue) return;
    setPendingValue(null);
    setConfirmOpen(false);
    // Set cookies immediately in the browser so the next load sees the new locale.
    // Avoids waiting on the server action, which can hang and make the page seem stuck.
    setLocaleCookiesClientSide(pendingValue);
    window.location.reload();
  }

  function handleCancel() {
    setPendingValue(null);
    setConfirmOpen(false);
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="h-8 gap-1.5 flex items-center justify-between rounded-xl border border-input bg-background px-3 py-1.5 text-sm shadow-xs hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 transition-colors min-w-fit leading-none"
            aria-label={tHeader("displayLanguage")}
          >
            <span className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-base leading-none shrink-0">{FLAG_EMOJIS[locale] || "🌐"}</span>
              <span className="text-sm">{current ? t(LOCALE_LABEL_KEYS[current.value]) : t("language")}</span>
            </span>
            <ChevronDown className="h-3.5 w-3.5 opacity-50 shrink-0 ml-1" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end"
          className="!bg-background !text-foreground border border-border p-1 shadow-lg backdrop-blur-sm"
        >
          {LOCALE_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => handleSelect(option.value)}
              className="cursor-pointer rounded-sm"
            >
              <span className="flex items-center gap-2 w-full">
                <span className="text-base">{FLAG_EMOJIS[option.value] || "🌐"}</span>
                <span>{t(LOCALE_LABEL_KEYS[option.value])}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open) setPendingValue(null);
          setConfirmOpen(open);
        }}
      >
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("changeLanguageTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingOption ? (
                <>
                  {t("changeLanguageDescription")} <strong>{t(LOCALE_LABEL_KEYS[pendingOption.value])}</strong>.
                </>
              ) : (
                t("changeLanguageDescription")
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              {t("changeLanguageAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
