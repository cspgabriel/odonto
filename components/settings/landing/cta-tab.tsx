"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { LandingSettings } from "@/lib/validations/landing-settings";

const FORM_FIELD_KEYS = ["name", "email", "phone", "service", "message"] as const;
const FORM_FIELD_LABELS: Record<(typeof FORM_FIELD_KEYS)[number], string> = {
  name: "fieldName",
  email: "fieldEmail",
  phone: "fieldPhone",
  service: "fieldService",
  message: "fieldMessage",
};

export function CTATab() {
  const t = useTranslations("landingSettings");
  const form = useFormContext<LandingSettings>();
  const setCta = (field: string, value: unknown) => {
    form.setValue(`cta.${field}` as keyof LandingSettings, value as never, { shouldDirty: true });
  };

  return (
    <div className="space-y-4">


      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t("sectionCopyTitle")}</CardTitle>
          <CardDescription>
            {t("sectionCopyDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("ctaSectionTitle")}</Label>
              <Input
                {...form.register("cta.sectionTitle")}
                placeholder={t("ctaSectionTitlePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("ctaDescription")}</Label>
              <Textarea
                {...form.register("cta.description")}
                placeholder={t("ctaDescriptionPlaceholder")}
                rows={2}
                className="min-h-[40px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t("formConfigTitle")}</CardTitle>
          <CardDescription>
            {t("formConfigDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t("enabledFields")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 rounded-lg border p-4">
              {FORM_FIELD_KEYS.map((field) => (
                <div key={field} className="flex flex-col items-center gap-2">
                  <Switch
                    id={`field-${field}`}
                    checked={form.watch(`cta.formFields.${field}`) ?? false}
                    onCheckedChange={(checked) => {
                      const current = form.getValues("cta.formFields") ?? {};
                      form.setValue("cta.formFields", { ...current, [field]: checked }, { shouldDirty: true });
                    }}
                  />
                  <Label htmlFor={`field-${field}`} className="text-xs capitalize cursor-pointer">
                    {t(FORM_FIELD_LABELS[field] as any)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("submitButtonText")}</Label>
              <Input {...form.register("cta.submitButtonText")} placeholder={t("submitPlaceholder")} />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border">
              <div className="space-y-0.5">
                <Label className="text-base">{t("emailNotifications")}</Label>
                <p className="text-xs text-muted-foreground">{t("emailNotificationsDesc")}</p>
              </div>
              <Switch
                checked={form.watch("cta.emailNotifications") ?? false}
                onCheckedChange={(checked) => setCta("emailNotifications", checked)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("successMessage")}</Label>
              <Textarea
                {...form.register("cta.successMessage")}
                placeholder={t("successMessagePlaceholder")}
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("errorMessage")}</Label>
              <Textarea
                {...form.register("cta.errorMessage")}
                placeholder={t("errorMessagePlaceholder")}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
