"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import {
  createSampleType,
  updateSampleType,
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

const COLLECTION_METHODS = [
  "Venipuncture",
  "Fingerstick",
  "Arterial puncture",
  "Urine collection",
  "Sputum collection",
  "Stool collection",
  "Swab",
  "Other",
];

const CONTAINER_TYPES = [
  "Vacutainer (EDTA)",
  "Vacutainer (Heparin)",
  "Vacutainer (Serum)",
  "Vacutainer (Plasma)",
  "Urine cup",
  "Sterile container",
  "Syringe",
  "Blood culture bottle",
  "Other",
];

const STORAGE_TEMPERATURES = [
  "Room temperature (15-25°C)",
  "Refrigerated (2-8°C)",
  "Frozen (-20°C)",
  "Deep frozen (-80°C)",
  "Dry ice",
  "Other",
];

function getSampleTypeSchema(
  nameReq: string,
  codeReq: string,
  descriptionReq: string,
  collectionMethodReq: string
) {
  return z.object({
    name: z.string().min(1, nameReq),
    code: z.string().min(1, codeReq),
    categoryId: z.string().uuid().optional().nullable(),
    description: z.string().min(1, descriptionReq),
    collectionMethod: z.string().min(1, collectionMethodReq),
    volumeRequired: z.string().optional().nullable(),
    containerType: z.string().optional().nullable(),
    preservativeAnticoagulant: z.string().optional().nullable(),
    specialCollectionInstructions: z.string().optional().nullable(),
    storageTemperature: z.string().optional().nullable(),
    storageTimeStability: z.string().optional().nullable(),
    processingTime: z.string().optional().nullable(),
    transportConditions: z.string().optional().nullable(),
    handlingRequirements: z.string().optional().nullable(),
    rejectionCriteria: z.string().optional().nullable(),
    safetyPrecautions: z.string().optional().nullable(),
    commonTests: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
  });
}
type FormData = z.infer<ReturnType<typeof getSampleTypeSchema>>;

function generateCode(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 8) || "ST";
}

export type SampleTypeFormData = {
  id: string;
  name: string;
  code?: string | null;
  categoryId: string | null;
  description?: string | null;
  collectionMethod?: string | null;
  volumeRequired?: string | null;
  containerType?: string | null;
  preservativeAnticoagulant?: string | null;
  specialCollectionInstructions?: string | null;
  storageTemperature?: string | null;
  storageTimeStability?: string | null;
  processingTime?: string | null;
  transportConditions?: string | null;
  handlingRequirements?: string | null;
  rejectionCriteria?: string | null;
  safetyPrecautions?: string | null;
  commonTests?: string | null;
  isActive: number;
};

