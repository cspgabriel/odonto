"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, Pencil, Tag, Trash2 } from "lucide-react";
import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";
import { DiagnosisSheet } from "./diagnosis-sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteDiagnosis } from "@/lib/actions/medical-records-actions";
import { formatDoctorName } from "@/lib/utils/staff-display";
import { toast } from "sonner";
import { format } from "date-fns";

export type DiagnosisRow = {
  id: string;
  patientId: string;
  patientName: string | null;
  title: string;
  icdCode: string | null;
  status: "active" | "resolved";
  diagnosedAt: Date;
  createdAt: Date;
  doctorName: string | null;
  doctorSpecialization: string | null;
};

export function DiagnosesTable({
  list,
  searchContent,
  children,
}: {
  list: DiagnosisRow[];
  searchContent?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("medicalRecords");
  const tCommon = useTranslations("common");
  const { openFullProfile } = useFullProfileSheet();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sheetRow, setSheetRow] = useState<DiagnosisRow | null>(null);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [sheetOpen, setSheetOpen] = useState(false);

  function openSheet(row: DiagnosisRow, mode: "view" | "edit") {
    setSheetRow(row);
    setSheetMode(mode);
    setSheetOpen(true);
  }

  async function handleDelete(id: string) {
    if (sheetRow?.id === id) {
      setSheetOpen(false);
      setSheetRow(null);
    }
    const promise = deleteDiagnosis(id);
    toast.promise(promise, {
      loading: "Deleting diagnosis...",
      success: () => {
        router.refresh();
        return "Diagnosis deleted.";
      },
      error: (e) => e?.message ?? "Failed to delete.",
    });
  }

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedRows(checked ? new Set(list.map((r) => r.id)) : new Set());
  };

  async function handleBulkDelete() {
    const ids = Array.from(selectedRows);
    if (sheetRow && ids.includes(sheetRow.id)) {
      setSheetOpen(false);
      setSheetRow(null);
    }
    const promise = Promise.all(ids.map((id) => deleteDiagnosis(id)));
    toast.promise(promise, {
      loading: `Deleting ${ids.length} diagnosis${ids.length === 1 ? "" : "es"}...`,
      success: () => {
        setSelectedRows(new Set());
        router.refresh();
        return `${ids.length} deleted.`;
      },
      error: (e) => e?.message ?? "Failed to delete.",
    });
  }

  const toolbarContent =
    searchContent && React.isValidElement(searchContent)
      ? React.cloneElement(searchContent as React.ReactElement<{ selectedCount?: number; onDeleteSelected?: () => void; onClearSelection?: () => void }>, {
          selectedCount: selectedRows.size,
          onDeleteSelected: handleBulkDelete,
          onClearSelection: () => setSelectedRows(new Set()),
        })
      : searchContent;

  if (list.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
        {toolbarContent && (
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-nowrap items-center gap-2 min-w-0">
            {toolbarContent}
          </div>
        )}
        <EmptyState
          icon={<Tag className="h-6 w-6" />}
          title={t("emptyNoDiagnoses")}
          description={t("emptyNoDiagnosesDescription")}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 flex flex-nowrap items-center gap-2 min-w-0">
        {toolbarContent}
      </div>
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent transition-none">
            <TableHead className="pl-6 w-[50px]">
              <Checkbox
                checked={selectedRows.size === list.length && list.length > 0}
                onCheckedChange={(c) => toggleAll(!!c)}
                className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
              />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[180px]">
              Patient
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[220px]">
              Title
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[160px] hidden md:table-cell">
              Doctor
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              ICD Code
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              Status
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px]">
              Date
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[180px]">
              ACTIONS
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((row) => (
            <TableRow
              key={row.id}
              className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
            >
              <TableCell className="pl-6 py-4 align-middle">
                <Checkbox
                  checked={selectedRows.has(row.id)}
                  onCheckedChange={() => toggleRow(row.id)}
                  className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
                />
              </TableCell>
              <TableCell className="py-4 align-middle">
                <Button variant="link" className="h-auto p-0 font-bold text-slate-900 dark:text-white hover:text-primary justify-start" onClick={() => openFullProfile(row.patientId)}>
                  {row.patientName ?? "—"}
                </Button>
              </TableCell>
              <TableCell className="py-4 align-middle font-semibold text-slate-700 dark:text-slate-300 text-sm">
                {row.title}
              </TableCell>
              <TableCell className="py-4 align-middle hidden md:table-cell font-medium text-slate-600 dark:text-slate-300 text-sm">
                {formatDoctorName(row.doctorName ?? null, row.doctorSpecialization ?? null)}
              </TableCell>
              <TableCell className="py-4 align-middle font-semibold text-slate-700 dark:text-slate-300 text-sm">
                {row.icdCode ?? "—"}
              </TableCell>
              <TableCell className="py-4 align-middle">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                    row.status === "active"
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {row.status}
                </span>
              </TableCell>
              <TableCell className="py-4 align-middle font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                {row.diagnosedAt ? format(new Date(row.diagnosedAt), "yyyy-MM-dd") : "—"}
              </TableCell>
              <TableCell className="text-right pr-6 py-4 align-middle">
                <div className="flex items-center justify-end gap-0.5">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    onClick={() => openSheet(row, "view")}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="sr-only">View</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/10 transition-all"
                    onClick={() => openSheet(row, "edit")}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading">Delete diagnosis?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-sm">
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(row.id)}
                          className="font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-6"
                        >
                          Confirm Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <DiagnosisSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        row={sheetRow}
        mode={sheetMode}
      />
      {children}
    </div>
  );
}
