"use client";

import * as React from "react";
import { useTranslations } from "@/lib/i18n";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, Edit, Trash2, Star } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
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
import { format } from "date-fns";
import { toast } from "sonner";
import { deleteLabVendor } from "@/lib/actions/lab-vendor-actions";
import type { LabVendorPageRow } from "@/lib/actions/lab-vendor-actions";
import { EditLabVendorSheet } from "./edit-lab-vendor-sheet";

const statusStyles: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
};

const tierStyles: Record<string, string> = {
  budget: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
  moderate: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
  premium: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300",
};

export function LabVendorsList({
  vendors: list,
  searchContent,
  createAction,
  children,
}: {
  vendors: LabVendorPageRow[];
  searchContent?: React.ReactNode;
  createAction?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const t = useTranslations("labVendors");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editVendor, setEditVendor] = useState<LabVendorPageRow | null>(null);

  const toggleRow = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = (checked: boolean) => {
    setSelectedRows(checked ? new Set(list.map((v) => v.id)) : new Set());
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedRows);
    const promise = Promise.all(ids.map((id) => deleteLabVendor(id)));
    toast.promise(promise, {
      loading: t("deletingCount", { count: ids.length }),
      success: () => {
        setSelectedRows(new Set());
        router.refresh();
        return t("deletedCount", { count: ids.length });
      },
      error: t("failedToDelete"),
    });
  };

  const handleDeleteOne = useCallback(
    async (id: string) => {
      const promise = deleteLabVendor(id);
      toast.promise(promise, {
        loading: t("deleting"),
        success: () => {
          router.refresh();
          return t("deleted");
        },
        error: t("failedToDelete"),
      });
    },
    [router]
  );

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Boxes className="h-6 w-6" />}
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
            ? React.cloneElement(searchContent as React.ReactElement<{
                selectedCount?: number;
                onDeleteSelected?: () => void;
                onClearSelection?: () => void;
              }>, {
                selectedCount: selectedRows.size,
                onDeleteSelected: handleDeleteSelected,
                onClearSelection: () => setSelectedRows(new Set()),
              })
            : searchContent}
        </div>
      )}
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent">
            <TableHead className="pl-6 w-[50px]">
              <Checkbox
                checked={selectedRows.size === list.length && list.length > 0}
                onCheckedChange={(checked) => toggleAll(!!checked)}
                className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
              />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tableVendorDetails")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tableContactInfo")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tableSpecialties")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tablePerformance")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tableContract")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tableStatus")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6">{t("tableActions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((v) => {
            const specs = (v.specialties ?? "").split(",").map((s) => s.trim()).filter(Boolean);
            const displaySpecs = specs.length > 2 ? `${specs.slice(0, 2).join(" ")} +${specs.length - 2} more` : specs.join(" ");
            return (
              <TableRow key={v.id} className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30">
                <TableCell className="pl-6 py-4 align-middle">
                  <Checkbox
                    checked={selectedRows.has(v.id)}
                    onCheckedChange={() => toggleRow(v.id)}
                    className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
                  />
                </TableCell>
                <TableCell className="py-4 align-middle">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-900 dark:text-white">{v.name}</span>
                    <span className="text-xs text-muted-foreground">
                      Code: {v.code ?? "—"} {v.labType ? `• ${v.labType}` : ""}
                    </span>
                    {v.rating != null && Number(v.rating) > 0 && (
                      <div className="flex items-center gap-0.5 mt-0.5" title={`${v.rating} / 5`}>
                        {[1, 2, 3, 4, 5].map((i) => {
                          const r = Number(v.rating) ?? 0;
                          const filled = r >= i;
                          const half = r >= i - 0.5 && r < i;
                          return (
                            <Star
                              key={i}
                              className={`h-3.5 w-3.5 shrink-0 ${
                                filled
                                  ? "fill-amber-400 text-amber-400"
                                  : half
                                    ? "fill-amber-400/60 text-amber-400"
                                    : "fill-transparent stroke-slate-300 text-slate-300 dark:stroke-slate-600 dark:text-slate-600"
                              }`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 align-middle text-sm text-muted-foreground">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{v.contactPerson ?? "—"}</span>
                    <span className="text-xs break-all">{v.email ?? "—"}</span>
                    {v.phone && <span className="text-xs">{v.phone}</span>}
                  </div>
                </TableCell>
                <TableCell className="py-4 align-middle text-sm text-muted-foreground">
                  {displaySpecs || "—"}
                </TableCell>
                <TableCell className="py-4 align-middle text-sm">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{v.testsCount} {t("tests")}</span>
                    <span className="text-xs text-muted-foreground">
                      {v.turnaroundHours ?? "—"} {t("hours")}
                    </span>
                    {v.tier && (
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium w-fit capitalize ${tierStyles[v.tier] ?? "bg-slate-100 text-slate-600"}`}>
                        {v.tier}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 align-middle text-sm text-muted-foreground">
                  <div className="flex flex-col gap-0.5">
                    {v.contractStartDate || v.contractEndDate ? (
                      <>
                        <span className="text-xs">
                          {v.contractStartDate ? format(new Date(v.contractStartDate), "MMM d, yyyy") : "—"} to{" "}
                          {v.contractEndDate ? format(new Date(v.contractEndDate), "MMM d, yyyy") : "—"}
                        </span>
                        {v.lastTestDate && (
                          <span className="text-xs text-slate-500">{t("lastTest")}: {format(new Date(v.lastTestDate), "MMM d, yyyy")}</span>
                        )}
                      </>
                    ) : (
                      "—"
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-4 align-middle">
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium capitalize ${statusStyles[v.status] ?? "bg-slate-100 text-slate-600"}`}>
                    {v.status === "active" ? t("statusActive") : v.status === "pending" ? t("statusPending") : v.status}
                  </span>
                </TableCell>
                <TableCell className="text-right pr-6 py-4 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditVendor(v)}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">{t("edit")}</span>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-600 hover:bg-rose-50">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t("delete")}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t("deleteVendorTitle")}</AlertDialogTitle>
                          <AlertDialogDescription>
                            {t("deleteVendorDescription", { name: v.name })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteOne(v.id)} className="bg-rose-600 hover:bg-rose-700">
                            {t("delete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <EditLabVendorSheet
        vendor={editVendor}
        open={!!editVendor}
        onOpenChange={(open) => !open && setEditVendor(null)}
      />
      {children}
    </div>
  );
}
