"use client";

import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "@/lib/i18n";
import { updateInvoice } from "@/lib/actions/invoice-actions";
import type { InvoiceDetailData } from "@/hooks/use-invoice-data";
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
import { MarkInvoicePaidButton } from "../billing/mark-invoice-paid-button";

const ITEM_TYPES = ["Service", "Medicine", "Test"] as const;

function makeSchema(descriptionRequired: string) {
  return z.object({
    dueDate: z.date().optional().nullable(),
    items: z
      .array(
        z.object({
          description: z.string().min(1, descriptionRequired),
          itemType: z.string().optional(),
          quantity: z.coerce.number().int().min(1, "Min 1"),
          unitPrice: z.coerce.number().min(0, "Min 0"),
        })
      )
      .min(1, "Add at least one item"),
    discount: z.coerce.number().min(0).default(0),
    taxPercent: z.coerce.number().min(0).max(100).default(0),
    notes: z.string().optional(),
  });
}

type FormData = z.infer<ReturnType<typeof makeSchema>>;

function formatCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(n);
}

export function EditInvoiceForm({
  data,
  onSuccess,
}: {
  data: NonNullable<InvoiceDetailData>;
  onSuccess?: () => void;
}) {
  const t = useTranslations("invoices");
  const tValidation = useTranslations("validation");
  const schema = useMemo(() => makeSchema(tValidation("descriptionRequired")), [tValidation]);
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      dueDate: data.invoice.dueAt ? new Date(data.invoice.dueAt) : null,
      items: data.items.map((i) => ({
        description: i.description,
        itemType: i.itemType ?? "Service",
        quantity: i.quantity,
        unitPrice: parseFloat(i.unitPrice),
      })),
      discount: parseFloat(data.invoice.discount ?? "0"),
      taxPercent: parseFloat(data.invoice.taxPercent ?? "0"),
      notes: data.invoice.notes ?? "",
    },
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const dueDate = watch("dueDate");
  const items = watch("items");
  const discount = watch("discount");
  const taxPercent = watch("taxPercent");

  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0),
    0
  );
  const taxAmount = (subtotal * (taxPercent ?? 0)) / 100;
  const totalAmount = Math.max(0, subtotal + taxAmount - (discount ?? 0));

  async function onSubmit(formData: FormData) {
    const result = await updateInvoice({
      invoiceId: data.invoice.id,
      dueAt: formData.dueDate ? formData.dueDate.toISOString().slice(0, 10) : undefined,
      items: formData.items.map((i) => ({
        description: i.description,
        itemType: i.itemType ?? undefined,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      discount: formData.discount ?? 0,
      taxPercent: formData.taxPercent ?? 0,
      notes: formData.notes ?? undefined,
    });
    if (!result.success) {
      toast.error(result.error ?? t("formFailedToUpdate"));
      return;
    }
    toast.success(t("formInvoiceUpdated"));
    onSuccess?.();
  }

  const invNum = data.invoice.invoiceNumber ?? `INV-${data.invoice.id.slice(0, 8).toUpperCase()}`;
  const appointmentDateStr = data.appointmentDate
    ? new Date(data.appointmentDate).toLocaleDateString("en-GB", { dateStyle: "medium" }) + " " + new Date(data.appointmentDate).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-3">
        <p className="font-bold text-slate-900 dark:text-white text-sm">{invNum} · {data.invoice.status}</p>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("formLabelPatient")}</dt>
            <dd className="font-medium text-slate-900 dark:text-white mt-0.5">
              {data.patientName ?? "—"}
              {data.patientPhone ? ` · ${data.patientPhone}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("formLabelDoctor")}</dt>
            <dd className="font-medium text-slate-900 dark:text-white mt-0.5">
              {data.doctorName ? `Dr. ${data.doctorName}` : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("formLabelService")}</dt>
            <dd className="font-medium text-slate-900 dark:text-white mt-0.5">{data.serviceName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("formLabelDepartment")}</dt>
            <dd className="font-medium text-slate-900 dark:text-white mt-0.5">{data.departmentName ?? "—"}</dd>
          </div>
          {appointmentDateStr && (
            <div className="sm:col-span-2">
              <dt className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("formLabelAppointment")}</dt>
              <dd className="font-medium text-slate-900 dark:text-white mt-0.5">{appointmentDateStr}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="space-y-2">
        <Label>{t("formDueDate")}</Label>
        <DatePicker
          date={dueDate ?? undefined}
          onSelect={(d) => setValue("dueDate", d ?? null)}
          placeholder="dd/mm/yyyy"
          className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {t("formInvoiceItems")}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({
                description: "",
                itemType: "Service",
                quantity: 1,
                unitPrice: 0,
              })
            }
          >
            {t("formAddItem")}
          </Button>
        </div>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="rounded-lg border border-slate-200/60 dark:border-slate-800/60 p-4 space-y-3"
          >
            <p className="text-xs font-medium text-muted-foreground">
              {t("formItemN", { n: index + 1 })}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label>{t("formDescription")}</Label>
                <Input
                  {...register(`items.${index}.description`)}
                  placeholder={t("formDescriptionPlaceholder")}
                  className="h-10 rounded-lg bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("formType")}</Label>
                <Select
                  value={watch(`items.${index}.itemType`) ?? "Service"}
                  onValueChange={(v) => setValue(`items.${index}.itemType`, v)}
                >
                  <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ITEM_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(type === "Service" ? "itemTypeService" : type === "Medicine" ? "itemTypeMedicine" : "itemTypeTest")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("formQuantity")}</Label>
                <Input
                  type="number"
                  min={1}
                  {...register(`items.${index}.quantity`)}
                  className="h-10 rounded-lg bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60"
                />
              </div>
              <div className="space-y-2">
                <Label>Unit Price ($)</Label>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  {...register(`items.${index}.unitPrice`)}
                  className="h-10 rounded-lg bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60"
                />
              </div>
              <div className="flex items-end justify-between sm:col-span-2">
                <span className="text-sm text-muted-foreground">
                  Total: {formatCurrency((items[index]?.quantity ?? 0) * (items[index]?.unitPrice ?? 0))}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        ))}
        {errors.items?.root?.message && (
          <p className="text-sm text-destructive">{errors.items.root.message}</p>
        )}
      </div>

      <div className="rounded-lg border border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("formInvoiceSummary")}
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("formDiscount")}</Label>
            <Input
              type="number"
              min={0}
              step={0.01}
              {...register("discount")}
              className="h-10 rounded-lg bg-white dark:bg-[#0B0B1E]"
            />
          </div>
          <div className="space-y-2">
            <Label>{t("formTaxPercent")}</Label>
            <Input
              type="number"
              min={0}
              max={100}
              step={0.01}
              {...register("taxPercent")}
              className="h-10 rounded-lg bg-white dark:bg-[#0B0B1E]"
            />
          </div>
        </div>
        <div className="pt-2 space-y-1 text-sm">
          <p className="flex justify-between">
            <span className="text-muted-foreground">{t("formSubtotal")}</span>
            <span>{formatCurrency(subtotal)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">{t("formTax", { percent: taxPercent })}</span>
            <span>{formatCurrency(taxAmount)}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">{t("formDiscountLabel")}</span>
            <span>-{formatCurrency(discount ?? 0)}</span>
          </p>
          <p className="flex justify-between font-semibold pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
            <span>{t("formTotal")}</span>
            <span>{formatCurrency(totalAmount)}</span>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("formNotes")}</Label>
        <Textarea
          {...register("notes")}
          placeholder={t("formNotesPlaceholder")}
          className="min-h-[80px] rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]"
        />
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        {data.invoice.status === "unpaid" && (
          <MarkInvoicePaidButton
            invoiceId={data.invoice.id}
            onSuccess={onSuccess}
          />
        )}
        <Button type="submit" isLoading={isSubmitting}>
          {t("formSaveChanges")}
        </Button>
      </div>
    </form>
  );
}
