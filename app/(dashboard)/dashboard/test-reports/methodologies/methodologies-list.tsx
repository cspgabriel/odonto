"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Settings, Edit, Trash2 } from "lucide-react";
import { deleteTestMethodology, bulkDeleteTestMethodologies } from "@/lib/actions/lab-test-actions";
import { toast } from "sonner";
import { MethodologyForm } from "./methodology-form";

export type MethodologyWithCategory = {
  id: string;
  name: string;
  code: string | null;
  categoryId: string | null;
  description: string | null;
  principles: string | null;
  equipment: string | null;
  applications: string | null;
  advantages: string | null;
  limitations: string | null;
  sampleVolume: string | null;
  isActive: number;
  createdAt: Date;
  updatedAt: Date;
  categoryName: string | null;
};

export function MethodologiesList({
  methodologies: list,
  searchContent,
  createAction,
  children,
}: {
  methodologies: MethodologyWithCategory[];
  searchContent?: React.ReactNode;
  createAction?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("testReports");
  const tCommon = useTranslations("common");
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editId, setEditId] = useState<string | null>(null);
  const [editData, setEditData] = useState<MethodologyWithCategory | null>(null);

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const toggleAll = (checked: boolean) => {
    setSelectedRows(checked ? new Set(list.map((m) => m.id)) : new Set());
  };

  function handleDelete(id: string, name: string) {
    const promise = deleteTestMethodology(id).then((r) => {
      if (!r.success) throw new Error(r.error);
      return r;
    });
    toast.promise(promise, {
      loading: "Deleting methodology...",
      success: () => {
        router.refresh();
        return "Methodology deleted.";
      },
      error: (err) => (err instanceof Error ? err.message : "Failed to delete methodology."),
    });
  }

  if (list.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
        {searchContent && (
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">{searchContent}</div>
        )}
        <EmptyState
          icon={<Settings className="h-6 w-6" />}
          title={t("noMethodologiesFound")}
          description={t("noMethodologiesDescription")}
          action={createAction}
        />
      </div>
    );
  }

  const searchWithProps = searchContent && React.isValidElement(searchContent)
    ? React.cloneElement(searchContent as React.ReactElement<{ selectedCount?: number; onDeleteSelected?: () => void; onClearSelection?: () => void }>, {
        selectedCount: selectedRows.size,
        onDeleteSelected: async () => {
          const ids = Array.from(selectedRows);
          const promise = bulkDeleteTestMethodologies(ids).then((r) => {
            if (!r.success) throw new Error(r.error);
            return r;
          });
          toast.promise(promise, {
            loading: t("deletingMethodologiesCount", { count: ids.length }),
            success: () => {
              setSelectedRows(new Set());
              router.refresh();
              return t("methodologiesDeletedCount", { count: ids.length });
            },
            error: (err) => (err instanceof Error ? err.message : t("failedToDeleteMethodology")),
          });
        },
        onClearSelection: () => setSelectedRows(new Set()),
      })
    : searchContent;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      {searchWithProps && (
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">{searchWithProps}</div>
      )}
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
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest pl-2">
              {t("methodologyDetails")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              {t("code")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              {t("category")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              {t("equipment")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              {t("sampleVolume")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              {t("status")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((row) => (
            <TableRow key={row.id} className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
              <TableCell className="pl-6 py-4 align-middle">
                <Checkbox
                  checked={selectedRows.has(row.id)}
                  onCheckedChange={() => toggleRow(row.id)}
                  className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
                />
              </TableCell>
              <TableCell className="pl-2 py-4 align-middle font-medium">{row.name}</TableCell>
              <TableCell className="py-4 align-middle">{row.code ?? "—"}</TableCell>
              <TableCell className="py-4 align-middle">{row.categoryName ?? "—"}</TableCell>
              <TableCell className="py-4 align-middle">{row.equipment ?? "—"}</TableCell>
              <TableCell className="py-4 align-middle">{row.sampleVolume ?? "—"}</TableCell>
              <TableCell className="py-4 align-middle">
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                  row.isActive === 1 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                }`}>
                  {row.isActive === 1 ? t("active") : t("inactive")}
                </span>
              </TableCell>
              <TableCell className="text-right pr-6 py-4 align-middle">
                <div className="flex justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    onClick={() => { setEditData(row); setEditId(row.id); }}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">{tCommon("edit")}</span>
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all">
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{tCommon("delete")}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading text-lg font-bold">{t("deleteMethodologyTitle")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-sm">
                          {t("deleteMethodologyDescription", { name: row.name })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">{tCommon("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(row.id, row.name)}
                          className="font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-6"
                        >
                          {t("confirmDelete")}
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
      {children}

      <Sheet open={!!editId} onOpenChange={(o) => { if (!o) { setEditId(null); setEditData(null); } }}>
        <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">{t("editMethodology")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {editData && (
              <MethodologyForm
                methodology={editData}
                onSuccess={() => { setEditId(null); setEditData(null); router.refresh(); }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