export function SampleTypeForm({
  sampleType,
  onSuccess,
}: {
  sampleType?: SampleTypeFormData;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("testReports");
  const schema = useMemo(
    () =>
      getSampleTypeSchema(
        t("nameRequiredValidation"),
        t("codeRequiredValidation"),
        t("descriptionRequiredValidation"),
        t("collectionMethodRequired")
      ),
    [t]
  );
  const isEdit = !!sampleType;
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: sampleType?.name ?? "",
      code: sampleType?.code ?? "",
      categoryId: sampleType?.categoryId ?? "none",
      description: sampleType?.description ?? "",
      collectionMethod: sampleType?.collectionMethod ?? "",
      volumeRequired: sampleType?.volumeRequired ?? "",
      containerType: sampleType?.containerType ?? "",
      preservativeAnticoagulant: sampleType?.preservativeAnticoagulant ?? "",
      specialCollectionInstructions: sampleType?.specialCollectionInstructions ?? "",
      storageTemperature: sampleType?.storageTemperature ?? "",
      storageTimeStability: sampleType?.storageTimeStability ?? "",
      processingTime: sampleType?.processingTime ?? "",
      transportConditions: sampleType?.transportConditions ?? "",
      handlingRequirements: sampleType?.handlingRequirements ?? "",
      rejectionCriteria: sampleType?.rejectionCriteria ?? "",
      safetyPrecautions: sampleType?.safetyPrecautions ?? "",
      commonTests: sampleType?.commonTests ?? "",
      isActive: sampleType ? sampleType.isActive === 1 : true,
    },
  });

  const name = watch("name");
  const categoryId = watch("categoryId");
  const isActive = watch("isActive");

  const handleGenerateCode = useCallback(() => {
    const code = generateCode(name || "Sample");
    setValue("code", code);
  }, [name, setValue]);

  useEffect(() => {
    getTestCategories().then(setCategories);
  }, []);

  async function onSubmit(data: FormData) {
    const fn = isEdit ? updateSampleType : createSampleType;
    const catId = data.categoryId && data.categoryId !== "none" ? data.categoryId : null;
    const input = isEdit
      ? { id: sampleType!.id, ...data, categoryId: catId }
      : { ...data, categoryId: catId };
    const result = await fn(input as never);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? t("sampleTypeUpdated") : t("sampleTypeCreated"));
    onSuccess?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">{t("sampleTypeBasicInfo")}</h3>
        <div className="space-y-2">
          <Label htmlFor="name">Sample Type Name *</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., Whole Blood"
            className="h-11"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code *</Label>
          <div className="flex gap-2">
            <Input
              id="code"
              {...register("code")}
              placeholder="e.g., WB"
              className="h-11 flex-1"
            />
            <Button type="button" variant="outline" onClick={handleGenerateCode}>
              Generate
            </Button>
          </div>
          {errors.code && (
            <p className="text-sm text-destructive">{errors.code.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select
            value={categoryId || "none"}
            onValueChange={(v) => setValue("categoryId", v === "none" ? null : v)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Detailed description of the sample type..."
            rows={4}
            className="resize-none"
          />
          {errors.description && (
            <p className="text-sm text-destructive">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Collection Specifications */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Collection Specifications</h3>
        <div className="space-y-2">
          <Label>Collection Method *</Label>
          <Select
            value={watch("collectionMethod")}
            onValueChange={(v) => setValue("collectionMethod", v)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {COLLECTION_METHODS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.collectionMethod && (
            <p className="text-sm text-destructive">{errors.collectionMethod.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="volumeRequired">Volume Required</Label>
          <Input
            id="volumeRequired"
            {...register("volumeRequired")}
            placeholder="e.g., 3-5 mL"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label>Container Type</Label>
          <Select
            value={watch("containerType") || "none"}
            onValueChange={(v) => setValue("containerType", v === "none" ? "" : v)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select container" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {CONTAINER_TYPES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="preservativeAnticoagulant">Preservative/Anticoagulant</Label>
          <Input
            id="preservativeAnticoagulant"
            {...register("preservativeAnticoagulant")}
            placeholder="e.g., EDTA, Heparin, None"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialCollectionInstructions">Special Collection Instructions</Label>
          <Textarea
            id="specialCollectionInstructions"
            {...register("specialCollectionInstructions")}
            placeholder="Any special instructions for collection..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Storage & Handling */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Storage & Handling</h3>
        <div className="space-y-2">
          <Label>Storage Temperature</Label>
          <Select
            value={watch("storageTemperature") || "none"}
            onValueChange={(v) => setValue("storageTemperature", v === "none" ? "" : v)}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select temperature" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {STORAGE_TEMPERATURES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="storageTimeStability">Storage Time/Stability</Label>
          <Input
            id="storageTimeStability"
            {...register("storageTimeStability")}
            placeholder="e.g., 24 hours, 7 days"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="processingTime">Processing Time</Label>
          <Input
            id="processingTime"
            {...register("processingTime")}
            placeholder="e.g., Process within 2 hours"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="transportConditions">Transport Conditions</Label>
          <Input
            id="transportConditions"
            {...register("transportConditions")}
            placeholder="e.g., Room temperature, Ice"
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="handlingRequirements">Handling Requirements</Label>
          <Textarea
            id="handlingRequirements"
            {...register("handlingRequirements")}
            placeholder="Special handling requirements and precautions..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Quality & Safety */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Quality & Safety</h3>
        <div className="space-y-2">
          <Label htmlFor="rejectionCriteria">Rejection Criteria</Label>
          <Textarea
            id="rejectionCriteria"
            {...register("rejectionCriteria")}
            placeholder="Conditions under which the sample should be rejected..."
            rows={3}
            className="resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="safetyPrecautions">Safety Precautions</Label>
          <Textarea
            id="safetyPrecautions"
            {...register("safetyPrecautions")}
            placeholder="Safety measures and precautions for handling..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Test Applications */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Test Applications</h3>
        <div className="space-y-2">
          <Label htmlFor="commonTests">Common Tests</Label>
          <Textarea
            id="commonTests"
            {...register("commonTests")}
            placeholder="List common tests performed on this sample type (separate with commas)..."
            rows={3}
            className="resize-none"
          />
        </div>
      </div>

      {/* Status */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold">Status</h3>
        <div className="flex items-center gap-2">
          <Checkbox
            id="st-isActive"
            checked={isActive}
            onCheckedChange={(c) => setValue("isActive", !!c)}
          />
          <Label htmlFor="st-isActive" className="text-sm font-normal cursor-pointer">
            {t("makeSampleTypeActive")}
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("saving") : isEdit ? t("updateSampleType") : t("createSampleType")}
      </Button>
    </form>
  );
}
