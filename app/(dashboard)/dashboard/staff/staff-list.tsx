"use client";

import * as React from "react";
import { useTranslations } from "@/lib/i18n";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { toast } from "sonner";
import { deleteStaff, updateStaffStatus } from "@/lib/actions/staff-actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { StaffEditSheet } from "./staff-edit-sheet";

export type StaffRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  departmentId: string | null;
  salary: string | null;
  workSchedule: unknown;
  joinedDate: string | null;
  departmentName: string | null;
  status?: string;
};

function getInitials(name: string | null): string {
  return (name ?? "")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function workingDaysFromSchedule(workSchedule: unknown): number {
  if (!workSchedule || typeof workSchedule !== "object") return 0;
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
  return days.filter(
    (d) =>
      (workSchedule as Record<string, { enabled?: boolean }>)[d]?.enabled === true
  ).length;
}

const roleBadgeStyles: Record<
  string,
  { className: string; label: string }
> = {
  admin: { className: "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300 border-0 font-semibold", label: "Admin" },
  doctor: { className: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300 border-0 font-semibold", label: "Doctor" },
  nurse: { className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300 border-0 font-semibold", label: "Nurse" },
  receptionist: { className: "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300 border-0 font-semibold", label: "Receptionist" },
};

const roleBadgeKey: Record<string, string> = {
  admin: "roleAdmin",
  doctor: "roleDoctor",
  nurse: "roleNurse",
  receptionist: "roleReceptionist",
};

const STATUS_OPTIONS = [
  { value: "approved", key: "statusApproved" },
  { value: "pending", key: "statusPending" },
  { value: "rejected", key: "statusRejected" },
] as const;

function normalizeStatus(status: string | undefined): string {
  if (status === "approved" || status === "pending" || status === "rejected") return status;
  if (status === "active") return "approved";
  if (status === "inactive") return "rejected";
  if (status === "on_leave") return "pending";
  return "pending";
}

function StaffStatusSelect({
  staffId,
  value,
  onSuccess,
  t,
}: {
  staffId: string;
  value: string;
  onSuccess: () => void;
  t: (key: string) => string;
}) {
  const [loading, setLoading] = React.useState(false);
  const handleChange = async (newValue: string) => {
    if (newValue === value) return;
    setLoading(true);
    try {
      const result = await updateStaffStatus(staffId, newValue);
      if (result.success) {
        toast.success(t("statusUpdated"));
        onSuccess();
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error(t("failedToUpdateStatus"));
    } finally {
      setLoading(false);
    }
  };
  return (
    <Select
      value={value}
      onValueChange={handleChange}
      disabled={loading}
    >
      <SelectTrigger className="h-9 w-[120px] border-slate-200/60 dark:border-slate-800/60 font-medium text-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {t(opt.key)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StaffList({
  staff: list,
  searchContent,
  createAction,
  canEdit = true,
  canDelete = true,
  children,
  departments = [],
}: {
  staff: StaffRow[];
  searchContent?: React.ReactNode;
  createAction?: React.ReactNode;
  canEdit?: boolean;
  canDelete?: boolean;
  children?: React.ReactNode;
  departments?: { id: string; name: string }[];
}) {
  const t = useTranslations("staff");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editStaffId, setEditStaffId] = useState<string | null>(null);

  const toggleRow = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }, []);

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(list.map((s) => s.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedRows);
    const promise = Promise.all(ids.map((id) => deleteStaff(id)));
    toast.promise(promise, {
      loading: t("deletingStaff", { count: ids.length }),
      success: () => {
        setSelectedRows(new Set());
        router.refresh();
        return t("staffDeleted", { count: ids.length });
      },
      error: t("failedToDelete"),
    });
  };

  const handleDeleteOne = useCallback(
    (id: string) => {
      const promise = deleteStaff(id);
      toast.promise(promise, {
        loading: t("deletingStaff", { count: 1 }),
        success: () => {
          router.refresh();
          return t("staffDeleted", { count: 1 });
        },
        error: t("failedToDelete"),
      });
    },
    [router, t]
  );

  if (list.length === 0) {
    return (
      <EmptyState
        icon={<Users className="h-6 w-6" />}
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
              }>,               {
                selectedCount: selectedRows.size,
                onDeleteSelected: canDelete ? handleDeleteSelected : undefined,
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
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tableStaffMember")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tableRole")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tableDepartment")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tableSalary")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tableWorkingDays")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tableJoinedDate")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">{t("tableStatus")}</TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6">{tCommon("actions").toUpperCase()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((s) => (
            <TableRow key={s.id} className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
              <TableCell className="pl-6 py-4 align-middle">
                <Checkbox
                  checked={selectedRows.has(s.id)}
                  onCheckedChange={() => toggleRow(s.id)}
                  className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
                />
              </TableCell>
              <TableCell className="pl-2 py-4 align-middle">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-slate-200/60 dark:border-slate-800 shadow-sm shrink-0">
                    <AvatarFallback className="bg-muted text-xs font-bold">
                      {getInitials(s.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-slate-900 dark:text-white">{s.fullName ?? "—"}</span>
                </div>
              </TableCell>
              <TableCell className="py-4 align-middle">
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium capitalize ${
                    roleBadgeStyles[s.role]?.className ?? "bg-slate-100 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300"
                  }`}
                >
                  {roleBadgeKey[s.role] ? t(roleBadgeKey[s.role]) : s.role}
                </span>
              </TableCell>
              <TableCell className="py-4 align-middle text-muted-foreground text-sm">
                {s.departmentName ?? "—"}
              </TableCell>
              <TableCell className="py-4 align-middle text-sm font-semibold text-slate-700 dark:text-slate-300">
                {s.salary
                  ? new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 0,
                    }).format(Number(s.salary))
                  : "—"}
              </TableCell>
              <TableCell className="py-4 align-middle text-muted-foreground text-sm">
                {workingDaysFromSchedule(s.workSchedule)} {t("days")}
              </TableCell>
              <TableCell className="py-4 align-middle text-muted-foreground text-sm">
                {s.joinedDate
                  ? format(new Date(s.joinedDate), "MMM d, yyyy")
                  : "—"}
              </TableCell>
              <TableCell className="py-4 align-middle">
                <StaffStatusSelect
                  staffId={s.id}
                  value={normalizeStatus(s.status)}
                  onSuccess={() => router.refresh()}
                  t={t}
                />
              </TableCell>
              <TableCell className="text-right pr-6 py-4 align-middle">
                <div className="flex items-center justify-end gap-1">
                  {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                    onClick={() => setEditStaffId(s.id)}
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
                        className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">{tCommon("delete")}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E] data-[state=open]:animate-none data-[state=closed]:animate-none sm:zoom-in-100 sm:slide-in-from-bottom-0 sm:fade-in-100 duration-0 transition-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="font-heading text-lg font-bold">{t("deleteConfirmTitle")}</AlertDialogTitle>
                        <AlertDialogDescription className="text-slate-500 text-sm">
                          {t("deleteConfirmDescription", { name: s.fullName ?? "" })}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter className="mt-4 gap-2">
                        <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">{tCommon("cancel")}</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteOne(s.id)}
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
          ))}
        </TableBody>
      </Table>
      <StaffEditSheet
        staffId={editStaffId}
        open={!!editStaffId}
        onOpenChange={(open) => !open && setEditStaffId(null)}
        onSuccess={() => router.refresh()}
        departments={departments}
      />
      {children}
    </div>
  );
}
