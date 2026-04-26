"use client";

/**
 * Language switcher for the landing (public) area only.
 * Must be used only on landing routes (/, /appointment, /blog, /policies).
 * Uses PreferencesProvider.localeSource so it only ever writes landing_locale cookie;
 * dashboard locale is 100% separate and never touched here.
 */
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  LANDING_LOCALE_COOKIE,
  LOCALE_OPTIONS,
} from "@/lib/preferences/constants";
import type { LocaleCode } from "@/lib/preferences/constants";
import { usePreferences } from "@/contexts/preferences-context";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";

const LOCALE_LABEL_KEYS: Record<LocaleCode, "languageEnglish" | "languageFrench" | "languageSpanish" | "languageArabic"> = {
  en: "languageEnglish",
  fr: "languageFrench",
  es: "languageSpanish",
  ar: "languageArabic",
};

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function setLandingLocaleCookieClientSide(value: string) {
  document.cookie = `${LANDING_LOCALE_COOKIE}=${encodeURIComponent(value)}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
}
import { cn } from "@/lib/utils";
import { DENTAL_RADIUS_BUTTON } from "@/lib/dental-branding";

const FLAG_EMOJIS: Record<LocaleCode, string> = {
  en: "🇺🇸",
  fr: "🇫🇷",
  es: "🇪🇸",
  ar: "🇸🇦",
};

export function LandingLanguageSwitcher({
  className,
  variant = "outline",
  supportedLanguages = ["en", "fr", "es", "ar"],
}: {
  className?: string;
  variant?: "default" | "outline" | "ghost" | "link" | "destructive" | "secondary";
  supportedLanguages?: string[];
}) {
  const { locale } = usePreferences();
  const t = useTranslations("settings");
  // Filter options based on supportedLanguages array
  const filteredOptions = LOCALE_OPTIONS.filter((o) => supportedLanguages.includes(o.value));
  
  // If the currently saved locale isn't in the supported list, ideally we'd fallback to English,
  // but for rendering purposes, let's just find the current one in the full list or fallback gracefully.
  const current = LOCALE_OPTIONS.find((o) => o.value === locale);

  const handleSelect = (value: LocaleCode) => {
    if (value === locale) return;
    setLandingLocaleCookieClientSide(value);
    window.location.reload();
  };

  if (filteredOptions.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={cn("h-9 gap-1.5 px-3", DENTAL_RADIUS_BUTTON, className)}
          aria-label="Language"
        >
          <span className="text-base leading-none">{FLAG_EMOJIS[locale] ?? "🌐"}</span>
          <span className="hidden text-sm sm:inline">{current ? t(LOCALE_LABEL_KEYS[current.value]) : locale}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        {filteredOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => handleSelect(option.value)}
            className="cursor-pointer gap-2"
          >
            <span className="text-base">{FLAG_EMOJIS[option.value as LocaleCode] ?? "🌐"}</span>
            <span>{t(LOCALE_LABEL_KEYS[option.value as LocaleCode])}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
