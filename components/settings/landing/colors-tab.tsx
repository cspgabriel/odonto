"use client";

import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ColorPicker } from "@/components/ui/color-picker";
import type { LandingSettings } from "@/lib/validations/landing-settings";

const COLOR_KEYS: (keyof NonNullable<LandingSettings["colors"]>)[] = [
  "primary", "secondary", "accent", "background", "textPrimary", "textSecondary",
  "buttonHover", "success", "error",
];

const COLOR_LABEL_KEYS: Record<keyof NonNullable<LandingSettings["colors"]>, string> = {
  primary: "primaryColor",
  secondary: "secondaryColor",
  accent: "accentColor",
  background: "backgroundColor",
  textPrimary: "textPrimary",
  textSecondary: "textSecondary",
  buttonHover: "buttonHover",
  success: "successColor",
  error: "errorColor",
};

const COLOR_DESC_KEYS: Record<keyof NonNullable<LandingSettings["colors"]>, string> = {
  primary: "primaryColorDesc",
  secondary: "secondaryColorDesc",
  accent: "accentColorDesc",
  background: "backgroundColorDesc",
  textPrimary: "textPrimaryDesc",
  textSecondary: "textSecondaryDesc",
  buttonHover: "buttonHoverDesc",
  success: "successColorDesc",
  error: "errorColorDesc",
};

export function ColorsTab() {
  const t = useTranslations("landingSettings");
  const form = useFormContext<LandingSettings>();
  const colors = form.watch("colors") ?? {};

  return (
    <div className="space-y-4">


      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t("colorSchemeTitle")}</CardTitle>
          <CardDescription>
            {t("colorSchemeDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {COLOR_KEYS.map((key) => (
              <div key={key} className="flex items-center gap-3 rounded-lg border p-3 hover:border-primary/50 transition-colors">
                <Controller
                  control={form.control}
                  name={`colors.${key}`}
                  render={({ field }) => (
                    <Popover>
                      <PopoverTrigger asChild>
                        <div
                          className="h-10 w-10 shrink-0 rounded border border-input cursor-pointer shadow-sm"
                          style={{ backgroundColor: field.value ?? "#000000" }}
                          aria-label={t("colorSchemeTitle")}
                        />
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
                        <ColorPicker
                          value={field.value ?? "#000000"}
                          onChange={(val) => {
                             field.onChange(val);
                             // Also update the text input value if needed, handled by form state
                          }}
                        />
                      </PopoverContent>
                    </Popover>
                  )}
                />
                
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label className="text-sm font-medium leading-none">{t(COLOR_LABEL_KEYS[key] as any)}</Label>
                  <Input
                    {...form.register(`colors.${key}`)}
                    placeholder={t("placeholderHex")}
                    className="h-8 font-mono text-xs"
                  />
                  <p className="text-[10px] text-muted-foreground truncate" title={t(COLOR_DESC_KEYS[key] as any)}>
                    {t(COLOR_DESC_KEYS[key] as any)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator />

          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("preview")}</Label>
            <div className="p-4 rounded-lg border bg-muted/30">
              <div className="flex flex-wrap gap-3">
                <Button
                  type="button"
                  style={{
                    backgroundColor: colors.primary ?? "#5B6EF5",
                    color: "#fff",
                  }}
                >
                  {t("primaryButton")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  style={{
                    borderColor: colors.primary ?? "#5B6EF5",
                    color: colors.primary ?? "#5B6EF5",
                  }}
                >
                  {t("outlineButton")}
                </Button>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.success ?? "#10B981" }} />
                  <span className="text-sm">{t("success")}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 rounded-md border">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: colors.error ?? "#EF4444" }} />
                  <span className="text-sm">{t("error")}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
