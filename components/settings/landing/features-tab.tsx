"use client";

import { useTranslations } from "next-intl";
import { useFormContext, Controller } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import type { LandingSettings } from "@/lib/validations/landing-settings";

const AVAILABLE_LANGUAGES = [
  { id: "en", labelKey: "languageEnglish" as const },
  { id: "fr", labelKey: "languageFrench" as const },
  { id: "es", labelKey: "languageSpanish" as const },
  { id: "ar", labelKey: "languageArabic" as const },
];

export function FeaturesTab() {
  const t = useTranslations("landingSettings");
  const form = useFormContext<LandingSettings>();
  const content = form.watch("content") ?? {};
  const colors = form.watch("colors") ?? {};
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium font-heading">{t("featuresTitle")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("featuresDescription")}
        </p>
      </div>

      <Card className="shadow-sm border">
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">{t("cookieConsent")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("cookieConsentDescription")}
              </p>
            </div>
            <Switch
              checked={content.cookieNotice?.enabled ?? true}
              onCheckedChange={(v) => form.setValue("content.cookieNotice.enabled", v, { shouldDirty: true })}
            />
          </div>



          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">{t("darkModeToggle")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("darkModeToggleDescription")}
              </p>
            </div>
            <Switch
              checked={content.features?.enableDarkModeToggle ?? true}
              onCheckedChange={(v) => form.setValue("content.features.enableDarkModeToggle", v, { shouldDirty: true })}
            />
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">{t("languageSwitcher")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("languageSwitcherDescription")}
              </p>
            </div>
            <Switch
              checked={content.features?.enableLanguageSwitcher ?? true}
              onCheckedChange={(v) => form.setValue("content.features.enableLanguageSwitcher", v, { shouldDirty: true })}
            />
          </div>

          {(content.features?.enableLanguageSwitcher ?? true) && (
            <div className="space-y-3 px-1 pb-4">
              <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t("supportedLanguages")}</Label>
              <div className="flex flex-wrap gap-6">
                {AVAILABLE_LANGUAGES.map(lang => {
                  const supportedLangs = content.features?.supportedLanguages ?? ["en"];
                  const isChecked = supportedLangs.includes(lang.id);
                  return (
                    <div key={lang.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`lang-${lang.id}`}
                        checked={isChecked}
                        onCheckedChange={(checked) => {
                          let next = [...supportedLangs];
                          if (checked) {
                            if (!next.includes(lang.id)) next.push(lang.id);
                          } else {
                            next = next.filter(l => l !== lang.id);
                            if (next.length === 0) next = ["en"]; // prevent empty
                          }
                          form.setValue("content.features.supportedLanguages", next, { shouldDirty: true });
                        }}
                      />
                      <Label htmlFor={`lang-${lang.id}`} className="cursor-pointer">{t(lang.labelKey)}</Label>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base font-semibold">{t("stickyNavbar")}</Label>
              <p className="text-sm text-muted-foreground">
                {t("stickyNavbarDescription")}
              </p>
            </div>
            <Switch
              checked={content.features?.enableStickyNavbar ?? true}
              onCheckedChange={(v) => form.setValue("content.features.enableStickyNavbar", v, { shouldDirty: true })}
            />
          </div>

          <div className="flex flex-col space-y-4 rounded-lg border p-4">
            <div className="flex flex-row items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">{t("topBanner")}</Label>
                <p className="text-sm text-muted-foreground">
                  {t("topBannerDescription")}
                </p>
              </div>
              <Switch
                checked={content.features?.enableTopBar ?? true}
                onCheckedChange={(v) => form.setValue("content.features.enableTopBar", v, { shouldDirty: true })}
              />
            </div>
            
            {(content.features?.enableTopBar ?? true) && (
              <div className="pt-4 border-t space-y-4">
                <div className="space-y-3">
                  <Label>{t("topBarStyle")}</Label>
                  <Select
                    value={content.features?.topBarType ?? "info"}
                    onValueChange={(val) => form.setValue("content.features.topBarType", val as "info" | "custom", { shouldDirty: true })}
                  >
                    <SelectTrigger className="w-full md:w-[300px]">
                      <SelectValue placeholder={t("selectStyle")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">{t("infoLeftSocialsRight")}</SelectItem>
                      <SelectItem value="custom">{t("customTextOnly")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {(content.features?.topBarType === "custom") && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="topBarCustomText">{t("customBannerText")}</Label>
                      <Input
                        id="topBarCustomText"
                        placeholder={t("customBannerTextPlaceholder")}
                        value={content.features?.topBarCustomText ?? ""}
                        onChange={(e) => form.setValue("content.features.topBarCustomText", e.target.value, { shouldDirty: true })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{t("bannerBgColor")}</Label>
                      <div className="flex items-center gap-3">
                        <Controller
                          control={form.control}
                          name="content.features.topBarCustomBgColor"
                          render={({ field }) => (
                            <Popover>
                              <PopoverTrigger asChild>
                                <div
                                  className="h-10 w-10 shrink-0 rounded border border-input cursor-pointer shadow-sm"
                                  style={{ backgroundColor: field.value || colors.primary || "#000000" }}
                                  aria-label="Pick banner background color"
                                />
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
                                <ColorPicker
                                  value={field.value || colors.primary || "#000000"}
                                  onChange={(val) => field.onChange(val)}
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                        />
                        <span className="text-sm font-mono text-muted-foreground uppercase">
                          {content.features?.topBarCustomBgColor || colors.primary || "#000000"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
