"use client";

import React, { useState, useCallback, memo } from "react";
import { useTranslations } from "@/lib/i18n";
import Link from "next/link";
import { usePatientData } from "@/hooks/use-patient-data";
import { Users, MoreHorizontal, Edit, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, Loader2, Phone, MapPin, Activity, Calendar, Copy, Mail, Check } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { FullProfileButton } from "@/components/dashboard/full-profile-button";
import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { deletePatient } from "@/lib/actions/patient-actions";
import type { patients } from "@/lib/db/schema";
import { formatDoctorName } from "@/lib/utils/staff-display";
import { toast } from "sonner";
import { differenceInYears, format, formatDistanceToNow, subMonths } from "date-fns";
import { UpdatePatientForm } from "./[id]/edit/update-patient-form";
import { PatientSearch } from "./patient-search";

type Patient = typeof patients.$inferSelect & {
  doctorName?: string | null;
  departmentName?: string | null;
};

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

const PatientTableRow = memo(function PatientTableRow({
  patient: p,
  isSelected,
  onToggleRow,
  onPatientClick,
  onEdit,
  onDelete,
  t,
  tCommon,
  canEdit,
  canDelete,
}: {
  patient: Patient;
  isSelected: boolean;
  onToggleRow: (id: string) => void;
  onPatientClick: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  t: (key: string, values?: Record<string, string | number>) => string;
  tCommon: (key: string, values?: Record<string, string | number>) => string;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const age = p.dateOfBirth && !isNaN(new Date(p.dateOfBirth).getTime()) ? differenceInYears(new Date(), new Date(p.dateOfBirth)) : null;
  return (
    <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
      <TableCell className="pl-6 py-4 align-middle">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleRow(p.id)}
          className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
        />
      </TableCell>
      <TableCell className="pl-2 py-4 align-middle">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9 border border-slate-200/60 dark:border-slate-800 shadow-sm shrink-0">
            <AvatarFallback className={`text-xs font-bold ${getAvatarColor(p.id)}`}>
              {getInitials(p.fullName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <Button variant="link" className="h-auto p-0 font-bold text-slate-900 dark:text-white hover:text-primary justify-start" onClick={() => onPatientClick(p.id)}>
              {p.fullName}
            </Button>
          </div>
        </div>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
            {p.phone}
          </span>
          {p.email && (
            <span className="text-xs text-slate-500 font-medium line-clamp-1 block break-all">{p.email}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="py-4 align-middle hidden md:table-cell">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
            {age !== null ? `${age} ${tCommon("yrs")}` : "—"}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {p.dateOfBirth ?? "—"}
          </span>
        </div>
      </TableCell>
      <TableCell className="py-4 align-middle hidden lg:table-cell">
        <span className={`font-semibold text-sm whitespace-nowrap px-2 flex justify-center py-1 rounded-md max-w-min ${
          p.bloodGroup ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600" : "text-slate-400"
        }`}>
          {p.bloodGroup || "—"}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle hidden lg:table-cell">
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
          {p.updatedAt ? format(new Date(p.updatedAt), "yyyy-MM-dd") : "—"}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle hidden lg:table-cell">
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
          {p.doctorName ?? "—"}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle hidden lg:table-cell">
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
          {p.departmentName ?? "—"}
        </span>
      </TableCell>
      <TableCell className="text-right pr-6 py-4 align-middle">
        <div className="flex items-center justify-end gap-1">
          {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              onClick={() => onEdit(p.id)}
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
            <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E] data-[state=open]:animate-none data-[state=closed]:animate-none sm:zoom-in-100 sm:slide-in-from-bottom-0 sm:fade-in-100 duration-0 transition-none">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading text-lg font-bold">{t("deleteConfirmTitle")}</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 text-sm">
                  {t("deleteConfirmDescription", { name: p.fullName ?? "" })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 gap-2">
                <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">{tCommon("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(p.id)}
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
  );
});

function SortableHeader({ label, sortKey, alignRight }: { label: string; sortKey: string; alignRight?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const currentSortBy = searchParams.get("sortBy") ?? "createdAt";
  const currentSortOrder = searchParams.get("sortOrder") ?? "desc";
  const isActive = currentSortBy === sortKey;

  const toggleSort = () => {
    const params = new URLSearchParams(searchParams);
    if (isActive) {
      params.set("sortOrder", currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", sortKey);
      params.set("sortOrder", "asc");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <button 
      onClick={toggleSort}
      className={`flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors select-none ${alignRight ? 'ml-auto justify-end' : ''} ${isActive ? 'text-slate-900 dark:text-white' : ''}`}
    >
      {label}
      {isActive ? (
        currentSortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

export function PatientList({
  patients: list,
  createAction,
  children,
  searchContent,
  canEdit = true,
  canDelete = true,
  canExport = false,
}: {
  patients: Patient[];
  createAction?: React.ReactNode;
  children?: React.ReactNode;
  searchContent?: React.ReactNode;
  canEdit?: boolean;
  canDelete?: boolean;
  canExport?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("patients");
  const tCommon = useTranslations("common");
  const { openFullProfile } = useFullProfileSheet();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editPatientId, setEditPatientId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: editDetailData, isLoading: isLoadingEdit } = usePatientData(editPatientId);
  const editPatientData = editDetailData?.patient ?? null;

  const sidebar = useSidebar();
  const isSidebarOpen = sidebar?.state === "expanded";

  const handlePatientClick = useCallback((patientId: string) => {
    if (isSidebarOpen && sidebar?.setOpen) {
      sidebar.setOpen(false);
    }
    openFullProfile(patientId);
  }, [isSidebarOpen, sidebar?.setOpen, openFullProfile]);

  const toggleRow = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(list.map((p) => p.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleDelete = useCallback((patientId: string) => {
    const promise = deletePatient({ patientId });
    toast.promise(promise, {
      loading: t("deletingPatient"),
      success: () => {
        router.refresh();
        return t("patientDeleted");
      },
      error: t("failedToDeletePatient"),
    });
  }, [router]);

  const handleEdit = useCallback((patientId: string) => {
    setEditPatientId(patientId);
  }, []);

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-6 w-6" />}
        title={t("emptyTitle")}
        description={t("emptyDescription")}
        action={createAction ?? undefined}
      />
    );
  }

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
                  const promise = Promise.all(ids.map(id => deletePatient({ patientId: id })));
                  toast.promise(promise, {
                    loading: t("deletingPatients", { count: ids.length }),
                    success: () => {
                      setSelectedRows(new Set());
                      router.refresh();
                      return t("patientsDeleted", { count: ids.length });
                    },
                    error: t("failedToDeletePatients"),
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
              <SortableHeader label={t("tablePatient")} sortKey="name" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[200px]">
              <SortableHeader label={t("tableContact")} sortKey="contact" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px] hidden md:table-cell">
              <SortableHeader label={t("tableAge")} sortKey="dob" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px] hidden lg:table-cell">
              {t("tableBlood")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px] hidden lg:table-cell">
              {t("tableLastVisit")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[160px] hidden lg:table-cell">
              {t("tableDoctor").toUpperCase()}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px] hidden lg:table-cell">
              {t("tableDepartment").toUpperCase()}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[100px]">
              {tCommon("actions").toUpperCase()}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((p) => (
            <PatientTableRow
              t={t}
              tCommon={tCommon}
              key={p.id}
              patient={p}
              isSelected={selectedRows.has(p.id)}
              onToggleRow={toggleRow}
              onPatientClick={handlePatientClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          ))}
        </TableBody>
      </Table>
      {children}

      {/* Edit Patient Drawer */}
      <Sheet open={!!editPatientId} onOpenChange={(open) => !open && setEditPatientId(null)}>
        <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">{t("editPatient")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingEdit ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p className="text-sm font-medium">{t("loadingProfile")}</p>
              </div>
            ) : editPatientData ? (
              <UpdatePatientForm 
                patient={editPatientData} 
                onSuccess={() => {
                  setEditPatientId(null);
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
