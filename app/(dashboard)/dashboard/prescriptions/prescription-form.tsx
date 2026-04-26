"use client";

import { useState, useTransition, useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { createPrescription, updatePrescription } from "@/lib/actions/prescription-actions";
import { getInventoryItemsForPrescription } from "@/lib/actions/inventory-actions";
import { useRouter } from "next/navigation";

type FormState = {
  patientId: string; doctorId: string; medication: string; dosage: string;
  inventoryItemId: string | null;
  frequency: string; duration: string; instructions: string;
  drugInteractions: string; pharmacyName: string; pharmacyAddress: string;
};

const EMPTY: FormState = {
  patientId: "", doctorId: "", medication: "", dosage: "", inventoryItemId: null,
  frequency: "", duration: "", instructions: "",
  drugInteractions: "", pharmacyName: "", pharmacyAddress: "",
};

export function PrescriptionForm({
  initial,
  patients,
  doctors,
  onSuccess,
  isEdit,
  rxId,
}: {
  initial?: Partial<FormState>;
  patients: { id: string; fullName: string }[];
  doctors: { id: string; fullName: string }[];
  onSuccess: () => void;
  isEdit?: boolean;
  rxId?: string;
}) {
  const t = useTranslations("prescriptions");
  const router = useRouter();
  const [form, setForm] = useState<FormState>({ ...EMPTY, ...initial });
  const [isPending, startTransition] = useTransition();
  const [inventoryItems, setInventoryItems] = useState<{ id: string; name: string; unit: string }[]>([]);

  useEffect(() => {
    getInventoryItemsForPrescription().then((r) => {
      if (r.success && r.data) setInventoryItems(r.data);
    });
  }, []);

  const f = (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(p => ({ ...p, [field]: e.target.value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const payload = {
          patientId: form.patientId, doctorId: form.doctorId,
          medication: form.medication, dosage: form.dosage,
          inventoryItemId: form.inventoryItemId || null,
          frequency: form.frequency || null, duration: form.duration || null,
          instructions: form.instructions || null,
          drugInteractions: form.drugInteractions || null,
          pharmacyName: form.pharmacyName || null,
          pharmacyAddress: form.pharmacyAddress || null,
        };
        if (isEdit && rxId) {
          const res = await updatePrescription(rxId, payload);
          if (!res.success) { toast.error(res.error); return; }
          toast.success(t("prescriptionUpdated"));
        } else {
          const res = await createPrescription(payload);
          if (!res.success) { toast.error(res.error); return; }
          toast.success(t("prescriptionCreated"));
        }
        router.refresh();
        onSuccess();
      } catch {
        toast.error(t("failedToSavePrescription"));
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("tablePatient")} *</Label>
          <Select value={form.patientId} onValueChange={v => setForm(p => ({ ...p, patientId: v }))}>
            <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm">
              <SelectValue placeholder={t("selectPatient")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              {patients.map(p => <SelectItem key={p.id} value={p.id} className="text-sm">{p.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("tableDoctor")} *</Label>
          <Select value={form.doctorId} onValueChange={v => setForm(p => ({ ...p, doctorId: v }))}>
            <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm">
              <SelectValue placeholder={t("selectDoctor")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              {doctors.map(d => <SelectItem key={d.id} value={d.id} className="text-sm">{d.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("fromInventoryOptional")}</Label>
        <Select
          value={form.inventoryItemId ?? "__manual__"}
          onValueChange={(v) => {
            const isManual = v === "__manual__" || !v;
            const item = isManual ? null : inventoryItems.find((i) => i.id === v);
            setForm((p) => ({
              ...p,
              inventoryItemId: isManual ? null : v,
              medication: item ? item.name : p.medication,
              dosage: item ? (item.unit !== "unit" ? item.unit : p.dosage) : p.dosage,
            }));
          }}
        >
          <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm">
            <SelectValue placeholder={t("pickFromInventory")} />
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-60">
            <SelectItem value="__manual__" className="text-sm text-muted-foreground">{t("enterManually")}</SelectItem>
            {inventoryItems.map((i) => (
              <SelectItem key={i.id} value={i.id} className="text-sm">
                {i.name} {i.unit !== "unit" ? `(${i.unit})` : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("medication")} *</Label>
          <Input value={form.medication} onChange={f("medication")} placeholder={t("medicationPlaceholder")} required
            className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("dosage")} *</Label>
          <Input value={form.dosage} onChange={f("dosage")} placeholder={t("dosagePlaceholder")} required
            className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("labelFrequency")}</Label>
          <Input value={form.frequency} onChange={f("frequency")} placeholder={t("frequencyPlaceholder")}
            className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("labelDuration")}</Label>
          <Input value={form.duration} onChange={f("duration")} placeholder={t("durationPlaceholder")}
            className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm" />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("clinicalNotesInstructions")}</Label>
        <Textarea value={form.instructions} onChange={f("instructions")} rows={2}
          placeholder={t("instructionsNotesPlaceholder")}
          className="rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm resize-none" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("drugInteractions")}</Label>
        <Textarea value={form.drugInteractions} onChange={f("drugInteractions")} rows={2}
          placeholder={t("drugInteractionsPlaceholder")}
          className="rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm resize-none" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("pharmacyName")}</Label>
          <Input value={form.pharmacyName} onChange={f("pharmacyName")} placeholder={t("pharmacyNamePlaceholder")}
            className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("pharmacyAddress")}</Label>
          <Input value={form.pharmacyAddress} onChange={f("pharmacyAddress")} placeholder={t("pharmacyAddressPlaceholder")}
            className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm" />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button type="submit" disabled={isPending}
          className="h-10 px-6 rounded-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
          {isPending
            ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />{t("saving")}</>
            : isEdit ? t("saveChanges") : t("createPrescription")}
        </Button>
      </div>
    </form>
  );
}
