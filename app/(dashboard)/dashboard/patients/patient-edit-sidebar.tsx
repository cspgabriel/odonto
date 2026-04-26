"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getDoctorsForPatientAssignment } from "@/lib/actions/patient-actions";
import { getDepartments } from "@/lib/actions/department-actions";
import { UpdatePatientForm } from "./[id]/edit/update-patient-form";
import type { patients } from "@/lib/db/schema";

type Patient = typeof patients.$inferSelect;

export function PatientEditSidebar({
  patient,
  open,
  onOpenChange,
  onSuccess,
}: {
  patient: Patient | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("patients");
  const tCommon = useTranslations("common");
  const [doctors, setDoctors] = useState<{ id: string; fullName: string; specialization: string | null }[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    Promise.all([getDoctorsForPatientAssignment(), getDepartments()])
      .then(([docList, deptResult]) => {
        setDoctors(docList);
        setDepartments(deptResult.success && deptResult.data ? deptResult.data : []);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const handleSuccess = () => {
    onSuccess?.();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("editPatientLabel")}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">{tCommon("loading")}</p>
            </div>
          ) : patient ? (
            <UpdatePatientForm
              patient={patient}
              doctors={doctors}
              departments={departments}
              onSuccess={handleSuccess}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
