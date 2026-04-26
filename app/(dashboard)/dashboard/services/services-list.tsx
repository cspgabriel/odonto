"use client";

import React, { useState, useCallback, memo, useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Edit, Trash2, Loader2, ChevronUp, ChevronDown, ChevronsUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
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
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteService, getServiceById } from "@/lib/actions/service-actions";
import { toast } from "sonner";
import { UpdateServiceForm } from "./[id]/edit/update-service-form";

interface Service {
  id: string;
  name: string;
  description: string | null;
  price: string | null;
  duration: number | null;
  departmentId: string | null;
  status?: string;
  departmentName?: string | null;
}

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

const ServiceTableRow = memo(function ServiceTableRow({
  service,
  isSelected,
  onToggleRow,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  isDeleting,
  t,
  tCommon,
}: {
  service: Service;
  isSelected: boolean;
  onToggleRow: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (service: Service) => void;
  canEdit: boolean;
  canDelete: boolean;
  isDeleting: boolean;
  t: ReturnType<typeof useTranslations>;
  tCommon: ReturnType<typeof useTranslations>;
}) {
  return (
    <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group">
      {canEdit && (
        <TableCell className="pl-6 py-4 align-middle">
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleRow(service.id)}
            className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
          />
        </TableCell>
      )}
      <TableCell className={canEdit ? "pl-2 py-4" : "pl-6 py-4"} style={{ width: canEdit ? undefined : undefined }}>
        <span className="font-semibold text-slate-900 dark:text-white">{service.name}</span>
      </TableCell>
      <TableCell className="py-4 max-w-xs truncate text-muted-foreground">
        {service.description || tCommon("notSpecified")}
      </TableCell>
      <TableCell className="py-4 font-semibold text-slate-700 dark:text-slate-300">
        {service.price
          ? new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(Number(service.price))
          : tCommon("notSpecified")}
      </TableCell>
      <TableCell className="py-4 text-muted-foreground">
        {service.duration ? `${service.duration} ${t("min")}` : tCommon("notSpecified")}
      </TableCell>
      <TableCell className="py-4 text-muted-foreground">
        {service.departmentName || tCommon("notSpecified")}
      </TableCell>
      {(canEdit || canDelete) && (
        <TableCell className="text-right pr-6 py-4">
          <div className="flex items-center justify-end gap-1">
            {canEdit && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-500 hover:text-primary"
              onClick={() => onEdit(service.id)}
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">{tCommon("edit")}</span>
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
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  <span className="sr-only">{tCommon("delete")}</span>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-heading">
                    {t("deleteServiceTitle")}
                  </AlertDialogTitle>
                  <AlertDialogDescription className="text-slate-500">
                    {t("deleteServiceDescription", { name: service.name })}{" "}
                    {tCommon("deleteDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">
                    {tCommon("cancel")}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.preventDefault();
                      onDelete(service);
                    }}
                    disabled={isDeleting}
                    className="font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-6"
                  >
                    {isDeleting ? tCommon("deleting") : tCommon("confirmDelete")}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            )}
          </div>
        </TableCell>
      )}
    </TableRow>
  );
});

