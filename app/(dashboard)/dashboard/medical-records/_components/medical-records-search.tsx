"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
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
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export type SortByOption = { value: string; label: string };

export function MedicalRecordsSearch({
  defaultValue = "",
  pageSize = 10,
  basePath,
  placeholder,
  showStatusFilter = false,
  statusFilterValue = "all",
  /** "diagnoses" = All / Active / Resolved; "default" = All status / Active / Completed */
  statusFilterMode = "default",
  showSortFilter = false,
  sortByValue = "createdAt",
  sortByOptions,
  selectedCount = 0,
  onDeleteSelected,
  onClearSelection,
}: {
  defaultValue?: string;
  pageSize?: number;
  basePath: string;
  placeholder?: string;
  showStatusFilter?: boolean;
  statusFilterValue?: string;
  statusFilterMode?: "default" | "diagnoses";
  showSortFilter?: boolean;
  sortByValue?: string;
  sortByOptions?: SortByOption[];
  selectedCount?: number;
  onDeleteSelected?: () => void | Promise<void>;
  onClearSelection?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("medicalRecords");
  const tCommon = useTranslations("common");
  const placeholderResolved = placeholder ?? t("searchPlaceholder");
  const sortByOptionsResolved = sortByOptions ?? [
    { value: "createdAt", label: t("dateAdded") },
    { value: "updatedAt", label: t("lastUpdated") },
  ];
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const updateQuery = useCallback(
    (updates?: { q?: string; status?: string; sortBy?: string; sortOrder?: string }) => {
      const params = new URLSearchParams(searchParams);
      if (updates && updates.q !== undefined) {
        if (updates.q.trim()) params.set("q", updates.q.trim());
        else params.delete("q");
      } else if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      if (updates && "status" in updates) {
        if (updates.status && updates.status !== "all") params.set("status", updates.status);
        else params.delete("status");
      }
      if (updates && "sortBy" in updates) {
        if (updates.sortBy) params.set("sortBy", updates.sortBy);
        else params.delete("sortBy");
      }
      if (updates && "sortOrder" in updates) {
        if (updates.sortOrder) params.set("sortOrder", updates.sortOrder);
        else params.delete("sortOrder");
      }
      params.set("page", "1");
      params.set("pageSize", String(pageSize));
      router.push(`${basePath}?${params.toString()}`);
    },
    [value, router, pageSize, searchParams, basePath]
  );
  const hasFilters =
    !!searchParams.get("q") ||
    (showStatusFilter && statusFilterValue !== "all") ||
    (showSortFilter && sortByValue !== "createdAt");
  const showActions = hasFilters || selectedCount > 0;

  const handleClear = useCallback(() => {
    setValue("");
    onClearSelection?.();
    const params = new URLSearchParams(searchParams);
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    params.delete("q");
    params.delete("status");
    params.delete("sortBy");
    params.delete("sortOrder");
    router.push(`${basePath}?${params.toString()}`);
  }, [router, pageSize, searchParams, basePath, onClearSelection]);

  return (
    <form
      className="w-full flex min-w-0"
      onSubmit={(e) => {
        e.preventDefault();
        updateQuery();
      }}
    >
      <div className="flex flex-row flex-nowrap items-center gap-2 w-full min-w-0">
        <div className="relative flex-1 min-w-0 max-w-[320px] sm:max-w-none">
          <Label htmlFor="medical-records-search" className="sr-only">
            {t("searchLabel")}
          </Label>
          <Search
            className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 pointer-events-none shrink-0 ${
              isFocused ? "text-primary" : "text-slate-400"
            }`}
          />
          <Input
            id="medical-records-search"
            placeholder={placeholderResolved}
            className="pl-10 h-10 w-full min-w-0 bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus-visible:ring-primary/50 transition-all font-medium text-sm placeholder:text-slate-400 shadow-sm"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>

        {showSortFilter && sortByOptionsResolved.length > 0 && (
          <div className="shrink-0 w-[150px]">
            <Label className="sr-only">{t("sortBy")}</Label>
            <Select
              value={sortByValue}
              onValueChange={(v) => updateQuery({ sortBy: v })}
            >
              <SelectTrigger className="h-10 w-full bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
                <SelectValue placeholder={t("sortBy")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                {sortByOptionsResolved.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="cursor-pointer font-medium text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {showStatusFilter && (
          <div className="shrink-0 w-[130px]">
            <Label className="sr-only">{t("statusFilter")}</Label>
            <Select
              value={statusFilterValue}
              onValueChange={(v) => updateQuery({ status: v })}
            >
              <SelectTrigger className="h-10 w-full bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
                <SelectValue placeholder={t("statusFilter")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                {statusFilterMode === "diagnoses" ? (
                  <>
                    <SelectItem value="all" className="cursor-pointer font-medium text-xs">
                      {t("all")}
                    </SelectItem>
                    <SelectItem value="active" className="cursor-pointer font-medium text-xs">
                      {t("active")}
                    </SelectItem>
                    <SelectItem value="resolved" className="cursor-pointer font-medium text-xs">
                      {t("resolved")}
                    </SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="all" className="cursor-pointer font-medium text-xs">
                      {t("allStatus")}
                    </SelectItem>
                    <SelectItem value="active" className="cursor-pointer font-medium text-xs">
                      {t("active")}
                    </SelectItem>
                    <SelectItem value="completed" className="cursor-pointer font-medium text-xs">
                      {t("completed")}
                    </SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>
        )}

        {showActions && (
          <div className="flex items-center gap-1 shrink-0 ml-auto">
            {selectedCount > 0 && onDeleteSelected && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                    title={t("deleteSelectedCount", { count: selectedCount })}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">{t("deleteSelectedCount", { count: selectedCount })}</span>
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-heading">{t("deleteSelectedTitle")}</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-500">
                      {t("deleteSelectedDescription", { count: selectedCount })}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800">
                      {tCommon("cancel")}
                    </AlertDialogCancel>
                    <Button
                      type="button"
                      onClick={onDeleteSelected}
                      className="font-bold bg-rose-600 hover:bg-rose-700 text-white min-w-[7rem]"
                    >
                      {t("delete")}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
              onClick={handleClear}
              title={t("clear")}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{t("clear")}</span>
            </Button>
          </div>
        )}
      </div>
    </form>
  );
}
