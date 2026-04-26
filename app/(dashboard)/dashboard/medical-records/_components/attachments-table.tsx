"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Paperclip, Trash2, ExternalLink } from "lucide-react";
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteAttachment } from "@/lib/actions/medical-records-actions";
import { toast } from "sonner";
import { format } from "date-fns";

type AttachmentRow = {
  id: string;
  patientId: string;
  patientName: string | null;
  fileName: string;
  fileUrl: string;
  fileType: string | null;
  appointmentId: string | null;
  createdAt: Date;
};

export function AttachmentsTable({
  list,
  searchContent,
  children,
}: {
  list: AttachmentRow[];
  searchContent?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("medicalRecords");
  const tCommon = useTranslations("common");
  const { openFullProfile } = useFullProfileSheet();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  async function handleDelete(id: string) {
    const promise = deleteAttachment(id);
    toast.promise(promise, {
      loading: t("deletingAttachment"),
      success: () => {
        router.refresh();
        return t("attachmentDeleted");
      },
      error: (e) => e?.message ?? tCommon("failedToDelete"),
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
    const promise = Promise.all(ids.map((id) => deleteAttachment(id)));
    toast.promise(promise, {
      loading: t("deletingAttachmentsCount", { count: ids.length }),
      success: () => {
        setSelectedRows(new Set());
        router.refresh();
        return t("attachmentsDeletedCount", { count: ids.length });
      },
      error: (e) => e?.message ?? tCommon("failedToDelete"),
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
          icon={<Paperclip className="h-6 w-6" />}
          title={t("emptyNoAttachments")}
          description={t("emptyNoAttachmentsDescription")}
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
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              File
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              Type
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[130px]">
              Date
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[120px]">
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
              <TableCell className="py-4 align-middle">
                <a
                  href={row.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-slate-700 dark:text-slate-300 text-sm hover:text-primary flex items-center gap-1.5"
                >
                  {row.fileName}
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </TableCell>
              <TableCell className="py-4 align-middle font-semibold text-slate-700 dark:text-slate-300 text-sm">
                {row.fileType ?? "—"}
              </TableCell>
              <TableCell className="py-4 align-middle font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                {row.createdAt ? format(new Date(row.createdAt), "yyyy-MM-dd HH:mm") : "—"}
              </TableCell>
              <TableCell className="text-right pr-6 py-4 align-middle flex items-center justify-end gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-primary"
                  asChild
                >
                  <a href={row.fileUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    <span className="sr-only">Open</span>
                  </a>
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
                      <AlertDialogTitle className="font-heading">Delete attachment?</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500 text-sm">
                        This will remove the attachment from the record. If the file was uploaded to CareNova storage, it will be deleted there as well.
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
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {children}
    </div>
  );
}
