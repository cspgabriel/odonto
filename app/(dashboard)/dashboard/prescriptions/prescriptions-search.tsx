"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/lib/i18n";
import { useCallback, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Trash2, X } from "lucide-react";
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
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export function PrescriptionsSearch({
  defaultValue = "",
  pageSize = 10,
  doctors = [],
  selectedCount = 0,
  canDelete = true,
  onDeleteSelected,
  onClearSelection,
}: {
  defaultValue?: string;
  pageSize?: number;
  doctors?: { id: string; fullName: string }[];
  selectedCount?: number;
  canDelete?: boolean;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
}) {
  const t = useTranslations("prescriptions");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => { setValue(defaultValue); }, [defaultValue]);

  const hasFilters =
    searchParams.get("q") ||
    searchParams.get("status") ||
    searchParams.get("doctorId") ||
    searchParams.get("medication") ||
    searchParams.get("dateRange") ||
    selectedCount > 0;

  const updateQuery = useCallback(
    (updates?: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams);
      const q = updates?.q !== undefined ? updates.q : value;
      if (q.trim()) params.set("q", q.trim()); else params.delete("q");

      const direct = ["status", "doctorId", "medication", "dateRange"];
      for (const key of direct) {
        if (updates && key in updates) {
          const v = updates[key];
          if (v) params.set(key, v); else params.delete(key);
        }
      }
      params.set("page", "1");
      params.set("pageSize", String(pageSize));
      router.push(`/dashboard/prescriptions?${params.toString()}`);
    },
    [value, router, pageSize, searchParams]
  );

  function clearAll() {
    setValue("");
    if (onClearSelection) onClearSelection();
    router.push("/dashboard/prescriptions?page=1&pageSize=" + pageSize);
  }

  return (
    <form className="w-full flex" onSubmit={(e) => { e.preventDefault(); updateQuery(); }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center w-full gap-3 flex-wrap">

        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Label htmlFor="rx-search" className="sr-only">{t("searchLabel")}</Label>
          <Search className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors pointer-events-none ${isFocused ? "text-primary" : "text-slate-400"}`} />
          <Input
            id="rx-search"
            placeholder={t("searchPlaceholder")}
            className="pl-10 h-10 w-full bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus-visible:ring-primary/50 font-medium text-sm placeholder:text-slate-400 shadow-sm"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>

        <div className="flex flex-wrap shrink-0 items-center gap-2">
          {/* Status */}
          <Select
            value={searchParams.get("status") ?? "all"}
            onValueChange={(v) => updateQuery({ status: v === "all" ? "" : v })}
          >
            <SelectTrigger className="h-10 w-[140px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg text-sm font-medium shadow-sm">
              <SelectValue placeholder={t("filterAllStatuses")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs font-medium">{t("filterAllStatuses")}</SelectItem>
              <SelectItem value="active" className="text-xs font-medium">{t("statusActive")}</SelectItem>
              <SelectItem value="pending" className="text-xs font-medium">{t("statusPending")}</SelectItem>
              <SelectItem value="dispensed" className="text-xs font-medium">{t("statusDispensed")}</SelectItem>
              <SelectItem value="completed" className="text-xs font-medium">{t("statusCompleted")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Medication */}
          <Select
            value={searchParams.get("medication") ?? "all"}
            onValueChange={(v) => updateQuery({ medication: v === "all" ? "" : v })}
          >
            <SelectTrigger className="h-10 w-[155px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg text-sm font-medium shadow-sm">
              <SelectValue placeholder={t("filterAllMedications")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              <SelectItem value="all" className="text-xs font-medium">{t("filterAllMedications")}</SelectItem>
              {["Amoxicillin","Metformin","Lisinopril","Atorvastatin","Omeprazole","Salbutamol","Sertraline","Levothyroxine","Ibuprofen","Cetirizine","Losartan","Metoprolol","Azithromycin","Ciprofloxacin","Hydroxychloroquine","Prednisolone","Amlodipine","Fluoxetine","Doxycycline","Pantoprazole"].map((m) => (
                <SelectItem key={m} value={m} className="text-xs font-medium">{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Doctor */}
          {doctors.length > 0 && (
            <Select
              value={searchParams.get("doctorId") ?? "all"}
              onValueChange={(v) => updateQuery({ doctorId: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-10 w-[155px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg text-sm font-medium shadow-sm">
                <SelectValue placeholder={t("filterAllDoctors")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl max-h-60">
                <SelectItem value="all" className="text-xs font-medium">{t("filterAllDoctors")}</SelectItem>
                {doctors.map((d) => (
                  <SelectItem key={d.id} value={d.id} className="text-xs font-medium">{d.fullName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Date range */}
          <Select
            value={searchParams.get("dateRange") ?? "all"}
            onValueChange={(v) => updateQuery({ dateRange: v === "all" ? "" : v })}
          >
            <SelectTrigger className="h-10 w-[140px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg text-sm font-medium shadow-sm">
              <SelectValue placeholder={t("filterAllDates")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all" className="text-xs font-medium">{t("filterAllDates")}</SelectItem>
              <SelectItem value="7d" className="text-xs font-medium">{t("filterLast7Days")}</SelectItem>
              <SelectItem value="30d" className="text-xs font-medium">{t("filterLast30Days")}</SelectItem>
              <SelectItem value="90d" className="text-xs font-medium">{t("filterLast90Days")}</SelectItem>
              <SelectItem value="1y" className="text-xs font-medium">{t("filterLastYear")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Bulk & Clear actions */}
          {hasFilters && (
            <div className="flex items-center gap-1">
              {selectedCount > 0 && canDelete && onDeleteSelected && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button type="button" variant="ghost"
                      className="h-10 px-3 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-1.5">
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("deleteCount", { count: selectedCount })}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-heading">{t("bulkDeleteTitle")}</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500">
                        {t("bulkDeleteDescription", { count: selectedCount })} {tCommon("deleteDescription")}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800">{tCommon("cancel")}</AlertDialogCancel>
                      <Button type="button" onClick={onDeleteSelected}
                        className="font-bold bg-rose-600 hover:bg-rose-700 text-white min-w-[7rem]">
                        {t("deletePermanently")}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button type="button" variant="ghost" onClick={clearAll}
                className="h-10 px-3 rounded-lg font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5">
                <X className="h-3.5 w-3.5" />
                {t("clear")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
