"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "@/lib/i18n";
import { toast } from "sonner";
import { z } from "zod";
import { updateDepartment } from "@/lib/actions/department-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { departments } from "@/lib/db/schema";

type Department = typeof departments.$inferSelect;

const getSchema = (nameRequired: string) =>
  z.object({
    name: z.string().min(1, nameRequired),
    description: z.string().optional().nullable(),
    location: z.string().optional().nullable(),
    budget: z.string().optional().nullable(),
  });

type FormData = z.infer<ReturnType<typeof getSchema>>;

export function UpdateDepartmentForm({
  department,
  onSuccess,
}: {
  department: Department;
  onSuccess?: () => void;
}) {
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = getSchema(t("nameRequired"));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: department.name,
      description: department.description ?? "",
      location: department.location ?? "",
      budget: department.budget ?? "",
    },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await updateDepartment({
        departmentId: department.id,
        name: data.name,
        description: data.description ?? undefined,
        location: data.location ?? undefined,
        budget: data.budget ?? undefined,
      });
      if (!result.success) {
        toast.error(result.error ?? t("failedToUpdate"));
        setError(result.error);
        return;
      }
      toast.success(t("updateSuccess"));
      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/dashboard/departments");
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("departmentName")}</Label>
        <Input id="name" {...register("name")} placeholder="e.g., Cardiology" />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <textarea
          id="description"
          {...register("description")}
          placeholder={t("descriptionPlaceholder")}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="location">{t("location")}</Label>
        <Input id="location" {...register("location")} placeholder={t("locationPlaceholder")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="budget">{t("tableBudget")}</Label>
        <Input
          id="budget"
          type="number"
          step="0.01"
          {...register("budget")}
          placeholder="0.00"
        />
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("saving") : t("saveChanges")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onSuccess ?? (() => router.back())}
          disabled={isSubmitting}
        >
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
