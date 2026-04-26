"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { deleteExpense } from "@/lib/actions/expense-actions";
import { useExpenseData } from "@/hooks/use-expense-data";
import { EditExpenseForm } from "./edit-expense-form";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import {
  Zap,
  Wrench,
  Users,
  MoreHorizontal,
  Shield,
  DollarSign,
  CreditCard,
  FileText,
  Landmark,
  Edit,
  Trash2,
  Check,
  Clock,
  AlertTriangle,
  Loader2,
  Wallet,
} from "lucide-react";
export type ExpenseRow = {
  id: string;
  title: string;
  description: string | null;
  amount: string;
  category: string;
  paymentMethod: string;
  status: string;
  date: Date;
  vendor: string | null;
  departmentName: string | null;
  submittedByName: string | null;
  vendorName: string | null;
  inventoryName: string | null;
};

const CATEGORY_ICONS: Record<string, typeof Zap> = {
  utilities: Zap,
  equipment: Wrench,
  maintenance: Wrench,
  staff: Users,
  other: MoreHorizontal,
  insurance: Shield,
};

const PAYMENT_ICONS: Record<string, typeof DollarSign> = {
  cash: DollarSign,
  card: CreditCard,
  check: FileText,
  "bank transfer": Landmark,
};

function getStatusConfig(status: string, t: (k: string) => string): { label: string; icon: typeof Check; className: string } {
  if (status === "paid") {
    return { label: t("statusPaid"), icon: Check, className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" };
  }
  if (status === "cancelled") {
    return { label: t("statusCancelled"), icon: AlertTriangle, className: "bg-slate-100 dark:bg-slate-800 text-amber-600 dark:text-amber-400" };
  }
  return { label: t("statusPending"), icon: Clock, className: "bg-blue-500/10 text-blue-600 dark:text-blue-400" };
}

function getCategoryLabel(category: string, t: (k: string) => string): string {
  const k = `category${category.charAt(0).toUpperCase() + category.slice(1)}`;
  if (["categoryUtilities", "categoryEquipment", "categoryMaintenance", "categoryStaff", "categoryInsurance", "categoryOther"].includes(k)) {
    return t(k);
  }
  return category;
}

function CategoryIcon({ category }: { category: string }) {
  const Icon = CATEGORY_ICONS[category] ?? MoreHorizontal;
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/40">
      <Icon className="h-4 w-4 text-slate-600 dark:text-slate-400" />
    </div>
  );
}

function PaymentIcon({ method }: { method: string }) {
  const Icon = PAYMENT_ICONS[method?.toLowerCase()] ?? DollarSign;
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-200/80 dark:border-blue-800/60 bg-blue-50/80 dark:bg-blue-950/40">
      <Icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
    </div>
  );
}

