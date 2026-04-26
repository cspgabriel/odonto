"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
import Link from "next/link";
import { Calendar, ChevronRight, ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal, Edit, Trash2, Loader2, Phone, MapPin, Activity, Copy, Mail, Check, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { usePreferences } from "@/contexts/preferences-context";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { toast } from "sonner";
import { FullProfileButton } from "@/components/dashboard/full-profile-button";
import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format, differenceInYears } from "date-fns";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useSidebar } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { updateAppointmentStatus, deleteAppointment, getAppointmentById, getDoctorsWithDepartment } from "@/lib/actions/appointment-actions";
import { getServices } from "@/lib/actions/service-actions";
import { formatDoctorName } from "@/lib/utils/staff-display";
import { AppointmentSearch } from "./appointment-search";
import { getPatients } from "@/lib/actions/patient-actions";
import { EditAppointmentForm } from "./edit-appointment-form";

function getInitials(name: string): string {
  return (name ?? "")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
  "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
  "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  "bg-purple-50 text-purple-600 dark:bg-purple-500/10",
  "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10",
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function SortableHeader({ label, sortKey, alignRight }: { label: string; sortKey: string; alignRight?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const currentSortBy = searchParams.get("sortBy") ?? "date";
  const currentOrder = searchParams.get("sortOrder") ?? "desc";
  const isActive = currentSortBy === sortKey;
  
  const toggleSort = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", sortKey);
    params.set("sortOrder", isActive && currentOrder === "desc" ? "asc" : "desc");
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <button 
      onClick={toggleSort}
      className={`flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors select-none ${alignRight ? 'ml-auto justify-end' : ''} ${isActive ? 'text-slate-900 dark:text-white' : ''}`}
    >
      {label}
      {isActive ? (
        currentOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

type AppointmentRow = {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  notes?: string | null;
  patientId: string;
  doctorId: string;
  serviceId?: string | null;
  patient: { fullName: string } | null;
  doctor: { fullName: string; specialization?: string | null } | null;
  serviceName?: string | null;
  serviceDuration?: number | null;
  invoiceId?: string | null;
};

export function AppointmentList({
  appointments: list,
  doctors,
  currentDoctorId,
  currentUserId,
  initialEditId,
  canEdit = true,
  canDelete = true,
  canViewBilling = false,
  canExport = false,
  children,
  searchContent,
}: {
  appointments: AppointmentRow[];
  doctors: { id: string; fullName: string }[];
  currentDoctorId?: string;
  currentUserId: string;
  initialEditId?: string;
  canEdit?: boolean;
  canDelete?: boolean;
  canViewBilling?: boolean;
  canExport?: boolean;
  children?: React.ReactNode;
  searchContent?: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("appointments");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const { openFullProfile } = useFullProfileSheet();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const { formatDate, formatTime } = usePreferences();
  const [editAppointmentId, setEditAppointmentId] = useState<string | null>(initialEditId ?? null);
  const [editAppointmentData, setEditAppointmentData] = useState<{
    id: string;
    patientId: string;
    doctorId: string;
    serviceId?: string | null;
    startTime: Date | string;
    endTime: Date | string;
    notes?: string | null;
  } | null>(null);
  const [editDoctors, setEditDoctors] = useState<{ id: string; fullName: string; specialization: string | null; departmentName: string | null }[]>([]);
  const [editPatients, setEditPatients] = useState<{ id: string; fullName: string }[]>([]);
  const [editServices, setEditServices] = useState<{ id: string; name: string; duration: number }[]>([]);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);

  // Using try-catch or optional just in case, but SidebarProvider wraps Dashboard layouts securely.
  const sidebar = useSidebar();
  const isSidebarOpen = sidebar?.state === "expanded";

  useEffect(() => {
    if (initialEditId) setEditAppointmentId(initialEditId);
  }, [initialEditId]);

  useEffect(() => {
    async function loadEditAppointment() {
      if (!editAppointmentId) {
        setEditAppointmentData(null);
        setEditDoctors([]);
        setEditPatients([]);
        setEditServices([]);
        return;
      }
      setIsLoadingEdit(true);
      try {
        const [aptResult, doctorsList, patientsList, servicesResult] = await Promise.all([
          getAppointmentById(editAppointmentId),
          getDoctorsWithDepartment(),
          getPatients(),
          getServices(),
        ]);
        if (aptResult.success) {
          const apt = aptResult.data;
          setEditAppointmentData({
            id: apt.id,
            patientId: apt.patientId,
            doctorId: apt.doctorId,
            serviceId: apt.serviceId ?? undefined,
            startTime: apt.startTime,
            endTime: apt.endTime,
            notes: apt.notes ?? undefined,
          });
        } else {
          toast.error(tCommon("failedToLoadAppointment"));
        }
        setEditDoctors(doctorsList ?? []);
        setEditPatients(patientsList ?? []);
        if (servicesResult.success && servicesResult.data) {
          setEditServices(
            servicesResult.data.map((s) => ({
              id: s.id,
              name: s.name,
              duration: s.duration ?? 0,
            }))
          );
        } else {
          setEditServices([]);
        }
      } catch {
        toast.error(tCommon("networkError"));
      } finally {
        setIsLoadingEdit(false);
      }
    }
    loadEditAppointment();
  }, [editAppointmentId]);

  function handlePatientClick(patientId: string) {
    if (isSidebarOpen && sidebar?.setOpen) {
      sidebar.setOpen(false);
    }
    openFullProfile(patientId);
  }

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(list.map((apt) => apt.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  function onDoctorChange(value: string) {
    if (value === "all") {
      router.push("/dashboard/appointments");
    } else {
      router.push(`/dashboard/appointments?doctorId=${value}`);
    }
  }

  const isEmpty = list.length === 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      {searchContent && (
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
          {React.isValidElement(searchContent)
            ? React.cloneElement(searchContent as React.ReactElement<any>, { 
                selectedCount: selectedRows.size,
                canDelete,
                canExport,
                onDeleteSelected: canDelete ? async () => {
                  const ids = Array.from(selectedRows);
                  const promise = Promise.all(ids.map(id => deleteAppointment({ appointmentId: id })));
                  toast.promise(promise, {
                    loading: t("deletingAppointments", { count: ids.length }),
                    success: () => {
                      setSelectedRows(new Set());
                      router.refresh();
                      return t("appointmentsDeleted", { count: ids.length });
                    },
                    error: t("failedToDeleteAppointments"),
                  });
                } : undefined,
                onClearSelection: () => setSelectedRows(new Set())
              })
            : searchContent}
        </div>
      )}
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent transition-none">
            <TableHead className="pl-6 w-[50px]">
              <Checkbox 
                checked={selectedRows.size === list.length && list.length > 0} 
                onCheckedChange={(checked) => toggleAll(!!checked)}
                className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
              />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest pl-2 w-[250px]">
              <SortableHeader label={t("tablePatient")} sortKey="patient" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px]">
              <SortableHeader label={t("tableDate")} sortKey="date" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px]">
              <SortableHeader label={t("tableTime")} sortKey="time" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[200px]">
              <SortableHeader label={t("tableDoctor")} sortKey="doctor" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[160px]">
              {t("tableService")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[160px]">
              <SortableHeader label={t("tableStatus")} sortKey="status" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[100px]">
              {tCommon("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isEmpty ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={8} className="h-60">
                <EmptyState
                  icon={<Calendar className="h-6 w-6" />}
                  title={t("emptyTitle")}
                  description={t("emptyDescription")}
                />
              </TableCell>
            </TableRow>
          ) : (
            list.map((apt) => (
              <TableRow key={apt.id} className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
                <TableCell className="pl-6 py-4 align-middle">
                  <Checkbox 
                      checked={selectedRows.has(apt.id)} 
                      onCheckedChange={() => toggleRow(apt.id)}
                      className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
                    />
                </TableCell>
                <TableCell className="pl-2 py-4 align-middle">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-slate-200/60 dark:border-slate-800 shadow-sm shrink-0">
                    <AvatarFallback className={`text-xs font-bold ${getAvatarColor(apt.patientId)}`}>
                      {getInitials(apt.patient?.fullName ?? "")}
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="link" className="h-auto p-0 font-bold text-slate-900 dark:text-white hover:text-primary" onClick={() => handlePatientClick(apt.patientId)}>
                    {apt.patient?.fullName ?? "—"}
                  </Button>
                </div>
              </TableCell>
              <TableCell className="py-4 align-middle">
                <div className="flex flex-col justify-center">
                  <span className="font-semibold text-slate-900 dark:text-white text-sm whitespace-nowrap">
                    {formatDate(apt.startTime)}
                  </span>
                  {apt.notes && (
                    <p className="mt-1 text-[11px] text-slate-500 line-clamp-1 max-w-[140px]">{apt.notes}</p>
                  )}
                </div>
              </TableCell>
              <TableCell className="py-4 align-middle">
                <div className="flex flex-col justify-center">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                    {formatTime(apt.startTime)}
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 text-xs font-medium mt-0.5 whitespace-nowrap">
                    {t("to")} {formatTime(apt.endTime)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="py-4 align-middle font-medium text-slate-600 dark:text-slate-300">
                {formatDoctorName(apt.doctor?.fullName ?? null, apt.doctor?.specialization ?? null)}
              </TableCell>
              <TableCell className="py-4 align-middle font-medium text-slate-600 dark:text-slate-300 text-sm">
                {apt.serviceName ?? "—"}
              </TableCell>
              <TableCell className="py-4 align-middle">
                {canEdit ? (
                  <UpdateStatusButton appointmentId={apt.id} currentStatus={apt.status} tStatus={tStatus} />
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {tStatus(apt.status as "pending" | "confirmed" | "completed" | "cancelled")}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right pr-6 py-4 align-middle">
                <div className="flex items-center justify-end gap-1">
                  {apt.status === "completed" && apt.invoiceId && canViewBilling && (
                    <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-primary" asChild>
                      <Link href={`/dashboard/invoices/${apt.invoiceId}`}>
                        <FileText className="h-4 w-4 mr-1" />
                        {t("invoice")}
                      </Link>
                    </Button>
                  )}
                  {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-bold"
                      onClick={() => setEditAppointmentId(apt.id)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">{tCommon("edit")}</span>
                    </Button>
                  )}
                  {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{tCommon("delete")}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading text-lg font-bold">{t("deleteConfirmTitle")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-sm">
                          {t("deleteConfirmDescription", { name: apt.patient?.fullName ?? "" })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">{tCommon("cancel")}</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={async () => {
                            const promise = deleteAppointment({ appointmentId: apt.id });
                            toast.promise(promise, {
                              loading: t("deletingAppointment"),
                              success: () => {
                                router.refresh();
                                return t("appointmentDeleted");
                              },
                              error: t("failedToDeleteAppointment"),
                            });
                          }}
                          className="font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-6"
                        >
                          {tCommon("confirmDelete")}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
      </Table>
      {children}

      {/* Edit Appointment Drawer */}
      <Sheet open={!!editAppointmentId} onOpenChange={(open) => !open && setEditAppointmentId(null)}>
        <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">{t("editAppointment")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingEdit ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p className="text-sm font-medium">{t("loadingAppointment")}</p>
              </div>
            ) : editAppointmentData ? (
              <EditAppointmentForm
                appointment={editAppointmentData}
                doctors={editDoctors}
                patients={editPatients}
                services={editServices}
                onSuccess={() => {
                  setEditAppointmentId(null);
                  router.refresh();
                }}
              />
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

function UpdateStatusButton({
  appointmentId,
  currentStatus,
  tStatus,
}: {
  appointmentId: string;
  currentStatus: string;
  tStatus: (key: string) => string;
}) {
  const router = useRouter();
  const t = useTranslations("appointments");
  const tToast = useTranslations("toast");
  const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);
  const [isLoading, setIsLoading] = useState(false);
  const statuses = ["pending", "confirmed", "completed", "cancelled"] as const;

  useEffect(() => {
    setOptimisticStatus(currentStatus);
  }, [currentStatus]);

  async function handleUpdate(newStatus: string) {
    const previous = optimisticStatus;
    setOptimisticStatus(newStatus);
    setIsLoading(true);
    try {
      const result = await updateAppointmentStatus({
        appointmentId,
        status: newStatus as "pending" | "confirmed" | "completed" | "cancelled",
      });
      if (result.success) {
        toast.success(t("statusUpdated", { status: tStatus(newStatus) }));
        router.refresh();
      } else {
        setOptimisticStatus(previous);
        toast.error(result.error || t("failedToUpdateStatus"));
      }
    } catch {
      setOptimisticStatus(previous);
      toast.error(tToast("actionFailed"));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Select
      value={optimisticStatus}
      onValueChange={handleUpdate}
      disabled={isLoading}
    >
      <SelectTrigger className={`w-[130px] h-8 text-xs font-bold capitalize rounded-full px-3 border-transparent transition-all outline-none focus:ring-2 focus:ring-primary/30 ${
        optimisticStatus === "completed" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400" :
        optimisticStatus === "confirmed" ? "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400" :
        optimisticStatus === "cancelled" ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400" :
        "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
      }`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
        {statuses.map((s) => (
          <SelectItem key={s} value={s} className="cursor-pointer font-bold text-xs capitalize">
            {tStatus(s)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
