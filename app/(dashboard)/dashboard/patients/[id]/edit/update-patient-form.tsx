
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { updatePatient } from "@/lib/actions/patient-actions";
import { patientFormSchema, type PatientFormValues } from "@/lib/validations/patient";
import { Button } from "@/components/ui/button";
import type { patients } from "@/lib/db/schema";
import { PatientFormFields } from "@/components/dashboard/patients/patient-form-fields";
import { AlertCircle } from "lucide-react";

type Patient = typeof patients.$inferSelect;

export function UpdatePatientForm({
  patient,
  onSuccess,
  doctors = [],
  departments = [],
}: {
  patient: Patient;
  onSuccess?: () => void;
  doctors?: { id: string; fullName: string; specialization: string | null }[];
  departments?: { id: string; name: string }[];
}) {
  const t = useTranslations("patients");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth ?? "",
      phone: patient.phone,
      email: patient.email ?? "",
      gender: patient.gender ?? "",
      bloodGroup: patient.bloodGroup ?? "",
      height: patient.height ?? "",
      weight: patient.weight ?? "",
      address: patient.address ?? "",
      medicalHistory: patient.medicalHistory ?? "",
      allergies: patient.allergies ?? "",
      emergencyContactName: patient.emergencyContactName ?? "",
      emergencyContactPhone: patient.emergencyContactPhone ?? "",
      emergencyContactRelation: patient.emergencyContactRelation ?? "",
      primaryDoctorId: patient.primaryDoctorId ?? null,
      departmentId: patient.departmentId ?? null,
    },
  });

  const { handleSubmit, formState: { isSubmitting } } = form;

  async function onSubmit(data: PatientFormValues) {
    setError(null);
    const result = await updatePatient({
      patientId: patient.id,
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      phone: data.phone,
      email: data.email || undefined,
      gender: data.gender || undefined,
      bloodGroup: data.bloodGroup || undefined,
      height: data.height || undefined,
      weight: data.weight || undefined,
      address: data.address || undefined,
      medicalHistory: data.medicalHistory || undefined,
      allergies: data.allergies || undefined,
      emergencyContactName: data.emergencyContactName || undefined,
      emergencyContactPhone: data.emergencyContactPhone || undefined,
      emergencyContactRelation: data.emergencyContactRelation || undefined,
      primaryDoctorId: data.primaryDoctorId ?? undefined,
      departmentId: data.departmentId ?? undefined,
    });
    if (!result.success) {
      toast.error(result.error || t("updateFailed"));
      setError(result.error);
      return;
    }
    toast.success(t("patientUpdated", { name: data.fullName }));
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(`/dashboard/patients?fullProfile=${patient.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <PatientFormFields
        form={form}
        doctors={doctors}
        departments={departments}
        bloodGroupDefaultValue={patient.bloodGroup ?? ""}
      />

      {error && (
        <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-destructive text-xs font-bold uppercase tracking-tight">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="pt-6">
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          size="sm"
          className="w-full h-10 rounded-lg text-[11px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-sm transition-all active:scale-[0.98]"
        >
          {isSubmitting ? t("updating") : t("updatePatientProfile")}
        </Button>
      </div>
    </form>
  );
}
