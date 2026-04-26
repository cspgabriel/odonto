"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "@/lib/i18n";
import { Loader2, Phone, Mail, Copy } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { getPatientById } from "@/lib/actions/patient-actions";
import { formatDoctorName } from "@/lib/utils/staff-display";
import { AppointmentHistory } from "./[id]/appointment-history";
import { PatientEditSidebar } from "./patient-edit-sidebar";
import { toast } from "sonner";
import { differenceInYears, format } from "date-fns";
import type { patients } from "@/lib/db/schema";

type Patient = typeof patients.$inferSelect;

function getInitials(name: string): string {
  return (name ?? "")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

type PatientFullProfileSheetProps = {
  patientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole?: string;
  canEdit?: boolean;
  canViewMedicalHistory?: boolean;
};

export function PatientFullProfileSheet({
  patientId,
  open,
  onOpenChange,
  userRole = "receptionist",
  canEdit: canEditProp,
  canViewMedicalHistory = false,
}: PatientFullProfileSheetProps) {
  type PatientData = {
    patient: {
      id: string;
      fullName: string;
      dateOfBirth: string | null;
      phone: string | null;
      email: string | null;
      address: string | null;
      gender: string | null;
      bloodGroup: string | null;
      height: string | null;
      weight: string | null;
      allergies: string | null;
      medicalHistory: string | null;
      emergencyContactName: string | null;
      emergencyContactPhone: string | null;
      emergencyContactRelation: string | null;
      primaryDoctor?: { fullName: string | null; specialization: string | null } | null;
      department?: { name: string | null } | null;
    };
    appointments: unknown[];
  };
  const t = useTranslations("patients");
  const [data, setData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editSidebarOpen, setEditSidebarOpen] = useState(false);

  const fetchPatient = useCallback(() => {
    if (!patientId || !open) return;
    setLoading(true);
    getPatientById({ patientId })
      .then((result) => {
        if (result.success && result.data) {
          const p = result.data.patient as PatientData["patient"];
          setData({
            patient: p,
            appointments: result.data.appointments ?? [],
          });
        } else {
          toast.error(t("failedToLoadPatient"));
        }
      })
      .catch(() => toast.error(t("failedToLoadPatient")))
      .finally(() => setLoading(false));
  }, [patientId, open]);

  useEffect(() => {
    if (!patientId || !open) {
      setData(null);
      return;
    }
    fetchPatient();
  }, [patientId, open, fetchPatient]);

  const handleOpenChange = (next: boolean) => {
    if (!next) setEditSidebarOpen(false);
    onOpenChange(next);
  };

  const handleEditSuccess = useCallback(() => {
    fetchPatient();
  }, [fetchPatient]);

  const canEdit = canEditProp ?? false;
  const showMedicalHistory = canViewMedicalHistory;
  const patient = data?.patient;
  const appointments = data?.appointments ?? [];

  return (
    <>
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        className="inset-x-0 mx-auto bottom-0 w-full sm:w-[calc(100%-2rem)] max-w-[1240px] max-h-[96vh] h-[97vh] flex flex-col p-0 gap-0 rounded-t-[2rem] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] overflow-hidden shadow-2xl data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("profileTitle")}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6 w-full">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-400 w-full">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">{t("loadingProfile")}</p>
            </div>
          ) : patient ? (
            <div className="w-full max-w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Patient header: row card with large avatar (no badges), demographics, and accent colors */}
              <div className="lg:col-span-2 flex flex-col sm:flex-row sm:items-center gap-6 p-6 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900/50 dark:to-slate-800/30">
                <div className="flex items-center gap-4 min-w-0">
                  <Avatar className="h-24 w-24 shrink-0 rounded-full border-2 border-slate-200/80 dark:border-slate-600 bg-white dark:bg-slate-800/80">
                    <AvatarFallback className="rounded-full bg-slate-200/90 text-slate-600 dark:bg-slate-600 dark:text-slate-200 text-xl font-bold">
                      {getInitials(patient.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white truncate">
                      {patient.fullName}
                    </h2>
                    {(patient.email || patient.phone) && (
                      <p className="text-sm text-muted-foreground mt-0.5 truncate">
                        {patient.email ?? patient.phone ?? ""}
                      </p>
                    )}
                    {canEdit && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 rounded-lg border-primary/50 text-primary hover:bg-primary/10 hover:text-primary"
                        onClick={() => setEditSidebarOpen(true)}
                      >
                        {t("editPatientLabel")}
                      </Button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-3 sm:ml-auto sm:pl-6 sm:border-l border-slate-200/60 dark:border-slate-700">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("sexLabel")}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.gender ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("ageLabel")}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      {patient.dateOfBirth && !isNaN(new Date(patient.dateOfBirth).getTime())
                        ? `${differenceInYears(new Date(), new Date(patient.dateOfBirth))} yrs`
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("bloodLabel")}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.bloodGroup ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("statusLabel")}</p>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {t("statusActive")}
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("dobLabel")}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.dateOfBirth ?? "—"}</p>
                  </div>
                  {patient.department && (
                    <div className="col-span-2 sm:col-span-1">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{t("departmentLabel")}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.department.name ?? "—"}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Personal Information */}
              <Card className="lg:col-span-2 border-l-4 border-l-slate-200 dark:border-l-slate-700">
                <CardHeader>
                  <CardTitle className="text-base text-slate-900 dark:text-white">{t("personalInformation")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("fullNameLabel")}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.fullName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("dateOfBirthLabel")}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.dateOfBirth ? format(new Date(patient.dateOfBirth), "MMMM d, yyyy") : "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("ageLabel")}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {patient.dateOfBirth && !isNaN(new Date(patient.dateOfBirth).getTime()) ? `${differenceInYears(new Date(), new Date(patient.dateOfBirth))} years` : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("genderLabel")}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.gender ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("bloodGroupLabel")}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.bloodGroup ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card className="lg:col-span-2 border-l-4 border-l-blue-200 dark:border-l-blue-800/50">
                <CardHeader>
                  <CardTitle className="text-base text-slate-900 dark:text-white">{t("contactInformation")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("phoneLabel")}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.phone ?? "—"}</p>
                        {patient.phone && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" onClick={() => { navigator.clipboard.writeText(patient.phone!); toast.success(t("copied")); }}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-primary" asChild>
                              <a href={`tel:${patient.phone}`}><Phone className="h-3.5 w-3.5" /></a>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("emailLabel")}</p>
                      <div className="flex items-center gap-2 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{patient.email ?? "—"}</p>
                        {patient.email && (
                          <>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-slate-400 hover:text-primary" onClick={() => { navigator.clipboard.writeText(patient.email!); toast.success(t("copied")); }}>
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-slate-400 hover:text-primary" asChild>
                              <a href={`mailto:${patient.email}`}><Mail className="h-3.5 w-3.5" /></a>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("addressLabel")}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.address ?? "—"}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Emergency Contact */}
              <Card className="lg:col-span-2 border-l-4 border-l-rose-200 dark:border-l-rose-800/50 bg-rose-50/30 dark:bg-rose-500/5">
                <CardHeader>
                  <CardTitle className="text-base text-slate-900 dark:text-white">{t("emergencyContact")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("nameLabel")}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.emergencyContactName ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("phoneLabel")}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.emergencyContactPhone ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("relationshipLabel")}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.emergencyContactRelation ?? "—"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Medical Information (height, weight, allergies, medical history) */}
              <Card className="lg:col-span-2 border-l-4 border-l-emerald-200 dark:border-l-emerald-800/50 bg-emerald-50/20 dark:bg-emerald-500/5">
                <CardHeader>
                  <CardTitle className="text-base text-slate-900 dark:text-white">{t("medicalInformation")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("heightLabel")}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.height ?? "—"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("weightLabel")}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.weight ?? "—"}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("allergiesLabel")}</p>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">{patient.allergies ?? t("noneRecorded")}</p>
                  </div>
                  {showMedicalHistory && (
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">{t("medicalHistoryLabel")}</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white whitespace-pre-wrap">{patient.medicalHistory ?? t("noneRecorded")}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {(patient.primaryDoctor || patient.department) && (
                <Card className="border-l-4 border-l-blue-200 dark:border-l-blue-800/60">
                  <CardHeader>
                    <CardTitle className="text-base text-slate-900 dark:text-white">{t("careTeam")}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm text-muted-foreground">
                    {patient.primaryDoctor && (
                      <p>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{t("primaryDoctorLabel")}: </span>
                        {formatDoctorName(
                          patient.primaryDoctor.fullName ?? null,
                          patient.primaryDoctor.specialization ?? null
                        )}
                      </p>
                    )}
                    {patient.department && (
                      <p>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{t("departmentLabel")}: </span>
                        {patient.department.name ?? "—"}
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="lg:col-span-2">
                <AppointmentHistory appointments={appointments} patientId={patient.id} />
              </div>

              <Card className="lg:col-span-2 border-l-4 border-l-slate-300 dark:border-l-slate-600">
                <CardHeader>
                  <CardTitle className="text-base text-slate-900 dark:text-white">{t("relatedRecords")}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700 hover:bg-primary/10 hover:text-primary hover:border-primary/30" asChild>
                    <Link href={`/dashboard/appointments?patientId=${patient.id}`}>{t("appointmentsLink")}</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700 hover:bg-primary/10 hover:text-primary hover:border-primary/30" asChild>
                    <Link href={`/dashboard/medical-records?patientId=${patient.id}`}>{t("medicalRecordsLink")}</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700 hover:bg-primary/10 hover:text-primary hover:border-primary/30" asChild>
                    <Link href={`/dashboard/prescriptions?patientId=${patient.id}`}>{t("prescriptionsLink")}</Link>
                  </Button>
                  <Button variant="outline" size="sm" className="border-slate-200 dark:border-slate-700 hover:bg-primary/10 hover:text-primary hover:border-primary/30" asChild>
                    <Link href={`/dashboard/test-reports?patientId=${patient.id}`}>{t("testReportsLink")}</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>

    <PatientEditSidebar
      patient={patient ? (patient as Patient) : null}
      open={editSidebarOpen}
      onOpenChange={setEditSidebarOpen}
      onSuccess={handleEditSuccess}
    />
    </>
  );
}
