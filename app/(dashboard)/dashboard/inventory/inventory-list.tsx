"use client";

import React, { useState, useCallback, memo } from "react";
import { useTranslations } from "@/lib/i18n";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Edit, Eye, Loader2, Trash2 } from "lucide-react";
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
import { Package } from "lucide-react";
import { deleteInventoryItem } from "@/lib/actions/inventory-actions";
import type { inventory } from "@/lib/db/schema";
import { toast } from "sonner";
import { format } from "date-fns";

type InventoryItem = typeof inventory.$inferSelect;
type InventoryItemWithVendor = InventoryItem & { vendorName?: string | null };

function getStockStatus(item: InventoryItem): "in_stock" | "low_stock" | "out_of_stock" {
  const qty = item.quantity ?? 0;
  const min = item.minStock ?? 0;
  if (qty === 0) return "out_of_stock";
  if (qty <= min) return "low_stock";
  return "in_stock";
}

const InventoryTableRow = memo(function InventoryTableRow({
  item,
  isSelected,
  onToggleRow,
  onDelete,
  deletingId,
  canEdit = true,
  canDelete = true,
  t,
  tCommon,
}: {
  item: InventoryItemWithVendor;
  isSelected: boolean;
  onToggleRow: (id: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  canEdit?: boolean;
  canDelete?: boolean;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  const qty = item.quantity ?? 0;
  const min = item.minStock ?? 0;
  const unitPrice = Number(item.price ?? 0);
  const totalValue = qty * unitPrice;
  const status = getStockStatus(item);
  const unitLabel = (item.unit ?? "unit").toLowerCase();
  const unitsLabel = unitLabel === "unit" ? t("units") : unitLabel === "pcs" ? t("units") : unitLabel;

  const vendorName = item.vendorName ?? null;
  const subText =
    (item.manufacturer ?? "—") +
    (item.batchNumber ? ` • Batch: ${item.batchNumber}` : "") +
    (vendorName ? ` • Vendor: ${vendorName}` : "");

  return (
    <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
      <TableCell className="pl-6 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleRow(item.id)}
          className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
        />
      </TableCell>
      <TableCell className="pl-2 py-4 align-middle">
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{subText}</span>
        </div>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm lowercase">
          {item.category ?? "—"}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
            {qty} {unitsLabel}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{t("min")}: {min}</span>
        </div>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm tabular-nums">
          {unitPrice > 0
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(unitPrice)
            : "—"}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm tabular-nums">
          {totalValue > 0
            ? new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(totalValue)
            : "—"}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span className="font-semibold text-slate-600 dark:text-slate-400 text-sm">
          {item.expiryDate ? format(new Date(item.expiryDate), "MMM d, yyyy") : "—"}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span
          className={`inline-flex font-semibold text-sm whitespace-nowrap px-2 py-1 rounded-md ${
            status === "in_stock"
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : status === "low_stock"
                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}
        >
          {status === "in_stock" ? t("statusInStock") : status === "low_stock" ? t("statusLowStock") : t("statusOutOfStock")}
        </span>
      </TableCell>
      <TableCell className="text-right pr-6 py-4 align-middle">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            asChild
          >
            <Link href={`/dashboard/inventory/${item.id}`}>
              <Eye className="h-4 w-4" />
              <span className="sr-only">{t("viewDetails")}</span>
            </Link>
          </Button>
          {canEdit && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            asChild
          >
            <Link href={`/dashboard/inventory/${item.id}/edit`}>
              <Edit className="h-4 w-4" />
              <span className="sr-only">{tCommon("edit")}</span>
            </Link>
          </Button>
          )}
          {canDelete && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                disabled={!!deletingId}
              >
                {deletingId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="sr-only">{tCommon("delete")}</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-heading text-lg font-bold">
                  {t("deleteTitle")}
                </AlertDialogTitle>
                <AlertDialogDescription className="text-slate-500 text-sm">
                  {t("deleteDescription", { name: item.name })} {tCommon("deleteDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 gap-2">
                <AlertDialogCancel
                  disabled={!!deletingId}
                  className="font-bold border-slate-200 dark:border-slate-800 rounded-lg"
                >
                  {tCommon("cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(item.id)}
                  disabled={!!deletingId}
                  className="font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-6"
                >
                  {deletingId === item.id ? tCommon("deleting") : tCommon("confirmDelete")}
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

export function InventoryList({
  items: list,
  searchContent,
  createAction,
  children,
  canEdit = false,
  canDelete = true,
}: {
  items: InventoryItemWithVendor[];
  searchContent?: React.ReactNode;
  createAction?: React.ReactNode;
  children?: React.ReactNode;
  canEdit?: boolean;
  canDelete?: boolean;
}) {
  const t = useTranslations("inventory");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const toggleRow = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(
    (checked: boolean) => {
      if (checked) setSelectedRows(new Set(list.map((i) => i.id)));
      else setSelectedRows(new Set());
    },
    [list]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        const result = await deleteInventoryItem(id);
        if (result.success) {
          setSelectedRows((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          toast.success(t("deletedSuccess"));
          router.refresh();
        } else {
          toast.error(result.error ?? t("failedToDelete"));
        }
      } catch {
        toast.error(t("failedToDelete"));
      } finally {
        setDeletingId(null);
      }
    },
    [router]
  );

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Package className="h-6 w-6" />}
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
            ? React.cloneElement(
                searchContent as React.ReactElement<{
                  selectedCount?: number;
                  canDelete?: boolean;
                  onDeleteSelected?: () => void;
                  onClearSelection?: () => void;
                }>,
                {
                  selectedCount: selectedRows.size,
                  canDelete,
                  onDeleteSelected:
                    canDelete && selectedRows.size > 0
                      ? async () => {
                          const ids = Array.from(selectedRows);
                          setDeletingId(ids[0] ?? null);
                          let done = 0;
                          for (const id of ids) {
                            try {
                              const result = await deleteInventoryItem(id);
                              if (result.success) done++;
                              else toast.error(result.error ?? `Failed to delete ${id}`);
                            } catch {
                              toast.error(t("failedToDelete"));
                            }
                          }
                          setSelectedRows(new Set());
                          setDeletingId(null);
                          if (done > 0) {
                            toast.success(t("bulkDeletedSuccess", { count: done }));
                            router.refresh();
                          }
                        }
                      : undefined,
                  onClearSelection: () => setSelectedRows(new Set()),
                }
              )
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
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest pl-2 w-[200px]">
              {t("tableItemDetails")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px]">
              {t("tableCategory")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px]">
              {t("tableStockLevel")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              {t("tableUnitPrice")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[110px]">
              {t("tableTotalValue")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[110px]">
              {t("tableExpiryDate")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              {t("tableStatus")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[100px]">
              {tCommon("actions").toUpperCase()}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((item) => (
            <InventoryTableRow
              key={item.id}
              item={item}
              isSelected={selectedRows.has(item.id)}
              onToggleRow={toggleRow}
              onDelete={handleDelete}
              deletingId={deletingId}
              canEdit={canEdit}
              canDelete={canDelete}
              t={t}
              tCommon={tCommon}
            />
          ))}
        </TableBody>
      </Table>
      {children}
    </div>
  );
}
