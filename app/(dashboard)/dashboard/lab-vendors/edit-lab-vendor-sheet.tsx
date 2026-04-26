"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { updateLabVendor, getVendorFinancialSummary } from "@/lib/actions/lab-vendor-actions";
import type { LabVendorPageRow } from "@/lib/actions/lab-vendor-actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { format } from "date-fns";

function makeSchema(invalidEmail: string) {
  return z
    .object({
      name: z.string().min(1, "Vendor name is required"),
      contactPerson: z.string().optional(),
      email: z.string().email(invalidEmail).optional().or(z.literal("")),
      phone: z.string().optional(),
      contractStart: z.string().optional(),
      contractEnd: z.string().optional(),
      status: z.enum(["active", "pending"]),
    })
    .refine((d) => {
      if (!d.contractStart || !d.contractEnd) return true;
      return new Date(d.contractEnd) >= new Date(d.contractStart);
    }, { message: "End date must be on or after start date", path: ["contractEnd"] });
}

type FormData = z.infer<ReturnType<typeof makeSchema>>;

interface EditLabVendorSheetProps {
  vendor: LabVendorPageRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditLabVendorSheet({
  vendor,
  open,
  onOpenChange,
}: EditLabVendorSheetProps) {
  const t = useTranslations("labVendors");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const schema = useMemo(() => makeSchema(tValidation("invalidEmail")), [tValidation]);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [financial, setFinancial] = useState<{ totalExpenses: string; expenseCount: number } | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      contractStart: "",
      contractEnd: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (vendor && open) {
      reset({
        name: vendor.name,
        contactPerson: vendor.contactPerson ?? "",
        email: vendor.email ?? "",
        phone: vendor.phone ?? "",
        contractStart: vendor.contractStartDate ?? "",
        contractEnd: vendor.contractEndDate ?? "",
        status: (vendor.status as "active" | "pending") || "active",
      });
      setFinancial(null);
      setFinancialLoading(true);
      getVendorFinancialSummary(vendor.id).then((res) => {
        if (res.success && res.data) setFinancial(res.data);
        else setFinancial(null);
      }).finally(() => setFinancialLoading(false));
    }
  }, [vendor?.id, open, reset]);

  async function onSubmit(data: FormData) {
    if (!vendor) return;
    setError(null);
    const result = await updateLabVendor({
      vendorId: vendor.id,
      name: data.name,
      contactPerson: data.contactPerson || undefined,
      email: data.email || undefined,
      phone: data.phone || undefined,
      contractStart: data.contractStart || undefined,
      contractEnd: data.contractEnd || undefined,
      status: data.status,
    });
    if (result.success) {
      toast.success(t("vendorUpdated"));
      onOpenChange(false);
      router.refresh();
    } else {
      setError(result.error ?? "Failed to update");
      toast.error(result.error);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] sm:max-w-[480px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("editLabVendor")}
          </SheetTitle>
        </SheetHeader>
        {vendor && (
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col flex-1 overflow-hidden"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">{t("editVendorName")}</Label>
                <Input id="edit-name" {...register("name")} placeholder="Lab name" />
                {errors.name && (
                  <p className="text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-contact">{t("editContactPerson")}</Label>
                <Input
                  id="edit-contact"
                  {...register("contactPerson")}
                  placeholder="Contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">{t("editEmail")}</Label>
                <Input
                  id="edit-email"
                  type="email"
                  {...register("email")}
                  placeholder="email@lab.com"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">{t("editPhone")}</Label>
                <Input id="edit-phone" {...register("phone")} placeholder="+1 234 567 8900" />
              </div>
              <div className="space-y-2">
                <Label>{t("editContractStart")}</Label>
                <DatePicker
                  date={watch("contractStart")?.trim() ? new Date(watch("contractStart")!) : undefined}
                  onSelect={(d) => setValue("contractStart", d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="dd/mm/yyyy"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("editContractEnd")}</Label>
                <DatePicker
                  date={watch("contractEnd")?.trim() ? new Date(watch("contractEnd")!) : undefined}
                  onSelect={(d) => setValue("contractEnd", d ? format(d, "yyyy-MM-dd") : "")}
                  placeholder="dd/mm/yyyy"
                />
                {errors.contractEnd && (
                  <p className="text-sm text-destructive">{errors.contractEnd.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>{t("editStatus")}</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(v) => setValue("status", v as "active" | "pending")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("statusActive")}</SelectItem>
                    <SelectItem value="pending">{t("statusPending")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {financialLoading ? (
                <p className="text-xs text-muted-foreground">{t("editLoadingFinancial")}</p>
              ) : financial ? (
                <div className="rounded-lg border border-slate-200/60 dark:border-slate-800/60 p-3 bg-slate-50/50 dark:bg-slate-900/50">
                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">{t("editFinancial")}</h4>
                  <p className="text-lg font-bold font-heading tabular-nums">
                    {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(financial.totalExpenses))}
                  </p>
                  <p className="text-xs text-muted-foreground">{t("editExpensesLinked", { count: financial.expenseCount })}</p>
                </div>
              ) : null}
            </div>
            {error && (
              <p className="px-6 text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-2 p-6 border-t border-slate-200/60 dark:border-slate-800/60 shrink-0">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("editSaving") : t("editSave")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {tCommon("cancel")}
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
