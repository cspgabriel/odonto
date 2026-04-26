"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageUploadField } from "./image-upload-field";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { LandingSettings } from "@/lib/validations/landing-settings";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function SEOTab() {
  const t = useTranslations("landingSettings");
  const form = useFormContext<LandingSettings>();
  const metaTitle = form.watch("seo.metaTitle") ?? "";
  const metaDescription = form.watch("seo.metaDescription") ?? "";
  const setSeo = (field: string, value: unknown) => {
    form.setValue(`seo.${field}` as keyof LandingSettings, value as never, { shouldDirty: true });
  };

  return (
    <div className="space-y-4">


      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Meta Tags</CardTitle>
          <CardDescription>
            Shown in search results. Keep title under 60 and description under 160 characters.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Meta Title</Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  metaTitle.length > 60 ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {metaTitle.length}/60
              </span>
            </div>
            <Input
              {...form.register("seo.metaTitle")}
              maxLength={60}
              placeholder={t("metaTitlePlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <Label>{t("metaDescription")}</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        {t("metaDescriptionTooltip")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span
                className={cn(
                  "text-xs tabular-nums shrink-0",
                  metaDescription.length > 160 ? "text-destructive" : "text-muted-foreground"
                )}
              >
                {metaDescription.length}/160
              </span>
            </div>
            <Textarea
              {...form.register("seo.metaDescription")}
              maxLength={160}
              rows={2}
              placeholder={t("metaDescriptionPlaceholder")}
            />
          </div>

          <div className="space-y-2">
            <Label>{t("metaKeywords")}</Label>
            <Input
              {...form.register("seo.metaKeywords")}
              placeholder={t("metaKeywordsPlaceholder")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t("ogSocialTitle")}</CardTitle>
          <CardDescription>
            {t("ogSocialDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageUploadField
            label={t("ogImageLabel")}
            currentImageUrl={form.watch("seo.ogImageUrl") ?? undefined}
            onImageUploaded={(url) => setSeo("ogImageUrl", url || null)}
            assetType="og-image"
            recommendedSize="1200×630px"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("ogTitle")}</Label>
              <Input {...form.register("seo.ogTitle")} placeholder={t("ogTitlePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("twitterCardType")}</Label>
              <Select
                value={form.watch("seo.twitterCardType") ?? "summary_large_image"}
                onValueChange={(v) => setSeo("twitterCardType", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">{t("summary")}</SelectItem>
                  <SelectItem value="summary_large_image">{t("summaryLargeImage")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("ogDescription")}</Label>
            <Textarea {...form.register("seo.ogDescription")} rows={2} placeholder={t("ogDescriptionPlaceholder")} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("canonicalUrl")}</Label>
              <Input
                type="url"
                {...form.register("seo.canonicalUrl")}
                placeholder={t("canonicalUrlPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("robots")}</Label>
              <Select
                value={form.watch("seo.robots") ?? "index"}
                onValueChange={(v) => setSeo("robots", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="index">{t("index")}</SelectItem>
                  <SelectItem value="noindex">{t("noindex")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
