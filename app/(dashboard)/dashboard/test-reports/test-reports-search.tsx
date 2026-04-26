"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
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

export function TestReportsSearch({
  defaultValue = "",
  pageSize = 10,
  status = "all",
  selectedCount = 0,
  onDeleteSelected,
  onClearSelection,
}: {
  defaultValue?: string;
  pageSize?: number;
  status?: string;
  selectedCount?: number;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
}) {
  const t = useTranslations("testReports");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const updateQuery = useCallback(
    (updates: { q?: string; status?: string }) => {
      const params = new URLSearchParams(searchParams);
      if (updates.q !== undefined) {
        if (updates.q.trim()) params.set("q", updates.q.trim());
        else params.delete("q");
      }
      if (updates.status !== undefined) {
        if (updates.status && updates.status !== "all") params.set("status", updates.status);
        else params.delete("status");
      }
      params.set("page", "1");
      params.set("pageSize", String(pageSize));
      router.push(`/dashboard/test-reports?${params.toString()}`);
    },
    [router, searchParams, pageSize]
  );

  const hasActiveFilters =
    searchParams.get("q") ||
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
          <Label htmlFor="test-reports-search" className="sr-only">
            {t("searchLabel")}
          </Label>
          <Search
            className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
              isFocused ? "text-primary" : "text-slate-400"
            }`}
          />
          <Input
            id="test-reports-search"
            placeholder={t("searchPlaceholder")}
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
              <SelectItem value="pending" className="cursor-pointer font-medium text-xs">
                {t("statusPending")}
              </SelectItem>
              <SelectItem value="recorded" className="cursor-pointer font-medium text-xs">
                {t("statusRecorded")}
              </SelectItem>
              <SelectItem value="delivered" className="cursor-pointer font-medium text-xs">
                {t("statusDelivered")}
              </SelectItem>
              <SelectItem value="verified" className="cursor-pointer font-medium text-xs">
                {t("statusVerified")}
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
                      <span>{t("deleteCount", { count: selectedCount })}</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="font-heading">
                        {t("bulkDeleteTitle")}
                      </AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500">
                        {t("bulkDeleteDescription", { count: selectedCount })}
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
                  router.push(`/dashboard/test-reports?page=1&pageSize=${pageSize}`);
                }}
              >
                {t("clear")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
