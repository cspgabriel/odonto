"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileText, Trash2, Eye, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";
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
import { EmptyState } from "@/components/ui/empty-state";
import { deleteClinicalNote } from "@/lib/actions/medical-records-actions";
import { formatDoctorName } from "@/lib/utils/staff-display";
import { toast } from "sonner";
import { format } from "date-fns";
import { ClinicalNoteSheet, type ClinicalNoteRow } from "./clinical-note-sheet";

export type NoteRow = ClinicalNoteRow;

export function ClinicalNotesTable({
  list,
  searchContent,
  children,
}: {
  list: NoteRow[];
  searchContent?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("medicalRecords");
  const tCommon = useTranslations("common");
  const { openFullProfile } = useFullProfileSheet();
  const [sheetRow, setSheetRow] = useState<NoteRow | null>(null);
  const [sheetMode, setSheetMode] = useState<"view" | "edit">("view");
  const [sheetOpen, setSheetOpen] = useState(false);

  const openSheet = (row: NoteRow, mode: "view" | "edit") => {
    setSheetRow(row);
    setSheetMode(mode);
    setSheetOpen(true);
  };

  async function handleDelete(id: string) {
    if (sheetRow?.id === id) {
      setSheetOpen(false);
      setSheetRow(null);
    }
    const promise = deleteClinicalNote(id);
    toast.promise(promise, {
      loading: t("deletingNote"),
      success: () => {
        router.refresh();
        return t("noteDeleted");
      },
      error: (e) => (e instanceof Error ? e.message : tCommon("failedToDelete")),
    });
  }

  if (list.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
        {searchContent && (
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
            {searchContent}
          </div>
        )}
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={t("emptyNoClinicalNotes")}
          description={t("emptyNoClinicalNotesDescription")}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      {searchContent && (
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
          {searchContent}
        </div>
      )}
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent transition-none">
            <TableHead className="pl-6 font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[180px]">
              Patient
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px]">
              Author
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              Content
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[130px]">
              Date
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[160px]">
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
                <Button variant="link" className="h-auto p-0 font-bold text-slate-900 dark:text-white hover:text-primary justify-start" onClick={() => openFullProfile(row.patientId)}>
                  {row.patientName ?? "—"}
                </Button>
              </TableCell>
              <TableCell className="py-4 align-middle font-semibold text-slate-700 dark:text-slate-300 text-sm">
                {formatDoctorName(row.authorName ?? null, row.authorSpecialization ?? null)}
              </TableCell>
              <TableCell className="py-4 align-middle text-sm text-slate-700 dark:text-slate-300 line-clamp-2 max-w-[320px]">
                {row.content || "—"}
              </TableCell>
              <TableCell className="py-4 align-middle font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                {row.createdAt ? format(new Date(row.createdAt), "yyyy-MM-dd HH:mm") : "—"}
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
                        <AlertDialogTitle className="font-heading">Delete note?</AlertDialogTitle>
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
      <ClinicalNoteSheet
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
