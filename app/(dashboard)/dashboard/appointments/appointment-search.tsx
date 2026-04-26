"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Trash2, Loader2 } from "lucide-react";
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

const STATUS_OPTIONS_KEYS = [
  { value: "all", labelKey: "allStatuses" },
  { value: "pending", labelKey: "statusPending" },
  { value: "confirmed", labelKey: "statusConfirmed" },
  { value: "completed", labelKey: "statusCompleted" },
  { value: "cancelled", labelKey: "statusCancelled" },
] as const;

export function AppointmentSearch({
  defaultValue = "",
  doctorId,
  patientId,
  departmentId,
  status,
  page = 1,
  pageSize = 10,
  doctors = [],
  departments = [],
  action,
  selectedCount = 0,
  canDelete = true,
  canExport = false,
  onDeleteSelected,
  onClearSelection,
}: {
  defaultValue?: string;
  doctorId?: string;
  patientId?: string;
  departmentId?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  doctors?: { id: string; fullName: string }[];
  departments?: { id: string; name: string }[];
  action?: React.ReactNode;
  selectedCount?: number;
  canDelete?: boolean;
  canExport?: boolean;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("appointments");
  const tCommon = useTranslations("common");
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const updateQuery = useCallback(
    (updates: { q?: string; doctorId?: string; patientId?: string; departmentId?: string; status?: string; date?: string }) => {
      const params = new URLSearchParams();
      const qq = updates.q !== undefined ? updates.q : value.trim();
      if (qq) params.set("q", qq);
      const d = updates.doctorId !== undefined ? updates.doctorId : doctorId;
      if (d) params.set("doctorId", d);
      const p = updates.patientId !== undefined ? updates.patientId : patientId;
      if (p) params.set("patientId", p);
      const dept = updates.departmentId !== undefined ? updates.departmentId : departmentId;
      if (dept) params.set("departmentId", dept);
      const s = updates.status !== undefined ? updates.status : status;
      if (s && s !== "all") params.set("status", s);
      const dt = updates.date !== undefined ? updates.date : searchParams.get("date");
      if (dt && dt !== "all") params.set("date", dt);

      params.set("page", "1");
      params.set("pageSize", String(pageSize));
      router.push(`/dashboard/appointments?${params.toString()}`);
    },
    [value, router, doctorId, patientId, departmentId, status, pageSize, searchParams]
  );

  const handleDownload = () => {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) params.set("q", value.trim());
    const a = document.createElement('a');
    a.href = `/api/appointments/export?${params.toString()}`;
    a.download = 'appointments.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <form
      className="w-full flex"
      onSubmit={(e) => {
        e.preventDefault();
        updateQuery({});
      }}
    >
      <div className="flex flex-col sm:flex-row items-center w-full gap-3">
        
        {/* Search Input */}
        <div className="relative flex-1 w-full sm:w-auto">
          <Label htmlFor="appointment-search" className="sr-only">
            {t("searchAppointments")}
          </Label>
          <Search className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${isFocused ? "text-primary" : "text-slate-400"}`} />
          <Input
            id="appointment-search"
            placeholder={t("searchPlaceholder")}
            className="pl-10 h-10 w-full bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus-visible:ring-primary/50 transition-all font-medium text-sm placeholder:text-slate-400 shadow-sm"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
        
        {/* Selects */}
        <div className="flex w-full sm:w-auto shrink-0 items-center gap-2">
          {doctors.length > 0 && (
            <div className="shrink-0 flex-1 sm:flex-none">
              <Label className="sr-only">{t("doctorFilter")}</Label>
              <Select
                value={doctorId ?? "all"}
                onValueChange={(v) => updateQuery({ doctorId: v === "all" ? "" : v })}
              >
                <SelectTrigger className="h-10 w-full sm:w-[160px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
                  <SelectValue placeholder={t("allDoctors")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                  <SelectItem value="all" className="cursor-pointer font-medium text-xs">{t("allDoctors")}</SelectItem>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id} className="cursor-pointer font-medium text-xs">
                      {d.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {departments.length > 0 && (
            <div className="shrink-0 flex-1 sm:flex-none">
              <Label className="sr-only">{t("departmentFilter")}</Label>
              <Select
                value={departmentId ?? "all"}
                onValueChange={(v) => updateQuery({ departmentId: v === "all" ? "" : v })}
              >
                <SelectTrigger className="h-10 w-full sm:w-[160px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
                  <SelectValue placeholder={t("allDepartments")} />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                  <SelectItem value="all" className="cursor-pointer font-medium text-xs">{t("allDepartments")}</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id} className="cursor-pointer font-medium text-xs">
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="shrink-0 flex-1 sm:flex-none">
            <Label className="sr-only">{t("dateFilter")}</Label>
            <Select 
              value={searchParams.get("date") ?? "all"}
              onValueChange={(v) => updateQuery({ date: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-10 w-full sm:w-[150px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
                <SelectValue placeholder={t("allDates")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                <SelectItem value="all" className="cursor-pointer font-medium text-xs">{t("allDates")}</SelectItem>
                <SelectItem value="today" className="cursor-pointer font-medium text-xs">{t("today")}</SelectItem>
                <SelectItem value="tomorrow" className="cursor-pointer font-medium text-xs">{t("tomorrow")}</SelectItem>
                <SelectItem value="this_week" className="cursor-pointer font-medium text-xs">{t("thisWeek")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="shrink-0 flex-1 sm:flex-none">
            <Label className="sr-only">{t("statusFilter")}</Label>
            <Select
              value={status ?? "all"}
              onValueChange={(v) => updateQuery({ status: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-10 w-full sm:w-[150px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
                <SelectValue placeholder={t("allStatuses")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                {STATUS_OPTIONS_KEYS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="cursor-pointer font-medium text-xs">
                    {t(opt.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {(searchParams.get("q") || searchParams.get("status") || searchParams.get("doctorId") || searchParams.get("date") || selectedCount > 0) && (
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {selectedCount > 0 && canDelete && onDeleteSelected && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 px-3 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t("deleteCount", { count: selectedCount })}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-heading">{t("bulkDeleteTitle")}</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500">
                        {t("bulkDeleteDescription", { count: selectedCount })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800">{tCommon("cancel")}</AlertDialogCancel>
                      <Button
                        type="button"
                        onClick={onDeleteSelected}
                        className="font-bold bg-rose-600 hover:bg-rose-700 text-white min-w-[7rem]"
                      >
                        {t("deletePermanently")}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {canExport && (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 px-3 rounded-lg font-bold text-slate-600 hover:text-primary hover:bg-slate-100 transition-all flex items-center gap-1.5"
                  onClick={handleDownload}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{tCommon("export")}</span>
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-4 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center p-0"
                onClick={() => {
                  setValue("");
                  if (onClearSelection) onClearSelection();
                  const params = new URLSearchParams();
                  if (patientId) params.set("patientId", patientId);
                  params.set("page", "1");
                  params.set("pageSize", String(pageSize));
                  router.push(`/dashboard/appointments?${params.toString()}`);
                }}
              >
                {tCommon("clear")}
              </Button>
            </div>
          )}
          {action && <div className="ml-auto flex items-center gap-2">{action}</div>}
        </div>
      </div>
    </form>
  );
}