export function ExpenseList({
  list,
  searchContent,
  canEdit = true,
  canDelete = true,
  createAction,
  children,
}: {
  list: ExpenseRow[];
  searchContent?: React.ReactNode;
  canEdit?: boolean;
  canDelete?: boolean;
  createAction?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const { formatAmount, formatDate } = usePreferences();
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const { data: expenseDetail, isLoading } = useExpenseData(editExpenseId);

  const handleDelete = useCallback(
    (id: string) => {
      const promise = deleteExpense(id);
      toast.promise(promise, {
        loading: t("deletingExpense"),
        success: () => {
          router.refresh();
          return t("expenseDeleted");
        },
        error: t("failedToDeleteExpense"),
      });
    },
    [router, t]
  );

  const toggleRow = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = (checked: boolean) => {
    if (checked) setSelectedRows(new Set(list.map((e) => e.id)));
    else setSelectedRows(new Set());
  };

  if (list.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
        {searchContent && (
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
            <div className="flex flex-col sm:flex-row items-center w-full gap-3">{searchContent}{createAction && <div className="shrink-0 w-full sm:w-auto">{createAction}</div>}</div>
          </div>
        )}
        <EmptyState
          icon={<Wallet className="h-6 w-6" />}
          title={t("listEmptyTitle")}
          description={t("listEmptyDescription")}
          action={createAction ?? undefined}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      {searchContent && (
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex flex-col sm:flex-row items-center w-full gap-3">{searchContent}{createAction && <div className="shrink-0 w-full sm:w-auto">{createAction}</div>}</div>
        </div>
      )}
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent transition-none">
            <TableHead className="pl-6 w-[50px]">
              <Checkbox
                checked={selectedRows.size === list.length && list.length > 0}
                onCheckedChange={(c) => toggleAll(!!c)}
                className="translate-y-0.5 border-slate-300 dark:border-slate-700"
              />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest pl-2 w-[220px]">
              {t("tableTitle")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px]">
              {t("tableCategory")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              {t("tableAmount")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px]">
              {t("tablePaymentMethod")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              {t("tableStatus")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[110px]">
              {t("tableDate")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px] hidden lg:table-cell">
              {t("tableDepartment")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px]">
              {t("tableLinkedTo")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px] hidden xl:table-cell">
              {t("tableSubmittedBy")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[100px]">
              {t("tableActions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((exp) => {
            const statusConfig = getStatusConfig(exp.status, t);
            const StatusIcon = statusConfig.icon;
            return (
              <TableRow
                key={exp.id}
                className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
              >
                <TableCell className="pl-6 py-4 align-middle">
                  <Checkbox
                    checked={selectedRows.has(exp.id)}
                    onCheckedChange={() => toggleRow(exp.id)}
                    className="translate-y-0.5 border-slate-300 dark:border-slate-700"
                  />
                </TableCell>
                <TableCell className="pl-2 py-4 align-middle">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-bold text-slate-900 dark:text-white">{exp.title}</span>
                    {exp.description && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 max-w-[200px]">
                        {exp.description}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 align-middle">
                  <div className="flex items-center gap-2">
                    <CategoryIcon category={exp.category} />
                    <span className="text-sm font-medium">{getCategoryLabel(exp.category, t)}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4 align-middle font-bold tabular-nums">
                  {formatAmount(parseFloat(exp.amount))}
                </TableCell>
                <TableCell className="py-4 align-middle">
                  <div className="flex items-center gap-2">
                    <PaymentIcon method={exp.paymentMethod} />
                    <span className="text-sm font-medium capitalize">{exp.paymentMethod}</span>
                  </div>
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
                  {formatDate(exp.date)}
                </TableCell>
                <TableCell className="py-4 align-middle hidden lg:table-cell text-sm text-slate-700 dark:text-slate-300">
                  {exp.departmentName ?? "—"}
                </TableCell>
                <TableCell className="py-4 align-middle text-sm text-slate-700 dark:text-slate-300">
                  {exp.vendorName ?? exp.inventoryName ?? exp.vendor ?? "—"}
                </TableCell>
                <TableCell className="py-4 align-middle hidden xl:table-cell text-sm text-slate-700 dark:text-slate-300">
                  {exp.submittedByName ?? "—"}
                </TableCell>
                <TableCell className="text-right pr-6 py-4 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    {canEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800"
                      onClick={() => setEditExpenseId(exp.id)}
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
                          className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
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
                            {t("deleteDescription", { title: exp.title })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 gap-2">
                          <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">
                            {tCommon("cancel")}
                          </AlertDialogCancel>
                          <AlertDialogAction
                            className="font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-6"
                            onClick={() => handleDelete(exp.id)}
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

      {/* Edit Expense Sheet */}
      <Sheet open={!!editExpenseId} onOpenChange={(open) => !open && setEditExpenseId(null)}>
        <SheetContent
          side="right"
          className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
        >
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
              {t("editExpense")}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[200px] text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p className="text-sm font-medium">{t("loadingExpense")}</p>
              </div>
            ) : expenseDetail ? (
              <EditExpenseForm
                expense={expenseDetail}
                onSuccess={() => {
                  setEditExpenseId(null);
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
