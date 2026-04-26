"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "@/lib/i18n";
import { updatePrescription } from "@/lib/actions/prescription-actions";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface Props {
  prescription: {
    id: string;
    patientId: string;
    doctorId: string;
    medication: string;
    dosage: string;
    inventoryItemId: string | null;
    frequency: string | null;
    duration: string | null;
    instructions: string | null;
    drugInteractions: string | null;
    pharmacyName: string | null;
    pharmacyAddress: string | null;
    patientName: string;
    doctorName: string;
  };
  patients: { id: string; fullName: string }[];
  doctors: { id: string; fullName: string }[];
}

export function PrescriptionEditForm({ prescription, patients, doctors }: Props) {
  const t = useTranslations("prescriptions");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [form, setForm] = useState({
    patientId: prescription.patientId,
    doctorId: prescription.doctorId,
    medication: prescription.medication,
    dosage: prescription.dosage,
    inventoryItemId: prescription.inventoryItemId ?? null,
    frequency: prescription.frequency ?? "",
    duration: prescription.duration ?? "",
    instructions: prescription.instructions ?? "",
    drugInteractions: prescription.drugInteractions ?? "",
    pharmacyName: prescription.pharmacyName ?? "",
    pharmacyAddress: prescription.pharmacyAddress ?? "",
  });

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await updatePrescription(prescription.id, {
          patientId: form.patientId,
          doctorId: form.doctorId,
          medication: form.medication,
          dosage: form.dosage,
          inventoryItemId: form.inventoryItemId || null,
          frequency: form.frequency || null,
          duration: form.duration || null,
          instructions: form.instructions || null,
          drugInteractions: form.drugInteractions || null,
          pharmacyName: form.pharmacyName || null,
          pharmacyAddress: form.pharmacyAddress || null,
        });
        toast.success(t("updateSuccess"));
        router.push("/dashboard/prescriptions");
      } catch {
        toast.error(t("failedToUpdate"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E] p-6 space-y-5">

        {/* Patient + Doctor Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("tablePatient")}</Label>
            <Select value={form.patientId} onValueChange={(v) => handleChange("patientId", v)}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm">
                <SelectValue placeholder={t("selectPatient")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                {patients.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-sm">{p.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("sectionDoctor")}</Label>
            <Select value={form.doctorId} onValueChange={(v) => handleChange("doctorId", v)}>
              <SelectTrigger className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm">
                <SelectValue placeholder={t("selectDoctor")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-sm">{d.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Medication + Dosage */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("medication")}</Label>
            <Input value={form.medication} onChange={(e) => handleChange("medication", e.target.value)}
              className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm" required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("dosage")}</Label>
            <Input value={form.dosage} onChange={(e) => handleChange("dosage", e.target.value)}
              placeholder={t("dosagePlaceholder")}
              className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm" required />
          </div>
        </div>

        {/* Frequency + Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("labelFrequency")}</Label>
            <Input value={form.frequency} onChange={(e) => handleChange("frequency", e.target.value)}
              placeholder={t("frequencyPlaceholder")}
              className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("labelDuration")}</Label>
            <Input value={form.duration} onChange={(e) => handleChange("duration", e.target.value)}
              placeholder={t("durationPlaceholder")}
              className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm" />
          </div>
        </div>

        {/* Instructions */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("clinicalNotesInstructions")}</Label>
          <Textarea value={form.instructions} onChange={(e) => handleChange("instructions", e.target.value)}
            rows={3} placeholder={t("instructionsPlaceholder")}
            className="rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm resize-none" />
        </div>

        {/* Drug Interactions */}
        <div className="space-y-1.5">
          <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("drugInteractions")}</Label>
          <Textarea value={form.drugInteractions} onChange={(e) => handleChange("drugInteractions", e.target.value)}
            rows={2} placeholder={t("drugInteractionsPlaceholder")}
            className="rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm resize-none" />
        </div>

        {/* Pharmacy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("pharmacyName")}</Label>
            <Input value={form.pharmacyName} onChange={(e) => handleChange("pharmacyName", e.target.value)}
              placeholder={t("pharmacyNamePlaceholder")}
              className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("pharmacyAddress")}</Label>
            <Input value={form.pharmacyAddress} onChange={(e) => handleChange("pharmacyAddress", e.target.value)}
              placeholder={t("pharmacyAddressPlaceholder")}
              className="h-10 rounded-lg border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/50 text-sm" />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <Button type="button" variant="outline" className="h-10 px-6 rounded-lg font-bold border-slate-200/60"
          onClick={() => router.push("/dashboard/prescriptions")} disabled={isPending}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" disabled={isPending}
          className="h-10 px-6 rounded-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground">
          {isPending ? <><Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />{t("saving")}</> : t("saveChanges")}
        </Button>
      </div>
    </form>
  );
}
