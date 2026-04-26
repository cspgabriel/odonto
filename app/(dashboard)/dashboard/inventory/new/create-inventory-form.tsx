"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "@/lib/i18n";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { z } from "zod";
import { createInventoryItem } from "@/lib/actions/inventory-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const getSchema = (nameRequired: string, quantityMin: string, unitRequired: string, minStockMin: string) =>
  z.object({
    name: z.string().min(1, nameRequired),
    category: z.string().optional(),
    description: z.string().optional(),
    manufacturer: z.string().optional(),
    batchNumber: z.string().optional(),
    quantity: z.coerce.number().int().min(0, quantityMin),
    unit: z.string().min(1, unitRequired),
    minStock: z.coerce.number().int().min(0, minStockMin),
    price: z.string().optional(),
    supplierId: z.string().uuid().optional().nullable(),
    expiryDate: z.string().optional(),
  });

type FormData = z.infer<ReturnType<typeof getSchema>>;

function generateBatchNumber(): string {
  const year = new Date().getFullYear();
  const r = Math.floor(1000 + Math.random() * 9000);
  return `PH${year}${r}`;
}

interface CreateInventoryFormProps {
  vendors: { id: string; name: string }[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateInventoryForm({ vendors, onSuccess, onCancel }: CreateInventoryFormProps) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const schema = getSchema(t("nameRequired"), t("quantityMin"), t("unitRequired"), t("minStockMin"));
  const categories = [
    { value: "equipment", label: t("categoryEquipment") },
    { value: "consumables", label: t("categoryConsumables") },
    { value: "medications", label: t("categoryMedications") },
    { value: "Medical Supplies", label: t("categoryMedicalSupplies") },
    { value: "Dental Supplies", label: t("categoryDentalSupplies") },
    { value: "Equipment & Other", label: t("categoryEquipmentOther") },
  ];
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      manufacturer: "",
      batchNumber: "",
      quantity: 0,
      unit: "unit",
      minStock: 20,
      price: "",
      supplierId: null,
      expiryDate: "",
    },
  });

  const expiryDate = watch("expiryDate");
  const expiryWarning =
    expiryDate &&
    (() => {
      try {
        const d = new Date(expiryDate);
        if (isNaN(d.getTime())) return false;
        return differenceInDays(d, new Date()) <= 30;
      } catch {
        return false;
      }
    })();

  async function onSubmit(data: FormData) {
    setError(null);
    const result = await createInventoryItem({
      name: data.name,
      category: data.category || undefined,
      description: data.description || undefined,
      manufacturer: data.manufacturer || undefined,
      batchNumber: data.batchNumber || undefined,
      stockQuantity: data.quantity,
      reorderLevel: data.minStock,
      unit: data.unit,
      costPerUnit: data.price || undefined,
      supplierId: data.supplierId ?? undefined,
      expiryDate: data.expiryDate || undefined,
      status: "active",
    });
    if (!result.success) {
      toast.error(result.error ?? t("failedToCreate"));
      setError(result.error);
      return;
    }
    toast.success(t("createSuccess"));
    if (onSuccess) {
      onSuccess();
    } else {
      router.push("/dashboard/inventory");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Section 1 — Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
          {t("basicInformation")}
        </h3>
        <div className="space-y-2">
          <Label htmlFor="name">{t("itemName")}</Label>
          <Input
            id="name"
            {...register("name")}
            placeholder="e.g., Gloves (box)"
          />
          {errors.name && (
            <p className="text-sm text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("tableCategory")}</Label>
          <Select
            value={watch("category") ?? ""}
            onValueChange={(v) => setValue("category", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectCategory")} />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </div>

      {/* Section 2 — Manufacturer & Supplier */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
          {t("manufacturerAndSupplier")}
        </h3>
        <div className="space-y-2">
          <Label htmlFor="manufacturer">{t("manufacturer")}</Label>
          <Input
            id="manufacturer"
            {...register("manufacturer")}
            placeholder="e.g., PharmaCorp"
          />
        </div>
        <div className="space-y-2">
          <Label>{t("supplier")}</Label>
          <Select
            value={watch("supplierId") ?? "__none__"}
            onValueChange={(v) => setValue("supplierId", v === "__none__" ? null : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectSupplier")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">{t("none")}</SelectItem>
              {vendors.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="batchNumber">{t("batch")}</Label>
          <div className="flex gap-2">
            <Input
              id="batchNumber"
              {...register("batchNumber")}
              placeholder="e.g., PH20251234"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => setValue("batchNumber", generateBatchNumber())}
            >
              {t("generate")}
            </Button>
          </div>
        </div>
      </div>

      {/* Section 3 — Stock & Pricing */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
          {t("stockAndPricing")}
        </h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="quantity">{t("quantityRequired")}</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              {...register("quantity")}
            />
            {errors.quantity && (
              <p className="text-sm text-destructive">
                {errors.quantity.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">{t("unitPriceUsd")}</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price")}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minStock">{t("lowStockAlert")}</Label>
            <Input
              id="minStock"
              type="number"
              min={0}
              {...register("minStock")}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="unit">{t("unitLabel")}</Label>
          <Input
            id="unit"
            {...register("unit")}
            placeholder={t("unitPlaceholder")}
          />
        </div>
      </div>

      {/* Section 4 — Expiry */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white border-b border-slate-200/60 dark:border-slate-800/60 pb-2">
          {t("expiryInformation")}
        </h3>
        <div className="space-y-2">
          <Label>{t("expiryDate")}</Label>
          <DatePicker
            date={
              expiryDate?.trim()
                ? new Date(expiryDate)
                : undefined
            }
            onSelect={(d) =>
              setValue("expiryDate", d ? format(d, "yyyy-MM-dd") : "")
            }
            placeholder={t("pickExpiryPlaceholder")}
          />
          {expiryWarning && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t("expiryWarning30Days")}
            </p>
          )}
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("creating") : t("addItem")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (onCancel ? onCancel() : router.push("/dashboard/inventory"))}
          disabled={isSubmitting}
        >
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
