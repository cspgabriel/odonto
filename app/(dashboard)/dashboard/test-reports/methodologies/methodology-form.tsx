"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  createTestMethodology,
  updateTestMethodology,
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
import { useEffect, useState, useCallback } from "react";

function getSchema(
  nameReq: string,
  codeReq: string,
  selectCategory: string,
  descriptionReq: string,
  principlesReq: string
) {
  return z.object({
    name: z.string().min(1, nameReq),
    code: z.string().min(1, codeReq),
    categoryId: z.string().uuid(selectCategory).optional().nullable(),
    description: z.string().min(1, descriptionReq),
    principles: z.string().min(1, principlesReq),
    equipment: z.string().optional().nullable(),
    applications: z.string().optional().nullable(),
    advantages: z.string().optional().nullable(),
    limitations: z.string().optional().nullable(),
    sampleVolume: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  });
}
type FormData = z.infer<ReturnType<typeof getSchema>>;

function generateCode(name: string): string {
  const prefix = name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 4);
  const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${suffix}`;
}

export type MethodologyFormData = {
  id: string;
  name: string;
  code?: string | null;
  categoryId: string | null;
  description?: string | null;
  principles?: string | null;
  equipment: string | null;
  applications?: string | null;
  advantages?: string | null;
  limitations?: string | null;
  sampleVolume: string | null;
  isActive: number;
};

export function MethodologyForm({
  methodology,
  onSuccess,
}: {
  methodology?: MethodologyFormData;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("testReports");
  const schema = useMemo(
    () =>
      getSchema(
        t("nameRequiredValidation"),
        t("codeRequiredValidation"),
        t("selectCategory"),
        t("descriptionRequiredValidation"),
        t("principlesRequiredValidation")
      ),
    [t]
  );
  const isEdit = !!methodology;
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: methodology?.name ?? "",
      code: methodology?.code ?? "",
      categoryId: methodology?.categoryId ?? "none",
      description: methodology?.description ?? "",
      principles: methodology?.principles ?? "",
      equipment: methodology?.equipment ?? "",
      applications: methodology?.applications ?? "",
      advantages: methodology?.advantages ?? "",
      limitations: methodology?.limitations ?? "",
      sampleVolume: methodology?.sampleVolume ?? "",
      isActive: methodology ? methodology.isActive === 1 : true,
    },
  });

  const name = watch("name");
  const categoryId = watch("categoryId");
  const isActive = watch("isActive");

  const handleGenerateCode = useCallback(() => {
    const code = generateCode(name || "Methodology");
    setValue("code", code);
  }, [name, setValue]);

  useEffect(() => {
    getTestCategories().then(setCategories);
  }, []);

  async function onSubmit(data: FormData) {
    const fn = isEdit ? updateTestMethodology : createTestMethodology;
    const categoryId = data.categoryId && data.categoryId !== "none" ? data.categoryId : null;
    const input = isEdit
      ? { id: methodology!.id, ...data, categoryId }
      : { ...data, categoryId };
    const result = await fn(input as never);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? t("methodologyUpdated") : t("methodologyCreated"));
    onSuccess?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t("methodologyBasicInfo")}</h3>
        <div className="space-y-2">
          <Label htmlFor="name">{t("methodologyNameRequired")}</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder={t("methodologyNamePlaceholder")}
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
              placeholder={t("codePlaceholder")}
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
          {errors.categoryId && (
            <p className="text-sm text-destructive">{errors.categoryId.message}</p>
          )}
        </div>
<div className="space-y-2">
            <Label htmlFor="description">{t("descriptionRequired")}</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder={t("methodologyDescriptionPlaceholder")}
              rows={4}
              className="resize-none"
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>
      </div>

      {/* Technical Specifications */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t("technicalSpecs")}</h3>
        <div className="space-y-2">
          <Label htmlFor="principles">{t("principlesRequired")}</Label>
          <Textarea
            id="principles"
            {...register("principles")}
            placeholder={t("principlesPlaceholder")}
            rows={4}
            className="resize-none"
          />
          {errors.principles && (
            <p className="text-sm text-destructive">{errors.principles.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="equipment">{t("equipmentRequired")}</Label>
          <Textarea
            id="equipment"
            {...register("equipment")}
            placeholder={t("equipmentPlaceholder")}
            rows={2}
            className="resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="applications">{t("applications")}</Label>
          <Textarea
            id="applications"
            {...register("applications")}
            placeholder={t("applicationsPlaceholder")}
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Advantages & Limitations */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t("advantagesLimitations")}</h3>
        <div className="space-y-2">
          <Label htmlFor="advantages">{t("advantages")}</Label>
          <Textarea
            id="advantages"
            {...register("advantages")}
            placeholder={t("advantagesPlaceholder")}
            rows={3}
            className="resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="limitations">{t("limitations")}</Label>
          <Textarea
            id="limitations"
            {...register("limitations")}
            placeholder={t("limitationsPlaceholder")}
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
            id="isActive"
            checked={isActive}
            onCheckedChange={(c) => setValue("isActive", !!c)}
          />
          <Label
            htmlFor="isActive"
            className="text-sm font-normal cursor-pointer"
          >
            {t("makeMethodologyActive")}
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("saving") : isEdit ? t("updateMethodology") : t("createMethodology")}
      </Button>
    </form>
  );
}
