"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  createTurnaroundTime,
  updateTurnaroundTime,
  getTestCategories,
} from "@/lib/actions/lab-test-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";

const DURATION_PRESETS: { label: string; display: string; minutes: number }[] = [
  { label: "< 30 minutes", display: "< 30 minutes", minutes: 30 },
  { label: "< 1 hour", display: "< 1 hour", minutes: 60 },
  { label: "1-2 hours", display: "1-2 hours", minutes: 120 },
  { label: "2-4 hours", display: "2-4 hours", minutes: 240 },
  { label: "4-6 hours", display: "4-6 hours", minutes: 360 },
  { label: "6-8 hours", display: "6-8 hours", minutes: 480 },
  { label: "8-12 hours", display: "8-12 hours", minutes: 600 },
  { label: "12-24 hours", display: "12-24 hours", minutes: 1440 },
  { label: "1-2 days", display: "1-2 days", minutes: 2160 },
  { label: "2-3 days", display: "2-3 days", minutes: 3600 },
  { label: "3-5 days", display: "3-5 days", minutes: 5760 },
  { label: "1-2 weeks", display: "1-2 weeks", minutes: 12096 },
];

function getTatSchema(
  nameReq: string,
  codeReq: string,
  priorityReq: string,
  descriptionReq: string,
  durationReq: string,
  durationDisplayReq: string,
  durationMinutesReq: string
) {
  return z.object({
    name: z.string().min(1, nameReq),
    code: z.string().min(1, codeReq),
    priority: z.string().min(1, priorityReq),
    categoryId: z.string().uuid().optional().nullable(),
    description: z.string().min(1, descriptionReq),
    duration: z.string().min(1, durationReq),
    durationDisplay: z.string().min(1, durationDisplayReq),
    durationMinutes: z.coerce.number().int().min(0, durationMinutesReq),
    slaCommitment: z.string().optional().nullable(),
    reportingHours: z.string().optional().nullable(),
    testExamples: z.string().optional().nullable(),
    businessRules: z.string().optional().nullable(),
    criticalNotes: z.string().optional().nullable(),
    escalationProcedure: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  });
}
type FormData = z.infer<ReturnType<typeof getTatSchema>>;

function generateCode(name: string): string {
  const prefix = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
  return `TAT-${prefix}01`;
}

export type TurnaroundTimeFormData = {
  id: string;
  name: string;
  code?: string | null;
  priority: string;
  categoryId: string | null;
  description?: string | null;
  duration: string;
  durationDisplay?: string | null;
  durationMinutes?: number | null;
  slaCommitment?: string | null;
  reportingHours?: string | null;
  testExamples?: string | null;
  businessRules?: string | null;
  criticalNotes?: string | null;
  escalationProcedure?: string | null;
  isActive: number;
};

