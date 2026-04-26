"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { useTranslations } from "@/lib/i18n";
import { createInvoiceFromForm } from "@/lib/actions/invoice-actions";
import { getPatients } from "@/lib/actions/patient-actions";
import { getAppointmentsForPatient } from "@/lib/actions/appointment-actions";
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

const ITEM_TYPES = ["Service", "Medicine", "Test"] as const;

function makeSchema(descriptionRequired: string) {
  return z.object({
    patientId: z.string().uuid("Choose a patient"),
    appointmentId: z.string().uuid().optional().nullable(),
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
    taxPercent: z.coerce.number().min(0).max(100).default(10),
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

export function CreateNewInvoiceForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const schema = useMemo(() => makeSchema(tValidation("descriptionRequired")), [tValidation]);
  const [error, setError] = useState<string | null>(null);
  const [patients, setPatients] = useState<{ id: string; fullName: string }[]>([]);
  const [appointments, setAppointments] = useState<{ id: string; label: string }[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      patientId: "",
      appointmentId: null,
      dueDate: undefined,
      items: [
        { description: "", itemType: "Service", quantity: 1, unitPrice: 0 },
      ],
      discount: 0,
      taxPercent: 10,
      notes: "",
    },
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const patientId = watch("patientId");
  const dueDate = watch("dueDate");
  const items = watch("items");
  const discount = watch("discount");
  const taxPercent = watch("taxPercent");

  useEffect(() => {
    getPatients().then(setPatients);
  }, []);

  useEffect(() => {
    if (!patientId) {
      setAppointments([]);
      setValue("appointmentId", null);
      return;
    }
    getAppointmentsForPatient(patientId).then(setAppointments);
    setValue("appointmentId", null);
  }, [patientId, setValue]);

  const subtotal = items.reduce(
    (sum, item) => sum + (item.quantity ?? 0) * (item.unitPrice ?? 0),
    0
  );
  const taxAmount = (subtotal * (taxPercent ?? 0)) / 100;
  const totalAmount = Math.max(0, subtotal + taxAmount - (discount ?? 0));

  async function onSubmit(data: FormData) {
    setError(null);
    const result = await createInvoiceFromForm({
      patientId: data.patientId,
      appointmentId: data.appointmentId ?? undefined,
      dueAt: data.dueDate ? data.dueDate.toISOString().slice(0, 10) : undefined,
      items: data.items.map((i) => ({
        description: i.description,
        itemType: i.itemType ?? undefined,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
      })),
      discount: data.discount ?? 0,
      taxPercent: data.taxPercent ?? 0,
      notes: data.notes ?? undefined,
    });
    if (!result.success) {
      toast.error(result.error ?? t("formFailedToCreate"));
      setError(result.error);
      return;
    }
    toast.success(t("formInvoiceCreated"));
    onSuccess?.();
    router.push("/dashboard/invoices");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          {t("formPatientInfo")}
        </h3>
        <div className="space-y-2">
          <Label>{t("formSelectPatient")}</Label>
          <Select
            value={patientId || undefined}
            onValueChange={(v) => setValue("patientId", v)}
          >
            <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]">
              <SelectValue placeholder={t("formChoosePatient")} />
            </SelectTrigger>
            <SelectContent>
              {patients.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.patientId && (
            <p className="text-xs text-destructive">{errors.patientId.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label>{t("formRelatedAppointment")}</Label>
          <Select
            value={watch("appointmentId") ?? undefined}
            onValueChange={(v) => setValue("appointmentId", v || null)}
            disabled={!patientId}
          >
            <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]">
              <SelectValue placeholder={t("formLinkToAppointment")} />
            </SelectTrigger>
            <SelectContent>
              {appointments.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                <p className="text-xs text-muted-foreground">
                  {t("formOrSelectFromList")}
                </p>
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
                <Label>{t("formUnitPrice")}</Label>
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
                  {t("formTotal")}{" "}
                  {formatCurrency(
                    (items[index]?.quantity ?? 0) * (items[index]?.unitPrice ?? 0)
                  )}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  {t("formRemove")}
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
            <span className="text-muted-foreground">
              {t("formTax", { percent: taxPercent })}
            </span>
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
        <p className="text-lg font-bold font-heading tabular-nums">
          {t("formTotalAmount")}: {formatCurrency(totalAmount)}
        </p>
      </div>

      <div className="space-y-2">
        <Label>{t("formNotes")}</Label>
        <Textarea
          {...register("notes")}
          placeholder={t("formNotesPlaceholder")}
          className="min-h-[80px] rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E]"
        />
      </div>

      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => (onSuccess ? onSuccess() : router.back())}
        >
          {tCommon("cancel")}
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {t("formCreateInvoice")}
        </Button>
      </div>
    </form>
  );
}
