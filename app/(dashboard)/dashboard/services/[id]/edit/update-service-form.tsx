"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "@/lib/i18n";
import { toast } from "sonner";
import { z } from "zod";
import { updateService } from "@/lib/actions/service-actions";
import type { UpdateServiceInput } from "@/lib/validations/operations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { services } from "@/lib/db/schema";

type Service = typeof services.$inferSelect;

const getSchema = (nameRequired: string, priceRequired: string) =>
  z.object({
    name: z.string().min(1, nameRequired),
    description: z.string().optional().nullable(),
    price: z.string().min(1, priceRequired),
    duration: z.number().int().positive().optional().nullable(),
    departmentId: z.string().uuid().optional().nullable(),
  });

type FormData = z.infer<ReturnType<typeof getSchema>>;

interface UpdateServiceFormProps {
  service: Service;
  departments: { id: string; name: string }[];
  onSuccess?: () => void;
}

export function UpdateServiceForm({ service, departments: departmentsList, onSuccess }: UpdateServiceFormProps) {
  const t = useTranslations("services");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = getSchema(t("serviceNameRequired"), t("priceRequired"));
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: service.name,
      description: service.description ?? "",
      price: service.price ?? "",
      duration: service.duration ?? undefined,
      departmentId: service.departmentId ?? undefined,
    },
  });

  const departmentId = watch("departmentId");
  const departmentSelectValue = departmentId === null || departmentId === undefined ? "__none__" : departmentId;

  async function onSubmit(data: FormData) {
    setError(null);
    setIsSubmitting(true);
    try {
      const result = await updateService({
        serviceId: service.id,
        name: data.name,
        description: data.description ?? undefined,
        price: data.price,
        duration: data.duration ?? undefined,
        departmentId: data.departmentId === "" ? undefined : data.departmentId ?? undefined,
        maxBookingsPerDay: (service as { maxBookingsPerDay?: number | null }).maxBookingsPerDay ?? 20,
        followUpRequired: (service as { followUpRequired?: boolean | null }).followUpRequired ?? false,
        category: ((service as { category?: string | null }).category ?? undefined) as UpdateServiceInput["category"],
        prerequisites: (service as { prerequisites?: string | null }).prerequisites ?? undefined,
        specialInstructions: (service as { specialInstructions?: string | null }).specialInstructions ?? undefined,
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
        router.push("/dashboard/services");
      }
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">{t("serviceNameLabel")}</Label>
        <Input id="name" {...register("name")} placeholder={t("serviceNamePlaceholder")} />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="description">{t("descriptionLabel")}</Label>
        <textarea
          id="description"
          {...register("description")}
          placeholder={t("descriptionPlaceholder")}
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price">{t("priceLabel")}</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            {...register("price")}
            placeholder="0.00"
          />
          {errors.price && (
            <p className="text-sm text-destructive">{errors.price.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration">{t("durationMinutes")}</Label>
          <Input
            id="duration"
            type="number"
            {...register("duration", { valueAsNumber: true })}
            placeholder="30"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>{t("department")}</Label>
        <Select
          value={departmentSelectValue}
          onValueChange={(value) => setValue("departmentId", value === "__none__" ? null : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("selectDepartmentPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{t("none")}</SelectItem>
            {departmentsList.map((dept) => (
              <SelectItem key={dept.id} value={dept.id}>
                {dept.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
        {onSuccess && (
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
            disabled={isSubmitting}
          >
            {tCommon("cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
