"use client";

import React, { useState, useCallback, memo } from "react";
import { useTranslations } from "@/lib/i18n";
import { useDepartmentData } from "@/hooks/use-department-data";
import {
  Building2,
  Calendar,
  CheckCircle,
  DollarSign,
  Edit,
  Eye,
  FileText,
  Loader2,
  MapPin,
  Mail,
  Phone,
  RefreshCw,
  Trash2,
  User,
  Users,
} from "lucide-react";
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
  SheetDescription,
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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteDepartment } from "@/lib/actions/department-actions";
import type { DepartmentData } from "@/hooks/use-department-data";
import type { departments } from "@/lib/db/schema";
import { toast } from "sonner";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { UpdateDepartmentForm } from "./[id]/edit/update-department-form";

type DepartmentRow = typeof departments.$inferSelect & {
  staffCount: number;
  servicesCount: number;
};

type DetailTabId = "overview" | "contact" | "management";

function DepartmentDetailSheet({
  open,
  onOpenChange,
  data,
  isLoading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DepartmentData;
  isLoading: boolean;
}) {
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState<DetailTabId>("overview");

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setActiveTab("overview");
      onOpenChange(next);
    },
    [onOpenChange]
  );
  const name = data?.name ?? "";
  const staffCount = Array.isArray(data?.staff) ? data.staff.length : 0;
  const annualBudget = data?.annualBudget ?? data?.budget ?? "0";
  const formattedBudget = Number(annualBudget).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const tabs: { id: DetailTabId; label: string }[] = [
    { id: "overview", label: t("tabOverview") },
    { id: "contact", label: t("tabContactLocation") },
    { id: "management", label: t("tabManagement") },
  ];

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[640px] sm:max-w-[640px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-slate-500 dark:text-slate-400 shrink-0" />
            <div>
              <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
                {t("detailTitle", { name: name || "—" })}
              </SheetTitle>
              <SheetDescription className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {t("detailDescription", { name: name || "department" })}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 pt-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                variant={activeTab === tab.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 rounded-lg font-semibold",
                  activeTab === tab.id
                    ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                    : "border-slate-200 dark:border-slate-700"
                )}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">{t("loadingDepartment")}</p>
            </div>
          ) : data ? (
            <>
              {activeTab === "overview" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                      {t("basicInformation")}
                    </h3>
                    <div className="space-y-2 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {t("departmentIdentifier")}
                      </p>
                      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {data.code ?? "—"}
                      </p>
                      <p className="text-lg font-bold text-slate-900 dark:text-white">{data.name}</p>
                      <span
                        className={`inline-flex font-semibold text-sm px-2 py-1 rounded-md ${
                          data.status === "active"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {data.status}
                      </span>
                      {data.description && (
                        <div className="pt-2">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">{t("description")}</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300">{data.description}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                      {t("quickStats")}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col items-center gap-1">
                        <Users className="h-6 w-6 text-slate-500 dark:text-slate-400" />
                        <span className="text-2xl font-black font-heading tabular-nums text-slate-900 dark:text-white">
                          {staffCount}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {t("staffMembers")}
                        </span>
                      </div>
                      <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-emerald-50/50 dark:bg-emerald-500/10 flex flex-col items-center gap-1">
                        <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-2xl font-black font-heading tabular-nums text-slate-900 dark:text-white">
                          ${formattedBudget}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                          {t("annualBudget")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "contact" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                      {t("locationInformation")}
                    </h3>
                    <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t("departmentLocation")}
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                            {data.location ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                      {t("contactInformation")}
                    </h3>
                    <div className="space-y-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-start gap-3">
                        <Phone className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t("phone")}
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                            {data.phone ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Mail className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t("email")}
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                            {data.email ?? "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeTab === "management" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                      {t("management")}
                    </h3>
                    <div className="space-y-3">
                      <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50 flex items-start gap-3">
                        <User className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t("departmentHead")}
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {data.headOfDepartment ?? "—"}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 flex items-start gap-3">
                        <CheckCircle
                          className={`h-4 w-4 mt-0.5 shrink-0 ${
                            data.status === "active"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-rose-500 dark:text-rose-400"
                          }`}
                        />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t("departmentStatus")}
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1 capitalize">
                            {data.status}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {data.status === "active"
                              ? t("statusOperational")
                              : t("statusNotOperational")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                      {t("financialAndStats")}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-emerald-50/50 dark:bg-emerald-500/10 flex items-start gap-3">
                        <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t("annualBudget")}
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            ${formattedBudget}
                          </p>
                        </div>
                      </div>
                      <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-100/50 dark:bg-slate-800/50 flex items-start gap-3">
                        <Users className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t("staffInformation")}
                          </p>
                          <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                            {t("membersCount", { count: staffCount })}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {t("assignedToDepartment")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                      {t("recordInformation")}
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
                        <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t("created")}
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                            {data.createdAt
                              ? format(new Date(data.createdAt), "MMMM d, yyyy 'at' h:mm a")
                              : "—"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4">
                        <RefreshCw className="h-4 w-4 text-slate-500 dark:text-slate-400 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            {t("lastUpdated")}
                          </p>
                          <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                            {data.updatedAt
                              ? format(new Date(data.updatedAt), "MMMM d, yyyy 'at' h:mm a")
                              : "—"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">{t("departmentNotFound")}</p>
          )}
        </div>
        {data && (
          <div className="p-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/60 shrink-0">
            <Button
              variant="outline"
              className="w-full font-semibold border-slate-200 dark:border-slate-700 rounded-lg"
              onClick={() => handleOpenChange(false)}
            >
              {tCommon("close")}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

const DepartmentTableRow = memo(function DepartmentTableRow({
  dept,
  isSelected,
  onToggleRow,
  onDeptClick,
  onEdit,
  onDelete,
  deletingId,
}: {
  dept: DepartmentRow;
  isSelected: boolean;
  onToggleRow: (id: string) => void;
  onDeptClick: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}) {
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");
  return (
    <TableRow
      className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
      onClick={() => onDeptClick(dept.id)}
    >
      <TableCell className="pl-6 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onToggleRow(dept.id)}
          className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
        />
      </TableCell>
      <TableCell className="pl-2 py-4 align-middle">
        <div className="flex flex-col gap-0.5">
          <Button
            variant="link"
            className="h-auto p-0 font-bold text-slate-900 dark:text-white hover:text-primary justify-start text-left"
            onClick={(e) => {
              e.stopPropagation();
              onDeptClick(dept.id);
            }}
          >
            {dept.name}
          </Button>
          {(dept.code || dept.description) && (
            <span className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
              {dept.code ? `${dept.code}${dept.description ? ` • ${dept.description}` : ""}` : dept.description ?? ""}
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <div className="flex flex-col gap-0.5 text-xs text-slate-700 dark:text-slate-300">
          {dept.email && <span className="line-clamp-1">{dept.email}</span>}
          {dept.phone && <span className="line-clamp-1">{dept.phone}</span>}
          {dept.location && <span className="line-clamp-1 text-slate-500 dark:text-slate-400">{dept.location}</span>}
          {!dept.email && !dept.phone && !dept.location && <span>—</span>}
        </div>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
          {dept.headOfDepartment ?? "—"}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          {dept.staffCount}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle">
        {(() => {
          const budget = dept.annualBudget ?? dept.budget ?? "0";
          const num = typeof budget === "string" ? parseFloat(budget) : Number(budget);
          const formatted = isNaN(num)
            ? "—"
            : new Intl.NumberFormat("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(num);
          return (
            <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
              {formatted !== "—" ? `$${formatted} ${t("budgetAnnual")}` : "—"}
            </span>
          );
        })()}
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span
          className={`font-semibold text-sm whitespace-nowrap px-2 py-1 rounded-md ${
            dept.status === "active"
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
          }`}
        >
          {dept.status}
        </span>
      </TableCell>
      <TableCell className="py-4 align-middle">
        <span className="font-semibold text-slate-600 dark:text-slate-400 text-sm">
          {dept.createdAt
            ? format(new Date(dept.createdAt), "MMM d, yyyy")
            : "—"}
        </span>
      </TableCell>
      <TableCell
        className="text-right pr-6 py-4 align-middle"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            onClick={() => onDeptClick(dept.id)}
          >
            <Eye className="h-4 w-4" />
            <span className="sr-only">{t("viewDetails")}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            onClick={() => onEdit(dept.id)}
          >
            <Edit className="h-4 w-4" />
            <span className="sr-only">{tCommon("edit")}</span>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                disabled={!!deletingId}
              >
                {deletingId === dept.id ? (
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
                  {t("deleteConfirmDescription", { name: dept.name })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="mt-4 gap-2">
                <AlertDialogCancel disabled={!!deletingId} className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">
                  {tCommon("cancel")}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(dept.id)}
                  disabled={!!deletingId}
                  className="font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-6"
                >
                  {deletingId === dept.id ? tCommon("deleting") : tCommon("confirmDelete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </TableCell>
    </TableRow>
  );
});

export function DepartmentList({
  departments: list,
  searchContent,
  createAction,
  children,
}: {
  departments: DepartmentRow[];
  searchContent?: React.ReactNode;
  createAction?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: detailData, isLoading: isLoadingDetail } = useDepartmentData(selectedId);
  const { data: editData, isLoading: isLoadingEdit } = useDepartmentData(editId);

  const handleDeptClick = useCallback((id: string) => setSelectedId(id), []);
  const handleEdit = useCallback((id: string) => setEditId(id), []);

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
      if (checked) setSelectedRows(new Set(list.map((d) => d.id)));
      else setSelectedRows(new Set());
    },
    [list]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      setDeletingId(id);
      try {
        const result = await deleteDepartment(id);
        if (result.success) {
          setSelectedRows((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          toast.success(t("departmentDeleted"));
          router.refresh();
        } else {
          toast.error(result.error ?? t("failedToDeleteDepartment"));
        }
      } catch {
        toast.error(t("failedToDeleteDepartment"));
      } finally {
        setDeletingId(null);
      }
    },
    [router]
  );

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Building2 className="h-6 w-6" />}
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
            ? React.cloneElement(searchContent as React.ReactElement<{ selectedCount?: number; onDeleteSelected?: () => void; onClearSelection?: () => void }>, {
                selectedCount: selectedRows.size,
                onDeleteSelected:
                  selectedRows.size > 0
                    ? async () => {
                        const ids = Array.from(selectedRows);
                        setDeletingId(ids[0] ?? null);
                        let done = 0;
                        for (const id of ids) {
                          try {
                            const result = await deleteDepartment(id);
                            if (result.success) done++;
                            else toast.error(result.error ?? t("failedToDeleteDepartment"));
                          } catch {
                            toast.error(t("bulkDeleteFailed"));
                          }
                        }
                        setSelectedRows(new Set());
                        setDeletingId(null);
                        if (done > 0) {
                          toast.success(t("bulkDeletedCount", { count: done }));
                          router.refresh();
                        }
                      }
                    : undefined,
                onClearSelection: () => setSelectedRows(new Set()),
              })
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
              {t("tableDepartment")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[180px]">
              {t("tableContact")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px]">
              {t("tableDepartmentHead")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[70px]">
              {t("tableStaff")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[130px]">
              {t("tableBudget")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              {t("tableStatus")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[110px]">
              {t("tableCreated")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[100px]">
              {tCommon("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((dept) => (
            <DepartmentTableRow
              key={dept.id}
              dept={dept}
              isSelected={selectedRows.has(dept.id)}
              onToggleRow={toggleRow}
              onDeptClick={handleDeptClick}
              onEdit={handleEdit}
              onDelete={handleDelete}
              deletingId={deletingId}
            />
          ))}
        </TableBody>
      </Table>
      {children}

      {/* Detail Sheet */}
      <DepartmentDetailSheet
        open={!!selectedId}
        onOpenChange={(open) => !open && setSelectedId(null)}
        data={detailData}
        isLoading={isLoadingDetail}
      />

      {/* Edit Sheet */}
      <Sheet open={!!editId} onOpenChange={(open) => !open && setEditId(null)}>
        <SheetContent
          side="right"
          className="w-full sm:w-[640px] sm:max-w-[640px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
        >
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
              {t("editDepartmentTitle")}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingEdit ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                <p className="text-sm font-medium">{tCommon("loading")}</p>
              </div>
            ) : editData ? (
              <UpdateDepartmentForm
                department={editData}
                onSuccess={() => setEditId(null)}
              />
            ) : (
              <p className="text-sm text-slate-500">{t("departmentNotFound")}</p>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
