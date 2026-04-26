"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "@/lib/i18n";
import { updateExpense, getDepartmentsForExpense, getLabVendorsForExpense, getInventoryForExpense } from "@/lib/actions/expense-actions";
import { EXPENSE_CATEGORIES, EXPENSE_PAYMENT_METHODS, EXPENSE_STATUSES } from "@/lib/constants/expenses";
import type { expenses } from "@/lib/db/schema";
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
import { DatePicker } from "@/components/ui/date-picker";

function makeSchema(titleRequired: string, dateRequired: string, amountInvalid: string) {
  return z.object({
    title: z.string().min(1, titleRequired),
    description: z.string().optional(),
    amount: z.coerce.number().min(0, amountInvalid),
    category: z.enum(["utilities", "equipment", "maintenance", "staff", "other", "insurance"]),
    paymentMethod: z.enum(["cash", "card", "check", "bank transfer"]),
    status: z.enum(["pending", "paid", "cancelled"]),
    date: z.date({ required_error: dateRequired }),
    vendor: z.string().optional(),
    receiptUrl: z.string().optional(),
    notes: z.string().optional(),
    departmentId: z.string().uuid().optional().nullable(),
    vendorId: z.string().uuid().optional().nullable(),
    inventoryItemId: z.string().uuid().optional().nullable(),
  });
}

type FormData = z.infer<ReturnType<typeof makeSchema>>;

const CATEGORY_KEYS: Record<string, string> = {
  utilities: "categoryUtilities",
  equipment: "categoryEquipment",
  maintenance: "categoryMaintenance",
  staff: "categoryStaff",
  other: "categoryOther",
  insurance: "categoryInsurance",
};
const PAYMENT_KEYS: Record<string, string> = {
  cash: "formPaymentCash",
  card: "formPaymentCard",
  check: "formPaymentCheck",
  "bank transfer": "formPaymentBankTransfer",
};
const STATUS_KEYS: Record<string, string> = {
  pending: "statusPending",
  paid: "statusPaid",
  cancelled: "statusCancelled",
};

export function EditExpenseForm({
  expense,
  onSuccess,
}: {
  expense: typeof expenses.$inferSelect;
  onSuccess?: () => void;
}) {
  const router = useRouter();
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const schema = useMemo(
    () =>
      makeSchema(
        tValidation("titleRequired"),
        tValidation("dateRequired"),
        tValidation("amountMustBePositive")
      ),
    [tValidation]
  );
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [vendors, setVendors] = useState<{ id: string; name: string }[]>([]);
  const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    Promise.all([getDepartmentsForExpense(), getLabVendorsForExpense(), getInventoryForExpense()]).then(
      ([depts, vends, inv]) => {
        setDepartments(depts);
        setVendors(vends);
        setInventoryItems(inv);
      }
    );
  }, []);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: expense.title,
      description: expense.description ?? "",
      amount: parseFloat(String(expense.amount)),
      category: expense.category as FormData["category"],
      paymentMethod: expense.paymentMethod as FormData["paymentMethod"],
      status: expense.status as FormData["status"],
      date: new Date(expense.date),
      vendor: expense.vendor ?? "",
      receiptUrl: expense.receiptUrl ?? "",
      notes: expense.notes ?? "",
      departmentId: expense.departmentId ?? null,
      vendorId: expense.vendorId ?? null,
      inventoryItemId: expense.inventoryItemId ?? null,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = form;
  const date = watch("date");

  async function onSubmit(data: FormData) {
    const result = await updateExpense({
      id: expense.id,
      title: data.title,
      description: data.description || undefined,
      amount: data.amount,
      category: data.category,
      paymentMethod: data.paymentMethod,
      status: data.status,
      date: data.date.toISOString(),
      vendor: data.vendor || undefined,
      receiptUrl: data.receiptUrl?.trim() || undefined,
      notes: data.notes || undefined,
      departmentId: data.departmentId || null,
      vendorId: data.vendorId || null,
      inventoryItemId: data.inventoryItemId || null,
    });
    if (!result.success) {
      toast.error(result.error ?? t("formFailedToUpdate"));
      return;
    }
    toast.success(t("formUpdated"));
    onSuccess?.();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>{t("formTitle")} *</Label>
        <Input
          {...register("title")}
          placeholder={t("formTitlePlaceholder")}
          className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]"
        />
        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>{t("formDescription")}</Label>
        <Textarea
          {...register("description")}
          placeholder={t("formDescriptionPlaceholder")}
          className="min-h-[80px] rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]"
        />
      </div>
      <div className="space-y-2">
        <Label>{t("formAmount")} *</Label>
        <Input
          type="number"
          step={0.01}
          min={0}
          {...register("amount")}
          className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]"
        />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>{t("formCategory")} *</Label>
        <Select value={watch("category")} onValueChange={(v) => setValue("category", v as FormData["category"])}>
          <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]">
            <SelectValue placeholder={t("formSelectCategory")} />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {t(CATEGORY_KEYS[c])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("formPaymentMethod")} *</Label>
        <Select value={watch("paymentMethod")} onValueChange={(v) => setValue("paymentMethod", v as FormData["paymentMethod"])}>
          <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]">
            <SelectValue placeholder={t("formSelectPaymentMethod")} />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_PAYMENT_METHODS.map((p) => (
              <SelectItem key={p} value={p}>
                {t(PAYMENT_KEYS[p])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("formStatus")}</Label>
        <Select value={watch("status")} onValueChange={(v) => setValue("status", v as FormData["status"])}>
          <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {EXPENSE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {t(STATUS_KEYS[s])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("formDepartment")}</Label>
        <Select value={watch("departmentId") ?? "none"} onValueChange={(v) => setValue("departmentId", v === "none" ? null : v)}>
          <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]"><SelectValue placeholder={t("formSelectDepartment")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("formNone")}</SelectItem>
            {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("formVendorLabel")}</Label>
        <Select value={watch("vendorId") ?? "none"} onValueChange={(v) => setValue("vendorId", v === "none" ? null : v)}>
          <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]"><SelectValue placeholder={t("formSelectVendor")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("formNone")}</SelectItem>
            {vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("formInventoryItem")}</Label>
        <Select value={watch("inventoryItemId") ?? "none"} onValueChange={(v) => setValue("inventoryItemId", v === "none" ? null : v)}>
          <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]"><SelectValue placeholder={t("formSelectInventoryItem")} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("formNone")}</SelectItem>
            {inventoryItems.map((i) => <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t("formDate")} *</Label>
        <DatePicker
          date={date}
          onSelect={(d) => setValue("date", d ?? new Date())}
          placeholder={t("formDatePlaceholder")}
          className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60"
        />
        {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
      </div>
      <div className="space-y-2">
        <Label>{t("formVendorSupplier")}</Label>
        <Input
          {...register("vendor")}
          placeholder={t("formVendorSupplierPlaceholder")}
          className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]"
        />
      </div>
      <div className="space-y-2">
        <Label>{t("formReceiptUrl")}</Label>
        <Input
          {...register("receiptUrl")}
          placeholder={t("formReceiptUrlPlaceholder")}
          className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]"
        />
      </div>
      <div className="space-y-2">
        <Label>{t("formNotes")}</Label>
        <Textarea
          {...register("notes")}
          placeholder={t("formNotesPlaceholder")}
          className="min-h-[80px] rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {t("formSaveChanges")}
        </Button>
      </div>
    </form>
  );
}
