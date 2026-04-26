"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  createLaboratoryTest,
  updateLaboratoryTest,
  getTestCategories,
  getSampleTypes,
  getTestMethodologies,
  getTurnaroundTimes,
} from "@/lib/actions/lab-test-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useState, useCallback } from "react";

function getSchema(nameRequired: string, testCodeRequired: string) {
  return z.object({
    name: z.string().min(1, nameRequired),
    testCode: z.string().min(1, testCodeRequired),
    description: z.string().optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    sampleTypeId: z.string().uuid().optional().nullable(),
    methodologyId: z.string().uuid().optional().nullable(),
    turnaroundTimeId: z.string().uuid().optional().nullable(),
    normalRange: z.string().optional().nullable(),
    units: z.string().optional().nullable(),
    price: z.string().optional().nullable(),
  });
}
type FormData = z.infer<ReturnType<typeof getSchema>>;

type LabOptions = {
  categories: { id: string; name: string }[];
  sampleTypes: { id: string; name: string }[];
  methodologies: { id: string; name: string }[];
  turnaroundTimes: { id: string; name: string }[];
};

function generateTestCode(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 8) || "TEST";
}

export function TestForm({
  test,
  labOptions,
  onSuccess,
}: {
  test?: {
    id: string;
    name: string;
    testCode?: string | null;
    description: string | null;
    categoryId: string | null;
    sampleTypeId: string | null;
    methodologyId: string | null;
    turnaroundTimeId: string | null;
    normalRange?: string | null;
    units?: string | null;
    price: string | null;
  };
  labOptions?: LabOptions;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("testReports");
  const schema = useMemo(
    () => getSchema(t("nameRequiredValidation"), t("testCodeRequiredValidation")),
    [t]
  );
  const isEdit = !!test;
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(labOptions?.categories ?? []);
  const [sampleTypesList, setSampleTypesList] = useState<{ id: string; name: string }[]>(labOptions?.sampleTypes ?? []);
  const [methodologies, setMethodologies] = useState<{ id: string; name: string }[]>(labOptions?.methodologies ?? []);
  const [turnaroundTimesList, setTurnaroundTimesList] = useState<{ id: string; name: string }[]>(labOptions?.turnaroundTimes ?? []);

  useEffect(() => {
    if (labOptions) {
      setCategories(labOptions.categories);
      setSampleTypesList(labOptions.sampleTypes);
      setMethodologies(labOptions.methodologies);
      setTurnaroundTimesList(labOptions.turnaroundTimes);
      return;
    }
    Promise.all([
      getTestCategories(),
      getSampleTypes(),
      getTestMethodologies(),
      getTurnaroundTimes(),
    ]).then(([cat, st, meth, tt]) => {
      setCategories(cat);
      setSampleTypesList(st);
      setMethodologies(meth);
      setTurnaroundTimesList(tt);
    });
  }, [labOptions]);

  const { register, handleSubmit, formState: { errors, isSubmitting }, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: test?.name ?? "",
      testCode: test?.testCode ?? "",
      description: test?.description ?? "",
      categoryId: test?.categoryId ?? null,
      sampleTypeId: test?.sampleTypeId ?? null,
      methodologyId: test?.methodologyId ?? null,
      turnaroundTimeId: test?.turnaroundTimeId ?? null,
      normalRange: test?.normalRange ?? "",
      units: test?.units ?? "",
      price: test?.price ?? "",
    },
  });

  const name = watch("name");
  const handleGenerateCode = useCallback(() => {
    setValue("testCode", generateTestCode(name || ""));
  }, [name, setValue]);

  const categoryId = watch("categoryId");
  const sampleTypeId = watch("sampleTypeId");
  const methodologyId = watch("methodologyId");
  const turnaroundTimeId = watch("turnaroundTimeId");

  async function onSubmit(data: FormData) {
    const payload = {
      ...data,
      categoryId: data.categoryId || null,
      sampleTypeId: data.sampleTypeId || null,
      methodologyId: data.methodologyId || null,
      turnaroundTimeId: data.turnaroundTimeId || null,
      normalRange: data.normalRange || null,
      units: data.units || null,
      price: data.price || null,
      testCode: data.testCode || generateTestCode(data.name),
    };
    const fn = isEdit ? updateLaboratoryTest : createLaboratoryTest;
    const input = isEdit ? { id: test.id, ...payload } : payload;
    const result = await fn(input as never);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? t("testUpdated") : t("testCreated"));
    onSuccess?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t("basicTestInfo")}</h3>
        <div className="space-y-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="space-y-2">
            <Label htmlFor="name">{t("testNameRequired")}</Label>
            <Input id="name" {...register("name")} placeholder={t("testNamePlaceholder")} className="h-11" />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="testCode">{t("testCodeRequired")}</Label>
            <div className="flex gap-2">
              <Input id="testCode" {...register("testCode")} placeholder={t("testCodePlaceholder")} className="h-11 flex-1" />
              <Button type="button" variant="outline" onClick={handleGenerateCode} className="h-11 shrink-0">
                {t("generate")}
              </Button>
            </div>
            {errors.testCode && <p className="text-sm text-destructive">{errors.testCode.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t("category")} *</Label>
            <Select value={categoryId ?? "none"} onValueChange={(v) => setValue("categoryId", v === "none" ? null : v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t("selectTestCategory")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("none")}</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("turnaroundTime")} *</Label>
            <Select value={turnaroundTimeId ?? "none"} onValueChange={(v) => setValue("turnaroundTimeId", v === "none" ? null : v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t("selectTurnaroundTime")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("none")}</SelectItem>
                {turnaroundTimesList.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">{t("descriptionLabel")}</Label>
            <Textarea id="description" {...register("description")} placeholder={t("descriptionPlaceholder")} className="min-h-[80px]" />
          </div>
          <div className="space-y-2">
            <Label>{t("sampleType")}</Label>
            <Select value={sampleTypeId ?? "none"} onValueChange={(v) => setValue("sampleTypeId", v === "none" ? null : v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t("selectSampleType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("none")}</SelectItem>
                {sampleTypesList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("methodology")}</Label>
            <Select value={methodologyId ?? "none"} onValueChange={(v) => setValue("methodologyId", v === "none" ? null : v)}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder={t("selectMethodology")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("none")}</SelectItem>
                {methodologies.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="normalRange">{t("normalRange")}</Label>
            <Input id="normalRange" {...register("normalRange")} placeholder={t("normalRangePlaceholder")} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="units">{t("units")}</Label>
            <Input id="units" {...register("units")} placeholder={t("unitsPlaceholder")} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">{t("priceLabel")}</Label>
            <Input id="price" {...register("price")} placeholder={t("pricePlaceholder")} className="h-11" />
          </div>
        </div>
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("saving") : isEdit ? t("updateTest") : t("createTest")}
      </Button>
    </form>
  );
}
