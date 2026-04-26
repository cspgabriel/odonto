"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { createPatient } from "@/lib/actions/patient-actions";
import { patientFormSchema, type PatientFormValues } from "@/lib/validations/patient";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/lib/i18n";


import { PatientFormFields } from "@/components/dashboard/patients/patient-form-fields";
import { AlertCircle } from "lucide-react";

export function CreatePatientForm({
  onSuccess,
  doctors = [],
  departments = [],
}: {
  onSuccess?: () => void;
  doctors?: { id: string; fullName: string; specialization: string | null }[];
  departments?: { id: string; name: string }[];
} = {}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const t = useTranslations("forms.patient");
  const tToast = useTranslations("toast");

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      phone: "",
      email: "",
      gender: "",
      bloodGroup: "",
      height: "",
      weight: "",
      address: "",
      medicalHistory: "",
      allergies: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      primaryDoctorId: null,
      departmentId: null,
    },
  });

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = form;

  async function onSubmit(data: PatientFormValues) {
    setError(null);
    const payload = {
      fullName: data.fullName,
      dateOfBirth: data.dateOfBirth,
      phone: data.phone,
      email: data.email ?? undefined,
      gender: data.gender ?? undefined,
      bloodGroup: data.bloodGroup ?? undefined,
      height: data.height ?? undefined,
      weight: data.weight ?? undefined,
      address: data.address ?? undefined,
      medicalHistory: data.medicalHistory ?? undefined,
      allergies: data.allergies ?? undefined,
      emergencyContactName: data.emergencyContactName ?? undefined,
      emergencyContactPhone: data.emergencyContactPhone ?? undefined,
      emergencyContactRelation: data.emergencyContactRelation ?? undefined,
      primaryDoctorId: data.primaryDoctorId ?? undefined,
      departmentId: data.departmentId ?? undefined,
    };
    const result = await createPatient(payload);
    if (!result.success) {
      toast.error(result.error || tToast("actionFailed"));
      setError(result.error);
      return;
    }
    toast.success(tToast("patientCreated", { name: result.data.fullName }));
    if (onSuccess) {
      onSuccess();
      router.refresh();
    } else {
      router.push(`/dashboard/patients?fullProfile=${result.data.id}`);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <PatientFormFields
        form={form}
        doctors={doctors}
        departments={departments}
        labelOverrides={{
          fullName: t("fullName"),
          dateOfBirth: t("dateOfBirth"),
          phone: t("phone"),
          address: t("address"),
          medicalHistory: t("medicalHistory"),
        }}
        placeholderOverrides={{
          fullName: t("fullNamePlaceholder"),
          phone: t("phonePlaceholder"),
          address: t("addressPlaceholder"),
          medicalHistory: t("medicalHistoryPlaceholder"),
        }}
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
          className="w-full h-10 rounded-xl text-[11px] font-black uppercase tracking-widest bg-primary hover:bg-primary/90 shadow-md transition-all active:scale-[0.98]"
        >
          {isSubmitting ? "Synchronizing..." : t("createPatient")}
        </Button>
      </div>
    </form>
  );
}
