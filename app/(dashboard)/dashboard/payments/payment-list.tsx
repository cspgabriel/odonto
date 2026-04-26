"use client";

import React, { useState, useCallback, useMemo, memo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { CreditCard, ChevronUp, ChevronDown, ChevronsUpDown, Edit, Trash2 } from "lucide-react";
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
import { EmptyState } from "@/components/ui/empty-state";
import { RecordPaymentForm } from "./record-payment-form";
import { deletePayment } from "@/lib/actions/payment-actions";
import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";
import { toast } from "sonner";
import type { RecordPaymentFormValues } from "@/lib/validations/payment";
import { useTranslations } from "@/lib/i18n";

export type PaymentRow = {
  id: string;
  patientId: string;
  invoiceId: string | null;
  invoiceNumber: string | null;
  amount: string | null;
  paymentMethod: string | null;
  transactionId: string;
  rawTransactionId?: string | null;
  description: string;
  status: string;
  createdAt: Date;
  patientName: string | null;
};

function paymentStatusDisplay(status: string, t: (k: string) => string): { label: string; className: string } {
  if (status === "completed") {
    return { label: t("statusCompleted"), className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
  }
  if (status === "failed") {
    return { label: t("statusFailed"), className: "bg-rose-500/10 text-rose-600 dark:text-rose-400" };
  }
  return { label: t("statusPending"), className: "bg-amber-500/10 text-amber-600 dark:text-amber-400" };
}

function methodDisplay(method: string | null, t: (k: string) => string): string {
  if (!method) return "—";
  const m = method.trim().toLowerCase();
  if (m === "card") return t("methodCreditCard");
  if (m === "insurance") return t("methodInsurance");
  if (m === "bank transfer") return t("methodBankTransfer");
  if (m === "cash") return t("methodCash");
  if (m === "check") return t("methodCheck");
  return method.trim();
}

const PaymentTableRow = memo(function PaymentTableRow({
  payment,
  isSelected,
  onToggleRow,
  onEdit,
  onDelete,
  onViewPatient,
  canEdit,
  canDelete,
}: {
  payment: PaymentRow;
  isSelected: boolean;
  onToggleRow: (id: string) => void;
  onEdit: (payment: PaymentRow) => void;
  onDelete: (id: string) => void;
  onViewPatient?: (patientId: string) => void;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");
  const statusConfig = paymentStatusDisplay(payment.status, t);
  const amount = Number(payment.amount ?? 0);
  const dateStr = payment.createdAt
    ? new Date(payment.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "—";
  const shortId = payment.id.replace(/-/g, "").slice(0, 24);
  const patientButton = onViewPatient ? (
    <Button variant="link" className="h-auto p-0 font-semibold text-slate-900 dark:text-white hover:text-primary justify-start text-sm" onClick={() => onViewPatient(payment.patientId)}>
      {payment.patientName ?? "—"}
    </Button>
  ) : (
    <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">{payment.patientName ?? "—"}</span>
  );

  return (
    <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
      <TableCell className="pl-6 py-4 align-middle">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleRow(payment.id)}
          className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
        />
      </TableCell>
      <TableCell className="pl-2 py-4 align-middle">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{shortId}</span>
          <span className="font-semibold text-slate-900 dark:text-white text-sm">
            {t("tableInvoice")}: {payment.invoiceNumber ?? "—"}
          </span>
          {onViewPatient ? (
            <Button variant="link" className="h-auto p-0 font-medium text-slate-700 dark:text-slate-300 hover:text-primary justify-start text-sm" onClick={() => onViewPatient(payment.patientId)}>
              {payment.patientName ?? "—"}
            </Button>
          ) : (
            <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">{payment.patientName ?? "—"}</span>
          )}
        </div>
      </TableCell>
      <TableCell className="py-4 align-middle">
        {patientButton}
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm tabular-nums">
          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount)}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span className="font-medium text-slate-700 dark:text-slate-300 text-sm">
          {methodDisplay(payment.paymentMethod, t)}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span className={`font-semibold text-sm whitespace-nowrap px-2 py-1 rounded-md ${statusConfig.className}`}>
          {statusConfig.label}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
          {dateStr}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
          {payment.transactionId}
        </span>
      </TableCell>
      <TableCell className="text-right pr-6 py-4 align-middle">
        <div className="flex items-center justify-end gap-1">
          {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            onClick={() => onEdit(payment)}
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
            <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E] data-[state=open]:animate-none data-[state=closed]:animate-none sm:zoom-in-100 sm:slide-in-from-bottom-0 sm:fade-in-100 duration-0 transition-none">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading text-lg font-bold">{t("deleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 text-sm">
                  {t("deleteDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 gap-2">
                <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">{tCommon("cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(payment.id)}
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

function SortableHeader({
  label,
  sortKey,
  alignRight,
}: {
  label: string;
  sortKey: string;
  alignRight?: boolean;
}) {
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
      type="button"
      onClick={toggleSort}
      className={`flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors select-none ${alignRight ? "ml-auto justify-end" : ""} ${isActive ? "text-slate-900 dark:text-white" : ""}`}
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

export function PaymentList({
  payments: list,
  searchContent,
  createAction,
  canEdit = true,
  canDelete = true,
  children,
}: {
  payments: PaymentRow[];
  searchContent?: React.ReactNode;
  createAction?: React.ReactNode;
  canEdit?: boolean;
  canDelete?: boolean;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("payments");
  const { openFullProfile } = useFullProfileSheet();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editPayment, setEditPayment] = useState<PaymentRow | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const toggleRow = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedRows(new Set(list.map((p) => p.id)));
    else setSelectedRows(new Set());
  };

  const handleEdit = useCallback((payment: PaymentRow) => {
    setEditPayment(payment);
    setEditSheetOpen(true);
  }, []);

  const handleDelete = useCallback((paymentId: string) => {
    const promise = deletePayment({ paymentId });
    toast.promise(promise, {
      loading: t("deletingPayment"),
      success: () => {
        router.refresh();
        return t("paymentDeleted");
      },
      error: t("failedToDeletePayment"),
    });
  }, [router, t]);

  const editFormValues = useMemo<RecordPaymentFormValues | null>(
    () =>
      editPayment
        ? {
            patientId: editPayment.patientId,
            invoiceId: editPayment.invoiceId ?? null,
            amount: Number(editPayment.amount ?? 0),
            paymentMethod: editPayment.paymentMethod ?? "",
            transactionId: editPayment.rawTransactionId ?? editPayment.transactionId ?? "",
            description: editPayment.description,
            status: editPayment.status as "completed" | "pending" | "failed",
          }
        : null,
    [editPayment]
  );

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<CreditCard className="h-6 w-6" />}
        title={t("listEmptyTitle")}
        description={t("listEmptyDescription")}
        action={createAction ?? undefined}
      />
    );
  }

  return (
    <>
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
              <TableHead className="pl-6 w-[50px]">
                <Checkbox
                  checked={selectedRows.size === list.length && list.length > 0}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                  className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
                />
              </TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest pl-2 w-[240px]">
                <SortableHeader label={t("tablePayment")} sortKey="createdAt" />
              </TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px]">
                {t("tablePatient")}
              </TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
                {t("tableAmount")}
              </TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px]">
                {t("tableMethod")}
              </TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
                {t("tableStatus")}
              </TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[160px]">
                {t("tableDate")}
              </TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px]">
                {t("tableTransactionId")}
              </TableHead>
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[100px]">
                {t("tableActions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((payment) => (
              <PaymentTableRow
                key={payment.id}
                payment={payment}
                isSelected={selectedRows.has(payment.id)}
                onToggleRow={toggleRow}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewPatient={openFullProfile}
                canEdit={canEdit}
                canDelete={canDelete}
              />
            ))}
          </TableBody>
        </Table>
        {children}
      </div>

      <Sheet open={editSheetOpen} onOpenChange={(open) => !open && (setEditSheetOpen(false), setEditPayment(null))}>
        <SheetContent
          side="right"
          className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
        >
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
              {t("editPayment")}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {editPayment && editFormValues && (
              <RecordPaymentForm
                editId={editPayment.id}
                editValues={editFormValues}
                onSuccess={() => {
                  setEditSheetOpen(false);
                  setEditPayment(null);
                  router.refresh();
                }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
