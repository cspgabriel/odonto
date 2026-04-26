"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { createTestCategory, updateTestCategory } from "@/lib/actions/lab-test-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getCategorySchema(nameReq: string) {
  return z.object({
    name: z.string().min(1, nameReq),
    departmentId: z.string().optional().nullable(),
    icon: z.string().optional().nullable(),
  });
}
type FormData = z.infer<ReturnType<typeof getCategorySchema>>;

export function CategoryForm({
  category,
  onSuccess,
}: {
  category?: { id: string; name: string; departmentId: string | null; icon: string | null };
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("testReports");
  const schema = useMemo(() => getCategorySchema(t("nameRequiredValidation")), [t]);
  const isEdit = !!category;

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: category?.name ?? "",
      departmentId: category?.departmentId ?? "",
      icon: category?.icon ?? "",
    },
  });

  async function onSubmit(data: FormData) {
    const fn = isEdit ? updateTestCategory : createTestCategory;
    const input = isEdit ? { id: category.id, ...data } : data;
    const result = await fn(input as never);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? t("categoryUpdated") : t("categoryCreated"));
    onSuccess?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">{t("categoryNameLabel")}</Label>
        <Input id="name" {...register("name")} placeholder={t("categoryNamePlaceholder")} className="h-11" />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="icon">{t("icon")}</Label>
        <Input id="icon" {...register("icon")} placeholder={t("iconPlaceholder")} className="h-11" />
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t("saving") : isEdit ? t("updateCategory") : t("createCategory")}
      </Button>
    </form>
  );
}
