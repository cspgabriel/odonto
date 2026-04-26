"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function CategoriesSearch({
  defaultValue = "",
  pageSize = 10,
  department = "all",
  status = "all",
  createAction,
  selectedCount = 0,
  onDeleteSelected,
  onClearSelection,
}: {
  defaultValue?: string;
  pageSize?: number;
  department?: string;
  status?: string;
  createAction?: React.ReactNode;
  selectedCount?: number;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("testReports");
  const tCommon = useTranslations("common");
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const updateQuery = useCallback(
    (updates: { q?: string; department?: string; status?: string }) => {
      const params = new URLSearchParams(searchParams);
      if (updates.q !== undefined) {
        if (updates.q.trim()) params.set("q", updates.q.trim());
        else params.delete("q");
      }
      if (updates.department !== undefined) {
        if (updates.department && updates.department !== "all") params.set("department", updates.department);
        else params.delete("department");
      }
      if (updates.status !== undefined) {
        if (updates.status && updates.status !== "all") params.set("status", updates.status);
        else params.delete("status");
      }
      params.set("page", "1");
      params.set("pageSize", String(pageSize));
      router.push(`/dashboard/test-reports/categories?${params.toString()}`);
    },
    [router, searchParams, pageSize]
  );

  const hasActiveFilters =
    searchParams.get("q") ||
    searchParams.get("department") ||
    (searchParams.get("status") && searchParams.get("status") !== "all") ||
    selectedCount > 0;

  return (
    <form
      className="w-full flex"
      onSubmit={(e) => {
        e.preventDefault();
        updateQuery({ q: value });
      }}
    >
      <div className="flex flex-col sm:flex-row items-center w-full gap-3">
        <div className="relative flex-1 w-full min-w-0">
          <Label htmlFor="cat-search" className="sr-only">
            {t("searchCategoriesLabel")}
          </Label>
          <Search
            className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
              isFocused ? "text-primary" : "text-slate-400"
            }`}
          />
          <Input
            id="cat-search"
            placeholder={t("searchCategoriesPlaceholder")}
            className="pl-10 h-10 w-full bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus-visible:ring-primary/50 transition-all font-medium text-sm placeholder:text-slate-400 shadow-sm"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
        <div className="flex w-full sm:w-auto shrink-0 items-center gap-2">
          <Select
            value={searchParams.get("status") ?? "all"}
            onValueChange={(v) => updateQuery({ status: v })}
          >
            <SelectTrigger className="h-10 w-full sm:w-[140px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
              <SelectValue placeholder={t("allStatus")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
              <SelectItem value="all" className="cursor-pointer font-medium text-xs">
                {t("allStatus")}
              </SelectItem>
              <SelectItem value="active" className="cursor-pointer font-medium text-xs">
                {t("active")}
              </SelectItem>
              <SelectItem value="inactive" className="cursor-pointer font-medium text-xs">
                {t("inactive")}
              </SelectItem>
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {selectedCount > 0 && onDeleteSelected && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 px-3 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{tCommon("delete")} ({selectedCount})</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-heading">
                        {t("bulkDeleteCategoriesTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500">
                        {t("bulkDeleteCategoriesDescription", { count: selectedCount })}
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
                        {t("deletePermanently")}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-4 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center"
                onClick={() => {
                  setValue("");
                  onClearSelection?.();
                  router.push(`/dashboard/test-reports/categories?page=1&pageSize=${pageSize}`);
                }}
              >
                {t("clear")}
              </Button>
            </div>
          )}
          {createAction && <div className="ml-auto flex items-center gap-2">{createAction}</div>}
        </div>
      </div>
    </form>
  );
}
