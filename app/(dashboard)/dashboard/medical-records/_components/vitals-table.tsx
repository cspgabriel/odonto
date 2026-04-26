"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
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
import { Activity, ChevronUp, ChevronDown, ChevronsUpDown, Eye, Pencil, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { deleteVitals } from "@/lib/actions/medical-records-actions";
import { VitalsRecordSheet } from "./vitals-record-sheet";

export type VitalsRow = {
  id: string;
  patientId: string;
  patientName: string | null;
  recordedAt: Date;
  recordedByName: string | null;
  bloodPressureSystolic: number | null;
  bloodPressureDiastolic: number | null;
  heartRate: number | null;
  temperature: number | string | null;
  weight: string | null;
  height: string | null;
  bmi: string | null;
  createdAt: Date;
};

const AVATAR_COLORS = [
  "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
  "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
  "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  "bg-purple-50 text-purple-600 dark:bg-purple-500/10",
  "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10",
];

function getInitials(name: string | null): string {
  return (name ?? "")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function SortableHeader({
  label,
  sortKey,
}: {
  label: string;
  sortKey: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentSortBy = searchParams.get("sortBy") ?? "recordedAt";
  const currentSortOrder = searchParams.get("sortOrder") ?? "desc";
  const isActive = currentSortBy === sortKey;

  const toggleSort = () => {
    const params = new URLSearchParams(searchParams);
    if (isActive) {
      params.set("sortOrder", currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", sortKey);
      params.set("sortOrder", "desc");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <button
      onClick={toggleSort}
      className={`flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors select-none ${isActive ? "text-slate-900 dark:text-white" : ""}`}
    >
      {label}
      {isActive ? (
        currentSortOrder === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

export function VitalsTable({
  list,
  searchContent,
  children,
}: {
  list: VitalsRow[];
  searchContent?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("medicalRecords");
  const { openFullProfile } = useFullProfileSheet();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sheetRow, setSheetRow] = useState<VitalsRow | null>(null);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [sheetOpen, setSheetOpen] = useState(false);

  const openSheet = (row: VitalsRow, mode: "view" | "edit") => {
    setSheetRow(row);
    setSheetMode(mode);
    setSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    if (sheetRow?.id === id) {
      setSheetOpen(false);
      setSheetRow(null);
    }
    const promise = deleteVitals(id);
    toast.promise(promise, {
      loading: "Deleting vitals record...",
      success: () => {
        router.refresh();
        return "Vitals record deleted.";
      },
      error: "Failed to delete vitals record.",
    });
  };

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

  const formatBP = (s: number | null, d: number | null) =>
    s != null && d != null ? `${s}/${d}` : "—";

  if (list.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
        {searchContent && (
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
            {searchContent}
          </div>
        )}
        <EmptyState
          icon={<Activity className="h-6 w-6" />}
          title={t("emptyNoVitals")}
          description={t("emptyNoVitalsDescription")}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      {searchContent && (
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
          {searchContent}
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
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest pl-2 w-[220px]">
              Patient
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px]">
              <SortableHeader label="Recorded" sortKey="recordedAt" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[90px]">
              BP
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[70px] hidden md:table-cell">
              HR
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[70px] hidden lg:table-cell">
              Temp
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[80px]">
              Weight
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
              <TableCell className="pl-2 py-4 align-middle">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-slate-200/60 dark:border-slate-800 shadow-sm shrink-0">
                    <AvatarFallback
                      className={`text-xs font-bold ${getAvatarColor(row.patientId)}`}
                    >
                      {getInitials(row.patientName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <Button
                      variant="link"
                      className="h-auto p-0 font-bold text-slate-900 dark:text-white hover:text-primary justify-start"
                      onClick={() => openFullProfile(row.patientId)}
                    >
                      {row.patientName ?? "—"}
                    </Button>
                    {row.recordedByName && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        by {row.recordedByName}
                      </span>
                    )}
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4 align-middle font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                {row.recordedAt ? format(new Date(row.recordedAt), "yyyy-MM-dd HH:mm") : "—"}
              </TableCell>
              <TableCell className="py-4 align-middle font-semibold text-slate-700 dark:text-slate-300 text-sm tabular-nums">
                {formatBP(row.bloodPressureSystolic, row.bloodPressureDiastolic)}
              </TableCell>
              <TableCell className="py-4 align-middle hidden md:table-cell font-semibold text-slate-700 dark:text-slate-300 text-sm tabular-nums">
                {row.heartRate != null ? row.heartRate : "—"}
              </TableCell>
              <TableCell className="py-4 align-middle hidden lg:table-cell font-semibold text-slate-700 dark:text-slate-300 text-sm tabular-nums">
                {row.temperature != null ? row.temperature : "—"}
              </TableCell>
              <TableCell className="py-4 align-middle font-semibold text-slate-700 dark:text-slate-300 text-sm tabular-nums">
                {row.weight ?? "—"}
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
                        <AlertDialogTitle className="font-heading text-lg font-bold">Delete Vitals Record?</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-sm">
                          Vitals for <span className="font-bold text-slate-900 dark:text-white">{row.patientName ?? "this patient"}</span> recorded on{" "}
                          {row.recordedAt ? format(new Date(row.recordedAt), "PP") : "—"} will be permanently deleted. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(row.id)}
                          className="font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-6"
                        >
                          Delete
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
      <VitalsRecordSheet
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) setSheetRow(null);
        }}
        row={sheetRow}
        mode={sheetMode}
      />
      {children}
    </div>
  );
}
