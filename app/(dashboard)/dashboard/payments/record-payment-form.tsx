"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { createPayment, updatePayment, getPatientsForPaymentSelect, getInvoicesForPatient } from "@/lib/actions/payment-actions";
import { recordPaymentFormSchema, type RecordPaymentFormValues } from "@/lib/validations/payment";
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
import { AlertCircle } from "lucide-react";

const PAYMENT_METHOD_KEYS = ["methodInsurance", "methodCreditCard", "methodBankTransfer", "methodCash", "methodCheck"] as const;
const PAYMENT_METHOD_VALUES = ["Insurance", "Credit Card", "Bank Transfer", "Cash", "Check"] as const;

interface RecordPaymentFormProps {
  onSuccess?: () => void;
  editId?: string | null;
  editValues?: RecordPaymentFormValues | null;
}

export function RecordPaymentForm({
  onSuccess,
  editId,
  editValues,
}: RecordPaymentFormProps) {
  const router = useRouter();
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");
  const [error, setError] = useState<string | null>(null);
  const [patientsList, setPatientsList] = useState<{ id: string; fullName: string }[]>([]);
  const [invoicesList, setInvoicesList] = useState<{ id: string; invoiceNumber: string | null; totalAmount: string }[]>([]);

  const isEdit = !!editId && !!editValues;

  const form = useForm<RecordPaymentFormValues>({
    resolver: zodResolver(recordPaymentFormSchema),
    defaultValues: {
      patientId: "",
      invoiceId: null,
      amount: 0,
      paymentMethod: "",
      transactionId: "",
      description: "",
      status: "completed",
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = form;
  const patientId = watch("patientId");

  useEffect(() => {
    getPatientsForPaymentSelect().then(setPatientsList);
  }, []);

  useEffect(() => {
    if (!patientId) {
      setInvoicesList([]);
      if (!isEdit) setValue("invoiceId", null);
      return;
    }
    getInvoicesForPatient(patientId).then(setInvoicesList);
  }, [patientId, isEdit, setValue]);

  useEffect(() => {
    if (editValues) {
      form.reset({
        patientId: editValues.patientId,
        invoiceId: editValues.invoiceId ?? null,
        amount: editValues.amount,
        paymentMethod: editValues.paymentMethod,
        transactionId: editValues.transactionId ?? "",
        description: editValues.description,
        status: editValues.status ?? "completed",
      });
    }
  }, [editValues, form]);

  async function onSubmit(data: RecordPaymentFormValues) {
    setError(null);
    const payload = {
      patientId: data.patientId,
      invoiceId: data.invoiceId && data.invoiceId !== "" ? data.invoiceId : null,
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      transactionId: data.transactionId?.trim() || null,
      description: data.description.trim(),
      status: (data.status ?? "completed") as "completed" | "pending" | "failed",
    };

    const result = isEdit
      ? await updatePayment({ ...payload, id: editId! })
      : await createPayment(payload);

    if (!result.success) {
      toast.error(result.error);
      setError(result.error);
      return;
    }

    toast.success(isEdit ? t("formUpdateSuccess") : t("formRecordSuccess"));
    if (onSuccess) onSuccess();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <p className="text-sm text-slate-600 dark:text-slate-400">
        {t("formIntro")}
      </p>

      <div className="space-y-2">
        <Label htmlFor="patientId">
          {t("formPatientLabel")} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={patientId}
          onValueChange={(v) => setValue("patientId", v)}
          required
        >
          <SelectTrigger
            id="patientId"
            className="w-full h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60"
          >
            <SelectValue placeholder={t("formSelectPatient")} />
          </SelectTrigger>
          <SelectContent>
            {patientsList.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.fullName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t("formPatientHelp")}</p>
        {errors.patientId && (
          <p className="text-xs text-destructive">{errors.patientId.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="invoiceId">{t("formInvoiceLabel")}</Label>
        <Select
          value={watch("invoiceId") && watch("invoiceId") !== "" ? watch("invoiceId")! : "none"}
          onValueChange={(v) => setValue("invoiceId", v === "none" ? null : v)}
        >
          <SelectTrigger
            id="invoiceId"
            className="w-full h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60"
          >
            <SelectValue placeholder={t("formInvoiceNone")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">{t("formInvoiceNone")}</SelectItem>
            {invoicesList.map((inv) => (
              <SelectItem key={inv.id} value={inv.id}>
                {inv.invoiceNumber ?? inv.id.slice(0, 8)} – ${inv.totalAmount}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{t("formInvoiceHelp")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">
          {t("formAmountLabel")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="0.00"
          className="h-10 rounded-lg"
          {...register("amount", { valueAsNumber: true })}
        />
        {errors.amount && (
          <p className="text-xs text-destructive">{errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="paymentMethod">
          {t("formPaymentMethodLabel")} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={watch("paymentMethod")}
          onValueChange={(v) => setValue("paymentMethod", v)}
          required
        >
          <SelectTrigger
            id="paymentMethod"
            className="w-full h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60"
          >
            <SelectValue placeholder={t("formSelectMethod")} />
          </SelectTrigger>
          <SelectContent>
            {PAYMENT_METHOD_VALUES.map((value, i) => (
              <SelectItem key={value} value={value}>
                {t(PAYMENT_METHOD_KEYS[i])}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.paymentMethod && (
          <p className="text-xs text-destructive">{errors.paymentMethod.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="transactionId">{t("formTransactionIdLabel")}</Label>
        <Input
          id="transactionId"
          placeholder={t("formTransactionIdPlaceholder")}
          className="h-10 rounded-lg"
          {...register("transactionId")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">
          {t("formDescriptionLabel")} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder={t("formDescriptionPlaceholder")}
          className="min-h-[80px] rounded-lg resize-none"
          {...register("description")}
        />
        <p className="text-xs text-muted-foreground">
          {t("formDescriptionHelp")}
        </p>
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-xs font-bold uppercase tracking-tight">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          className="font-bold border-slate-200 dark:border-slate-800 rounded-lg"
          onClick={() => onSuccess?.()}
        >
          {tCommon("cancel")}
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="font-bold rounded-lg"
        >
          {isSubmitting ? t("formSaving") : isEdit ? t("formUpdatePayment") : t("formRecordPayment")}
        </Button>
      </div>
    </form>
  );
}