export function ServicesList({
  services: list,
  departments,
  canCreate = false,
  canEdit = false,
  canDelete = false,
  searchContent,
  children,
}: {
  services: Service[];
  departments: { id: string; name: string }[];
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  searchContent?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const t = useTranslations("services");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [isLoadingEdit, setIsLoadingEdit] = useState(false);
  type ServiceEditData = Extract<Awaited<ReturnType<typeof getServiceById>>, { success: true }>["data"];
  const [editServiceData, setEditServiceData] = useState<ServiceEditData>(null);

  useEffect(() => {
    if (!editServiceId) {
      setEditServiceData(null);
      return;
    }
    let cancelled = false;
    setIsLoadingEdit(true);
    getServiceById(editServiceId).then((result) => {
      if (cancelled) return;
      setIsLoadingEdit(false);
      if (result.success && result.data) {
        setEditServiceData(result.data);
      } else {
        setEditServiceId(null);
        toast.error(result.success ? t("serviceNotFound") : result.error);
      }
    });
    return () => { cancelled = true; };
  }, [editServiceId]);

  const toggleRow = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = (checked: boolean) => {
    setSelectedRows(checked ? new Set(list.map((s) => s.id)) : new Set());
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(
    async (service: Service) => {
      setDeletingId(service.id);
      const result = await deleteService(service.id);
      setDeletingId(null);
      if (result.success) {
        setSelectedRows((prev) => {
          const next = new Set(prev);
          next.delete(service.id);
          return next;
        });
        toast.success(t("deletedSuccess"));
        router.refresh();
      } else {
        toast.error(result.error ?? t("failedToDelete"));
      }
    },
    [router]
  );

  const handleBulkDelete = useCallback(async () => {
    const ids = Array.from(selectedRows);
    const results = await Promise.all(ids.map((id) => deleteService(id)));
    const failed = results.filter((r) => !r.success);
    if (failed.length === 0) {
      setSelectedRows(new Set());
      toast.success(t("bulkDeletedSuccess", { count: ids.length }));
      router.refresh();
    } else {
      toast.error(t("bulkDeleteFailed", { count: failed.length }));
    }
  }, [selectedRows, router]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      {searchContent && (
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
          {React.isValidElement(searchContent)
            ? React.cloneElement(searchContent as React.ReactElement<{
                selectedCount?: number;
                canDelete?: boolean;
                onDeleteSelected?: () => void;
                onClearSelection?: () => void;
              }>, {
                selectedCount: selectedRows.size,
                canDelete,
                onDeleteSelected: canDelete && selectedRows.size > 0 ? handleBulkDelete : undefined,
                onClearSelection: () => setSelectedRows(new Set()),
              })
            : searchContent}
        </div>
      )}
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent transition-none">
            {canEdit && (
              <TableHead className="pl-6 w-[50px]">
                <Checkbox
                  checked={selectedRows.size === list.length && list.length > 0}
                  onCheckedChange={(checked) => toggleAll(!!checked)}
                  className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
                />
              </TableHead>
            )}
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest pl-2 w-[220px]">
              <SortableHeader label={t("tableName")} sortKey="name" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              {t("tableDescription")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px]">
              <SortableHeader label={t("tablePrice")} sortKey="price" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              <SortableHeader label={t("tableDuration")} sortKey="duration" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px]">
              {t("tableDepartment")}
            </TableHead>
            {canEdit && (
              <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[100px]">
                {tCommon("actions").toUpperCase()}
              </TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((service) => (
            <ServiceTableRow
              key={service.id}
              service={service}
              isSelected={selectedRows.has(service.id)}
              onToggleRow={toggleRow}
              onEdit={(id) => setEditServiceId(id)}
              onDelete={handleDelete}
              canEdit={canEdit}
              canDelete={canDelete}
              isDeleting={deletingId === service.id}
              t={t}
              tCommon={tCommon}
            />
          ))}
        </TableBody>
      </Table>
      {children}

      {canEdit && (
        <Sheet
          open={!!editServiceId}
          onOpenChange={(open) => !open && setEditServiceId(null)}
        >
          <SheetContent
            side="right"
            className="w-full sm:w-[640px] sm:max-w-[640px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
          >
            <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
              <SheetTitle className="text-xl font-bold text-slate-900 dark:text-white">
                {t("editService")}
              </SheetTitle>
            </SheetHeader>
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingEdit ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                  <p className="text-sm font-medium">{t("loadingService")}</p>
                </div>
              ) : editServiceData ? (
                <UpdateServiceForm
                  service={editServiceData}
                  departments={departments}
                  onSuccess={() => {
                    setEditServiceId(null);
                    router.refresh();
                  }}
                />
              ) : null}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
