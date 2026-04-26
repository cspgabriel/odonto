"use client";

import { useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ImageUploadField } from "./image-upload-field";
import type { LandingSettings } from "@/lib/validations/landing-settings";
import { Image as ImageIcon } from "lucide-react";

export function BrandingTab() {
  const t = useTranslations("landingSettings");
  const form = useFormContext<LandingSettings>();
  const branding = form.watch("branding") ?? {};

  const setBranding = (field: keyof NonNullable<LandingSettings["branding"]>, value: string | null) => {
    form.setValue(`branding.${field}`, value, { shouldDirty: true });
  };

  return (
    <div className="space-y-4">
      {/* Brand Name */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t("brandName")}</CardTitle>
          <CardDescription>{t("brandNameDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={branding.brandName ?? ""}
            onChange={(e) => setBranding("brandName", e.target.value || null)}
            placeholder={t("brandNamePlaceholder")}
            className="max-w-sm"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" />
            {t("logoIdentity")}
          </CardTitle>
          <CardDescription>
            {t("logoIdentityDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("primaryLogoLight")}</Label>
              <ImageUploadField
                label=""
                currentImageUrl={branding.primaryLogoUrl ?? undefined}
                onImageUploaded={(url) => setBranding("primaryLogoUrl", url || null)}
                assetType="logo-primary"
                recommendedSize="300×60px"
                maxSizeMB={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("darkLogoDarkMode")}</Label>
              <ImageUploadField
                label=""
                currentImageUrl={branding.darkLogoUrl ?? undefined}
                onImageUploaded={(url) => setBranding("darkLogoUrl", url || null)}
                assetType="logo-dark"
                recommendedSize="300×60px"
                maxSizeMB={2}
              />
            </div>
          </div>
          <div className="space-y-2 max-w-xs">
            <Label>{t("favicon")}</Label>
            <p className="text-xs text-muted-foreground">{t("faviconDescription")}</p>
            <ImageUploadField
              label=""
              currentImageUrl={branding.faviconUrl ?? undefined}
              onImageUploaded={(url) => setBranding("faviconUrl", url || null)}
              assetType="favicon"
              recommendedSize="16×16 or 32×32px"
              maxSizeMB={0.5}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
