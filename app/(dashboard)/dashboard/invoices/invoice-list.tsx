"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { usePreferences } from "@/contexts/preferences-context";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteInvoice } from "@/lib/actions/invoice-actions";
import { useInvoiceData } from "@/hooks/use-invoice-data";
import { EditInvoiceForm } from "./edit-invoice-form";
import { toast } from "sonner";
import { FileText, Edit, Trash2, Check, Clock, AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "@/lib/i18n";

export type InvoiceRow = {
  id: string;
  invoiceNumber: string | null;
  totalAmount: string;
  status: string;
  issuedAt: Date;
  dueAt: Date | null;
  patientId: string | null;
  patientName: string | null;
  patientEmail: string | null;
  patientPhone: string | null;
  doctorName: string | null;
  serviceName: string | null;
  departmentName: string | null;
  itemCount: number;
};

function getStatusConfig(
  status: string,
  dueAt: Date | null,
  t: (key: string) => string
): { label: string; icon: typeof Check; className: string } {
  if (status === "paid") {
    return {
      label: t("statusPaid"),
      icon: Check,
      className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    };
  }
  if (status === "cancelled") {
    return {
      label: t("statusCancelled"),
      icon: AlertTriangle,
      className: "bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400",
    };
  }
  const overdue = status === "unpaid" && dueAt && new Date(dueAt) < new Date();
  if (overdue) {
    return {
      label: t("statusOverdue"),
      icon: AlertTriangle,
      className: "bg-red-500/10 text-red-600 dark:text-red-400",
    };
  }
  return {
    label: t("statusPending"),
    icon: Clock,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  };
}

export function InvoiceList({
  list,
  searchContent,
  createAction,
  canEdit = true,
  canDelete = true,
  children,
}: {
  list: InvoiceRow[];
  searchContent?: React.ReactNode;
  createAction?: React.ReactNode;
  canEdit?: boolean;
  canDelete?: boolean;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("invoices");
  const tCommon = useTranslations("common");
  const { formatAmount, formatDate } = usePreferences();
  const { openFullProfile } = useFullProfileSheet();
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const { data: invoiceDetail, isLoading: isLoadingInvoice } = useInvoiceData(editInvoiceId);

  const handleDelete = useCallback(
    (invoiceId: string) => {
      const promise = deleteInvoice({ invoiceId });
      toast.promise(promise, {
        loading: t("deletingInvoice"),
        success: () => {
          router.refresh();
          return t("invoiceDeleted");
        },
        error: t("failedToDeleteInvoice"),
      });
    },
    [router, t]
  );

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-6 w-6" />}
        title={t("listEmptyTitle")}
        description={t("listEmptyDescription")}
        action={createAction ?? undefined}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      {searchContent && (
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex flex-col sm:flex-row items-center w-full gap-3">
            {searchContent}
            {createAction && <div className="shrink-0 w-full sm:w-auto">{createAction}</div>}
          </div>
        </div>
      )}
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent transition-none">
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest pl-6 w-[140px]">
              {t("tableInvoiceNumber")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[160px]">
              {t("tablePatient")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px] hidden lg:table-cell">
              {t("tableDoctor")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px] hidden xl:table-cell">
              {t("tableService")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px] hidden xl:table-cell">
              {t("tableDepartment")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[90px]">
              {t("tableAmount")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              {t("tableStatus")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[90px]">
              {t("tableDate")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[100px]">
              {t("tableActions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((inv) => {
            const amount = parseFloat(inv.totalAmount);
            const statusConfig = getStatusConfig(inv.status, inv.dueAt, t);
            const StatusIcon = statusConfig.icon;
            const isOverdue = inv.status === "unpaid" && inv.dueAt && new Date(inv.dueAt) < new Date();
            const isPending = inv.status === "unpaid" && !isOverdue;
            const invNum = inv.invoiceNumber ?? `INV-${inv.id.slice(0, 8).toUpperCase()}`;

            return (
              <TableRow
                key={inv.id}
                className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
              >
                <TableCell className="pl-6 py-4 align-middle">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200/80 bg-blue-50/80 dark:border-blue-800/60 dark:bg-blue-950/40">
                      <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="font-bold text-slate-900 dark:text-white truncate">
                        {invNum}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t("itemCount", { count: inv.itemCount })}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 align-middle">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    {inv.patientId ? (
                      <Button
                        variant="link"
                        className="h-auto p-0 font-bold text-slate-900 dark:text-white hover:text-primary justify-start"
                        onClick={() => openFullProfile(inv.patientId!)}
                      >
                        {inv.patientName ?? "—"}
                      </Button>
                    ) : (
                      <span className="font-bold text-slate-900 dark:text-white">
                        {inv.patientName ?? "—"}
                      </span>
                    )}
                    {(inv.patientPhone ?? inv.patientEmail) && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 truncate block max-w-[140px]">
                        {inv.patientPhone ?? inv.patientEmail}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 align-middle hidden lg:table-cell">
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    {inv.doctorName ? `Dr. ${inv.doctorName}` : "—"}
                  </span>
                </TableCell>
                <TableCell className="py-4 align-middle hidden xl:table-cell">
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate block max-w-[120px]">
                    {inv.serviceName ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="py-4 align-middle hidden xl:table-cell">
                  <span className="text-sm text-slate-700 dark:text-slate-300 truncate block max-w-[100px]">
                    {inv.departmentName ?? "—"}
                  </span>
                </TableCell>
                <TableCell className="py-4 align-middle">
                  <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                    {formatAmount(amount)}
                  </span>
                </TableCell>
                <TableCell className="py-4 align-middle">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium ${statusConfig.className}`}
                  >
                    <StatusIcon className="h-3.5 w-3.5 shrink-0" />
                    {statusConfig.label}
                  </span>
                </TableCell>
                <TableCell className="py-4 align-middle text-sm text-slate-700 dark:text-slate-300">
                  {formatDate(inv.issuedAt)}
                </TableCell>
                <TableCell className="text-right pr-6 py-4 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      onClick={() => setEditInvoiceId(inv.id)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">{t("srEdit")}</span>
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
                          <span className="sr-only">{t("srDelete")}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-heading text-lg font-bold">
                            {t("deleteTitle")}
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-500 text-sm">
                            {t("deleteDescription", {
                              invoiceNumber: invNum,
                              patientName: inv.patientName ?? "this patient",
                            })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 gap-2">
                          <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">
                            {tCommon("cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-6"
                            onClick={() => handleDelete(inv.id)}
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
          })}
        </TableBody>
      </Table>
      {children}

      {/* Edit Invoice Sheet (sidebar like patient) */}
      <Sheet open={!!editInvoiceId} onOpenChange={(open) => !open && setEditInvoiceId(null)}>
        <SheetContent
          side="right"
          className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
        >
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
              {t("editInvoice")}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingInvoice ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p className="text-sm font-medium">{t("loadingInvoice")}</p>
              </div>
            ) : invoiceDetail ? (
              <EditInvoiceForm
                data={invoiceDetail}
                onSuccess={() => {
                  setEditInvoiceId(null);
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
