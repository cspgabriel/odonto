"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LandingSettings } from "@/lib/validations/landing-settings";

const FONTS = ["Inter", "Outfit", "Poppins", "Roboto", "Open Sans"];

export function TypographyTab() {
  const t = useTranslations("landingSettings");
  const form = useFormContext<LandingSettings>();
  const setTypography = (field: string, value: string) => {
    form.setValue(`typography.${field}` as keyof LandingSettings, value as never, { shouldDirty: true });
  };

  return (
    <div className="space-y-4">


      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t("fontsSizingTitle")}</CardTitle>
          <CardDescription>
            {t("fontsSizingDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("headingFont")}</Label>
            <Select
              value={form.watch("typography.headingFont") ?? "Inter"}
              onValueChange={(v) => setTypography("headingFont", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("bodyFont")}</Label>
            <Select
              value={form.watch("typography.bodyFont") ?? "Inter"}
              onValueChange={(v) => setTypography("bodyFont", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((font) => (
                  <SelectItem key={font} value={font}>
                    {font}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("fontScale")}</Label>
            <Select
              value={form.watch("typography.fontSize") ?? "medium"}
              onValueChange={(v) => setTypography("fontSize", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">{t("fontScaleSmall")}</SelectItem>
                <SelectItem value="medium">{t("fontScaleMedium")}</SelectItem>
                <SelectItem value="large">{t("fontScaleLarge")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("lineHeight")}</Label>
            <Select
              value={form.watch("typography.lineHeight") ?? "normal"}
              onValueChange={(v) => setTypography("lineHeight", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tight">{t("lineHeightTight")}</SelectItem>
                <SelectItem value="normal">{t("lineHeightNormal")}</SelectItem>
                <SelectItem value="relaxed">{t("lineHeightRelaxed")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
