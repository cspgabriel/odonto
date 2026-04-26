"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { LandingSettings } from "@/lib/validations/landing-settings";

const PLATFORM_KEYS: (keyof Omit<NonNullable<LandingSettings["social"]>, "enabled">)[] = [
  "facebook", "instagram", "twitter", "linkedin", "youtube", "tiktok",
];

const PLATFORM_LABEL_KEYS: Record<keyof Omit<NonNullable<LandingSettings["social"]>, "enabled">, string> = {
  facebook: "facebook",
  instagram: "instagram",
  twitter: "twitterX",
  linkedin: "linkedin",
  youtube: "youtube",
  tiktok: "tiktok",
};

export function SocialTab() {
  const t = useTranslations("landingSettings");
  const form = useFormContext<LandingSettings>();
  const social = form.watch("social") ?? {};
  const enabled = social.enabled ?? {};

  const setEnabled = (platform: string, value: boolean) => {
    form.setValue(
      "social.enabled",
      { ...enabled, [platform]: value },
      { shouldDirty: true }
    );
  };

  return (
    <div className="space-y-4">


      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t("platformsTitle")}</CardTitle>
          <CardDescription>
            {t("platformsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLATFORM_KEYS.map((key) => (
              <div key={key} className="flex gap-3 items-start p-3 rounded-lg border bg-card hover:bg-muted/10 transition-colors">
                <Switch
                  checked={enabled[key] ?? true}
                  onCheckedChange={(checked) => setEnabled(key, checked)}
                  className="mt-2 shrink-0"
                />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <Label className="text-sm font-medium">{t(PLATFORM_LABEL_KEYS[key] as any)}</Label>
                  <Input
                    type="url"
                    {...form.register(`social.${key}`)}
                    placeholder={t("socialUrlPlaceholder").replace("{platform}", key)}
                    disabled={!(enabled[key] ?? true)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
