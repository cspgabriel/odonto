"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import {
  Settings,
  User,
  Palette,
  Moon,
  Sun,
  Monitor,
  DollarSign,
  Languages,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  setThemeModeCookie,
  setThemePresetCookie,
  setCurrencyCookie,
} from "@/lib/actions/settings-actions";
import { updateThemePreset } from "@/lib/theme-utils";
import { THEME_MODE_OPTIONS, THEME_PRESET_OPTIONS } from "@/types/preferences/theme";
import {
  CURRENCY_OPTIONS,
  DASHBOARD_LOCALE_COOKIE,
  LOCALE_OPTIONS,
  type CurrencyCode,
  type LocaleCode,
} from "@/lib/preferences/constants";

const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function setLocaleCookiesClientSide(value: string) {
  const opts = `path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`;
  document.cookie = `${DASHBOARD_LOCALE_COOKIE}=${encodeURIComponent(value)}; ${opts}`;
  document.cookie = `preferred_locale=${encodeURIComponent(value)}; ${opts}`;
}

interface SettingsContentProps {
  user: {
    fullName: string;
    email: string;
    role: string;
  };
  initialThemePreset?: string;
  initialCurrency?: string;
  initialLocale?: string;
}

export function SettingsContent({
  user,
  initialThemePreset = "default",
  initialCurrency = "USD",
  initialLocale = "en",
}: SettingsContentProps) {
  const t = useTranslations("settings");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<"profile" | "preferences">("preferences");
  const { theme, setTheme } = useTheme();
  const [themePreset, setThemePresetState] = useState(initialThemePreset);
  const [currency, setCurrencyState] = useState(initialCurrency);
  const [locale, setLocaleState] = useState(initialLocale);
  const [currencyConfirmOpen, setCurrencyConfirmOpen] = useState(false);
  const [pendingCurrency, setPendingCurrency] = useState<CurrencyCode | null>(null);
  const [localeConfirmOpen, setLocaleConfirmOpen] = useState(false);
  const [pendingLocale, setPendingLocale] = useState<LocaleCode | null>(null);

  useEffect(() => {
    const preset = document.documentElement.getAttribute("data-theme-preset") ?? "default";
    setThemePresetState(preset);
  }, []);

  const handleThemeChange = async (value: string) => {
    const mode = value as "light" | "dark" | "system";
    setTheme(mode);
    await setThemeModeCookie("dashboard", mode);
  };

  const handlePresetChange = async (value: string) => {
    updateThemePreset(value);
    setThemePresetState(value);
    await setThemePresetCookie(value);
  };

  const handleCurrencySelect = (value: string) => {
    if (value === currency) return;
    setPendingCurrency(value as CurrencyCode);
    setCurrencyConfirmOpen(true);
  };

  const handleCurrencyConfirm = async () => {
    if (!pendingCurrency) return;
    setCurrencyState(pendingCurrency);
    await setCurrencyCookie(pendingCurrency);
    setPendingCurrency(null);
    setCurrencyConfirmOpen(false);
  };

  const handleLocaleSelect = (value: string) => {
    if (value === locale) return;
    setPendingLocale(value as LocaleCode);
    setLocaleConfirmOpen(true);
  };

  const handleLocaleConfirm = () => {
    if (!pendingLocale) return;
    setPendingLocale(null);
    setLocaleConfirmOpen(false);
    setLocaleState(pendingLocale);
    // Set cookies in the browser and reload immediately so the app doesn't hang waiting on the server action.
    setLocaleCookiesClientSide(pendingLocale);
    window.location.reload();
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title font-heading">{t("title")}</h1>
        <p className="dashboard-page-description text-muted-foreground">
          {t("pageSubtitle")}
        </p>
      </div>

      <div className="flex gap-6">
        <nav className="w-48 shrink-0 space-y-1">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "profile"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <User className="h-4 w-4" />
              {t("profile")}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("preferences")}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === "preferences"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              <Settings className="h-4 w-4" />
              {t("preferences")}
            </button>
          </div>
        </nav>

        <div className="min-w-0 flex-1">
          {activeTab === "profile" && (
            <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
              <CardHeader className="px-6">
                <CardTitle className="flex items-center gap-2 font-heading text-base">
                  <User className="h-4 w-4" />
                  {t("profile")}
                </CardTitle>
                <CardDescription>
                  {t("profileReadOnlyDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 px-6">
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("nameLabel")}</p>
                    <p className="text-sm font-medium">{user.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("email")}</p>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{t("role")}</p>
                    <p className="text-sm font-medium capitalize">{user.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === "preferences" && (
            <div className="space-y-6">
              <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
                <CardHeader className="px-6">
                  <CardTitle className="flex items-center gap-2 font-heading text-base">
                    <Palette className="h-5 w-5" />
                    {t("themeSettings")}
                  </CardTitle>
                  <CardDescription>
                    {t("themeSettingsSubtitle")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{t("themeModeLabel")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("themeModeDescription")}
                      </p>
                    </div>
                    <Select value={theme ?? "system"} onValueChange={handleThemeChange}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {THEME_MODE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              {option.value === "dark" ? (
                                <Moon className="h-4 w-4" />
                              ) : option.value === "light" ? (
                                <Sun className="h-4 w-4" />
                              ) : (
                                <Monitor className="h-4 w-4" />
                              )}
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{t("colorPreset")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("colorPresetDescription")}
                      </p>
                    </div>
                    <Select value={themePreset} onValueChange={handlePresetChange}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {THEME_PRESET_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full border border-border"
                                style={{
                                  backgroundColor:
                                    typeof option.primary.light === "string" &&
                                    option.primary.light.startsWith("oklch")
                                      ? option.primary.light
                                      : option.primary.light,
                                }}
                              />
                              {option.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
                <CardHeader className="px-6">
                  <CardTitle className="flex items-center gap-2 font-heading text-base">
                    <DollarSign className="h-5 w-5" />
                    {t("currencyCardTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("currencyCardDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{t("displayCurrencyLabel")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("displayCurrencyDescription")}
                      </p>
                    </div>
                    <Select value={currency} onValueChange={handleCurrencySelect}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{option.symbol}</span>
                              <span>{option.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
                <CardHeader className="px-6">
                  <CardTitle className="flex items-center gap-2 font-heading text-base">
                    <Languages className="h-5 w-5" />
                    {t("languageCardTitle")}
                  </CardTitle>
                  <CardDescription>
                    {t("languageCardDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium">{t("displayLanguageLabel")}</p>
                      <p className="text-sm text-muted-foreground">
                        {t("displayLanguageDescription")}
                      </p>
                    </div>
                    <Select value={locale} onValueChange={handleLocaleSelect}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCALE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.value === "en" ? t("languageEnglish") : option.value === "fr" ? t("languageFrench") : option.value === "es" ? t("languageSpanish") : t("languageArabic")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              <AlertDialog
                open={currencyConfirmOpen}
                onOpenChange={(open) => {
                  if (!open) setPendingCurrency(null);
                  setCurrencyConfirmOpen(open);
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("changeCurrencyTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {pendingCurrency ? (
                        <>
                          {t("changeCurrencyDescriptionWithName", {
                            name: CURRENCY_OPTIONS.find((o) => o.value === pendingCurrency)?.label ?? pendingCurrency,
                          })}
                        </>
                      ) : (
                        t("changeCurrencyDescription")
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCurrencyConfirm}>
                      {t("changeCurrencyAction")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog
                open={localeConfirmOpen}
                onOpenChange={(open) => {
                  if (!open) setPendingLocale(null);
                  setLocaleConfirmOpen(open);
                }}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("changeLanguageTitle")}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {pendingLocale ? (
                        t("changeLanguageDescriptionWithName", {
                          name: pendingLocale === "en" ? t("languageEnglish") : pendingLocale === "fr" ? t("languageFrench") : pendingLocale === "es" ? t("languageSpanish") : t("languageArabic"),
                        })
                      ) : (
                        t("changeLanguageDescriptionFormats")
                      )}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={handleLocaleConfirm}>
                      {t("changeLanguageAction")}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
