"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/lib/i18n";
import { useCallback, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function DepartmentSearch({
  defaultValue = "",
  statusValue = "all",
  pageSize = 10,
  selectedCount = 0,
  onDeleteSelected,
  onClearSelection,
}: {
  defaultValue?: string;
  statusValue?: string;
  pageSize?: number;
  selectedCount?: number;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
}) {
  const t = useTranslations("departments");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const updateQuery = useCallback(
    (updates?: { q?: string; status?: string }) => {
      const params = new URLSearchParams(searchParams);
      if (updates?.q !== undefined) {
        if (updates.q.trim()) params.set("q", updates.q.trim());
        else params.delete("q");
      } else if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      if (updates?.status !== undefined) {
        if (updates.status && updates.status !== "all") params.set("status", updates.status);
        else params.delete("status");
      }
      params.set("page", "1");
      params.set("pageSize", String(pageSize));
      router.push(`/dashboard/departments?${params.toString()}`);
    },
    [value, router, pageSize, searchParams]
  );

  const hasFilters = searchParams.get("q") || (searchParams.get("status") && searchParams.get("status") !== "all");

  return (
    <form
      className="w-full flex"
      onSubmit={(e) => {
        e.preventDefault();
        updateQuery();
      }}
    >
      <div className="flex flex-col sm:flex-row items-center w-full gap-3">
        <div className="relative flex-1 w-full sm:w-auto">
          <Label htmlFor="department-search" className="sr-only">
            {t("searchLabel")}
          </Label>
          <Search
            className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
              isFocused ? "text-primary" : "text-slate-400"
            }`}
          />
          <Input
            id="department-search"
            placeholder={t("searchPlaceholder")}
            className="pl-10 h-10 w-full bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus-visible:ring-primary/50 transition-all font-medium text-sm placeholder:text-slate-400 shadow-sm"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>

        <div className="flex w-full sm:w-auto shrink-0 items-center gap-2">
          <div className="shrink-0 flex-1 sm:flex-none">
            <Label className="sr-only">{t("statusFilter")}</Label>
            <Select
              value={searchParams.get("status") ?? "all"}
              onValueChange={(v) => updateQuery({ status: v === "all" ? "" : v })}
            >
              <SelectTrigger className="h-10 w-full sm:w-[140px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
                <SelectValue placeholder={t("allStatus")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                <SelectItem value="all" className="cursor-pointer font-medium text-xs">
                  {t("allStatus")}
                </SelectItem>
                <SelectItem value="active" className="cursor-pointer font-medium text-xs">
                  {t("statusActive")}
                </SelectItem>
                <SelectItem value="inactive" className="cursor-pointer font-medium text-xs">
                  {t("statusInactive")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(hasFilters || selectedCount > 0) && (
            <div className="flex items-center gap-1 shrink-0">
              {selectedCount > 0 && onDeleteSelected && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-10 px-3 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex items-center gap-1.5"
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
                        {t("bulkDeleteDescription", { count: selectedCount })} {t("bulkDeleteNote")} {tCommon("deleteDescription")}
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
                        {tCommon("delete")}
                      </Button>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-4 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all flex items-center justify-center"
                onClick={() => {
                  setValue("");
                  if (onClearSelection) onClearSelection();
                  router.push(`/dashboard/departments?page=1&pageSize=${pageSize}`);
                }}
              >
                {tCommon("clear")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
