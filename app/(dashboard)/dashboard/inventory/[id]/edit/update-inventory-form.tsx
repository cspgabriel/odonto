"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "@/lib/i18n";
import { z } from "zod";
import { toast } from "sonner";
import { updateInventoryItem } from "@/lib/actions/inventory-actions";
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
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import type { inventory } from "@/lib/db/schema";

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
    recordAsExpense: z.boolean().optional(),
  });

type FormData = z.infer<ReturnType<typeof getSchema>>;

type InventoryItem = typeof inventory.$inferSelect;

interface UpdateInventoryFormProps {
  item: InventoryItem;
  vendors: { id: string; name: string }[];
  onSuccess?: () => void;
}

export function UpdateInventoryForm({
  item,
  vendors,
  onSuccess,
}: UpdateInventoryFormProps) {
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
      name: item.name,
      category: item.category ?? "",
      description: item.description ?? "",
      manufacturer: item.manufacturer ?? "",
      batchNumber: item.batchNumber ?? "",
      quantity: item.quantity ?? 0,
      unit: item.unit ?? "unit",
      minStock: item.minStock ?? 0,
      price: item.price ?? "",
      supplierId: item.supplierId ?? null,
      expiryDate: item.expiryDate ?? "",
      recordAsExpense: false,
    },
  });

  async function onSubmit(data: FormData) {
    setError(null);
    const result = await updateInventoryItem({
      itemId: item.id,
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
      recordAsExpense: data.recordAsExpense,
    });
    if (!result.success) {
      toast.error(result.error ?? t("failedToUpdate"));
      setError(result.error);
      return;
    }
    toast.success(t("updateSuccess"));
    if (onSuccess) onSuccess();
    else {
      router.push("/dashboard/inventory");
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <p className="text-sm text-destructive font-medium">{error}</p>
      )}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("itemName")}</Label>
          <Input id="name" {...register("name")} placeholder="e.g., Gloves (box)" />
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
          <Label htmlFor="manufacturer">{t("manufacturer")}</Label>
          <Input id="manufacturer" {...register("manufacturer")} placeholder="e.g., PharmaCorp" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="batchNumber">{t("batch")}</Label>
          <Input id="batchNumber" {...register("batchNumber")} placeholder="e.g., SKU-XXXXX" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{t("stockAndPricing")}</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">{t("tableQuantity")}</Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              {...register("quantity")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="minStock">{t("min")} Stock</Label>
            <Input
              id="minStock"
              type="number"
              min={0}
              {...register("minStock")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unit">{t("unitLabel")}</Label>
            <Input id="unit" {...register("unit")} placeholder={t("unitPlaceholder")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">{t("tableUnitPrice")}</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              {...register("price")}
              placeholder="0.00"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("expiryDate")}</Label>
          <DatePicker
            date={(() => {
              const v = watch("expiryDate");
              return v ? new Date(v) : undefined;
            })()}
            onSelect={(d) => setValue("expiryDate", d ? d.toISOString().split("T")[0] : "")}
          />
        </div>
          {(watch("quantity") ?? 0) > (item.quantity ?? 0) && (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200/60 dark:border-slate-800/60 p-3 bg-slate-50/50 dark:bg-slate-900/50">
              <Checkbox
                id="recordAsExpense"
                checked={watch("recordAsExpense") ?? false}
                onCheckedChange={(v) => setValue("recordAsExpense", !!v)}
              />
              <Label htmlFor="recordAsExpense" className="text-sm font-medium cursor-pointer">
                {t("recordRestockAsExpense")}
              </Label>
            </div>
          )}
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
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("saving") : t("saveChanges")}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard/inventory")}>
          {tCommon("cancel")}
        </Button>
      </div>
    </form>
  );
}
