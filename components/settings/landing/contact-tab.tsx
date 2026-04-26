"use client";

import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { LandingSettings } from "@/lib/validations/landing-settings";
import { Plus, Trash2 } from "lucide-react";

const DAYS = [
  "Monday - Friday",
  "Monday - Thursday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
  "Weekends",
];

const DAY_LABEL_KEYS = [
  "dayMondayFriday", "dayMondayThursday", "dayMonday", "dayTuesday", "dayWednesday",
  "dayThursday", "dayFriday", "daySaturday", "daySunday", "dayWeekends",
];

export function ContactTab() {
  const t = useTranslations("landingSettings");
  const form = useFormContext<LandingSettings>();
  const openingHours = form.watch("contact.openingHours") ?? [];

  const addOpeningHour = () => {
    const current = form.getValues("contact.openingHours") || [];
    form.setValue(
      "contact.openingHours",
      [...current, { day: "", time: "" }],
      { shouldDirty: true }
    );
  };

  const removeOpeningHour = (index: number) => {
    const current = form.getValues("contact.openingHours") || [];
    const next = current.filter((_: any, i: number) => i !== index);
    form.setValue("contact.openingHours", next, { shouldDirty: true });
  };

  const updateOpeningHour = (index: number, field: "day" | "time", value: string) => {
    const current = form.getValues("contact.openingHours") || [];
    const next = [...current];
    next[index] = { ...next[index], [field]: value };
    form.setValue("contact.openingHours", next, { shouldDirty: true });
  };

  return (
    <div className="space-y-4">


      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base">{t("contactDetailsTitle")}</CardTitle>
          <CardDescription>{t("contactDetailsDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("phoneNumber")}</Label>
              <Input {...form.register("contact.phone")} placeholder={t("phonePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("emailAddress")}</Label>
              <Input type="email" {...form.register("contact.email")} placeholder={t("emailPlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("whatsappNumber")}</Label>
              <Input {...form.register("contact.whatsappNumber")} placeholder={t("phonePlaceholder")} />
            </div>
            <div className="space-y-2">
              <Label>{t("emergencyContact")}</Label>
              <Input {...form.register("contact.emergencyContact")} placeholder={t("phonePlaceholder")} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("physicalAddress")}</Label>
            <Textarea {...form.register("contact.address")} placeholder={t("physicalAddressPlaceholder")} rows={2} />
          </div>
          <div className="space-y-2">
            <Label>{t("googleMapsUrl")}</Label>
            <Input type="url" {...form.register("contact.mapsUrl")} placeholder={t("mapsUrlPlaceholder")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base">{t("openingHoursTitle")}</CardTitle>
              <CardDescription>{t("openingHoursDescription")}</CardDescription>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addOpeningHour} className="h-8">
              <Plus className="h-4 w-4 mr-2" />
              {t("addSchedule")}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {openingHours.length === 0 && (
            <p className="text-sm text-muted-foreground italic py-2">{t("noOpeningHours")}</p>
          )}
          {openingHours.map((hour: { day?: string | null; time?: string | null }, index: number) => (
            <div key={index} className="flex gap-3 items-start">
              <div className="flex-1 space-y-1">
                <Select
                  value={hour.day ?? ""}
                  onValueChange={(val) => updateOpeningHour(index, "day", val)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder={t("selectDay")} />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((day, i) => (
                      <SelectItem key={day} value={day}>
                        {t(DAY_LABEL_KEYS[i] as any)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-[1.5] space-y-1">
                <Input
                  value={hour.time ?? ""}
                  onChange={(e) => updateOpeningHour(index, "time", e.target.value)}
                  placeholder={t("timePlaceholder")}
                  className="h-9"
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeOpeningHour(index)}
                className="h-9 w-9 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