export function TurnaroundTimeForm({
  time,
  onSuccess,
}: {
  time?: TurnaroundTimeFormData;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("testReports");
  const schema = useMemo(
    () =>
      getTatSchema(
        t("nameRequiredValidation"),
        t("codeRequiredValidation"),
        t("priorityRequiredValidation"),
        t("descriptionRequiredValidation"),
        t("durationRequiredValidation"),
        t("durationDisplayRequiredValidation"),
        t("durationMinutesRequiredValidation")
      ),
    [t]
  );
  const isEdit = !!time;
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: time?.name ?? "",
      code: time?.code ?? "",
      priority: time?.priority ?? "routine",
      categoryId: time?.categoryId ?? "none",
      description: time?.description ?? "",
      duration: time?.duration ?? "",
      durationDisplay: time?.durationDisplay ?? "",
      durationMinutes: time?.durationMinutes ?? 0,
      slaCommitment: time?.slaCommitment ?? "",
      reportingHours: time?.reportingHours ?? "",
      testExamples: time?.testExamples ?? "",
      businessRules: time?.businessRules ?? "",
      criticalNotes: time?.criticalNotes ?? "",
      escalationProcedure: time?.escalationProcedure ?? "",
      isActive: time ? time.isActive === 1 : true,
    },
  });

  const name = watch("name");
  const categoryId = watch("categoryId");
  const isActive = watch("isActive");

  const handleGenerateCode = useCallback(() => {
    const code = generateCode(name || "Turnaround");
    setValue("code", code);
  }, [name, setValue]);

  const applyPreset = useCallback((preset: (typeof DURATION_PRESETS)[0]) => {
    setValue("durationDisplay", preset.display);
    setValue("durationMinutes", preset.minutes);
    setValue("duration", preset.display);
  }, [setValue]);

  useEffect(() => {
    getTestCategories().then(setCategories);
  }, []);

  async function onSubmit(data: FormData) {
    const fn = isEdit ? updateTurnaroundTime : createTurnaroundTime;
    const catId = data.categoryId && data.categoryId !== "none" ? data.categoryId : null;
    const duration = data.duration || data.durationDisplay || String(data.durationMinutes);
    const input = isEdit
      ? { id: time!.id, ...data, duration, categoryId: catId }
      : { ...data, duration, categoryId: catId };
    const result = await fn(input as never);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? t("turnaroundTimeUpdated") : t("turnaroundTimeCreated"));
    onSuccess?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t("tatBasicInfo")}</h3>
        <div className="space-y-2">
          <Label htmlFor="name">{t("tatCategoryName")}</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder={t("tatCategoryNamePlaceholder")}
            className="h-11"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">{t("codeRequired")}</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              {...register("code")}
              placeholder={t("tatCodePlaceholder")}
              className="h-11 flex-1"
            />
            <Button type="button" variant="outline" onClick={handleGenerateCode}>
              {t("generate")}
            </Button>
          </div>
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("priority")} *</Label>
          <Select value={watch("priority")} onValueChange={(v) => setValue("priority", v)}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder={t("selectPriority")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stat">{t("stat")}</SelectItem>
              <SelectItem value="urgent">{t("urgent")}</SelectItem>
              <SelectItem value="routine">{t("routine")}</SelectItem>
            </SelectContent>
          </Select>
          {errors.priority && (
            <p className="text-sm text-destructive">{errors.priority.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("category")} *</Label>
          <Select
            value={categoryId || "none"}
            onValueChange={(v) => setValue("categoryId", v === "none" ? null : v)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder={t("selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("none")}</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t("descriptionRequired")}</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder={t("tatDescriptionPlaceholder")}
            rows={4}
            className="resize-none"
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Duration Settings */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t("durationSettings")}</h3>
        <div className="space-y-2">
          <Label htmlFor="durationDisplay">{t("durationDisplayRequired")}</Label>
          <Input
            id="durationDisplay"
            {...register("durationDisplay")}
            placeholder={t("durationDisplayPlaceholder")}
            className="h-11"
          />
          {errors.durationDisplay && (
            <p className="text-sm text-destructive">{errors.durationDisplay.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="durationMinutes">{t("durationMinutesRequired")}</Label>
          <Input
            id="durationMinutes"
            type="number"
            {...register("durationMinutes")}
            placeholder={t("durationMinutesPlaceholder")}
            className="h-11"
          />
          {errors.durationMinutes && (
            <p className="text-sm text-destructive">{errors.durationMinutes.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("quickDurationPresets")}</Label>
          <div className="flex flex-wrap gap-2">
            {DURATION_PRESETS.map((preset) => (
              <Button
                key={preset.label}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => applyPreset(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* SLA Commitment & Reporting Hours */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t("slaReporting")}</h3>
        <div className="space-y-2">
          <Label htmlFor="slaCommitment">{t("slaCommitment")}</Label>
          <Input
            id="slaCommitment"
            {...register("slaCommitment")}
            placeholder={t("slaCommitmentPlaceholder")}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="reportingHours">{t("reportingHours")}</Label>
          <Input
            id="reportingHours"
            {...register("reportingHours")}
            placeholder={t("reportingHoursPlaceholder")}
            className="h-11"
          />
        </div>
      </div>

      {/* Test Examples & Business Rules */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t("testExamplesSection")}</h3>
        <div className="space-y-2">
          <Label htmlFor="testExamples">{t("testExamples")}</Label>
          <Textarea
            id="testExamples"
            {...register("testExamples")}
            placeholder={t("testExamplesPlaceholder")}
            rows={3}
            className="resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="businessRules">{t("businessRules")}</Label>
          <Textarea
            id="businessRules"
            {...register("businessRules")}
            placeholder={t("businessRulesPlaceholder")}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Critical Handling */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t("criticalHandling")}</h3>
        <div className="space-y-2">
          <Label htmlFor="criticalNotes">{t("criticalNotes")}</Label>
          <Textarea
            id="criticalNotes"
            {...register("criticalNotes")}
            placeholder={t("criticalNotesPlaceholder")}
            rows={3}
            className="resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="escalationProcedure">{t("escalationProcedure")}</Label>
          <Textarea
            id="escalationProcedure"
            {...register("escalationProcedure")}
            placeholder={t("escalationProcedurePlaceholder")}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t("status")}</h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="tat-isActive"
            checked={isActive}
            onCheckedChange={(c) => setValue("isActive", !!c)}
          />
          <Label htmlFor="tat-isActive" className="text-sm font-normal cursor-pointer">
            {t("makeTatActive")}
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("saving") : isEdit ? t("updateTurnaroundTime") : t("createTurnaroundTime")}
      </Button>
    </form>
  );
}
