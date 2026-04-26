"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/lib/i18n";
import { useCallback, useState } from "react";
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

export function LabVendorSearch({
  defaultValue = "",
  pageSize = 10,
  statusFilter = "all",
  selectedCount = 0,
  onDeleteSelected,
  onClearSelection,
}: {
  defaultValue?: string;
  pageSize?: number;
  statusFilter?: string;
  selectedCount?: number;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
}) {
  const t = useTranslations("labVendors");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  const updateQuery = useCallback(
    (updates?: { q?: string; status?: string }) => {
      const params = new URLSearchParams(searchParams.toString());
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
      router.push(`/dashboard/lab-vendors?${params.toString()}`);
    },
    [value, router, searchParams, pageSize]
  );

  const hasFilters = !!searchParams.get("q") || !!searchParams.get("status");
  const showActions = hasFilters || selectedCount > 0;

  return (
    <form
      className="flex flex-wrap items-center gap-2 w-full"
      onSubmit={(e) => {
        e.preventDefault();
        updateQuery();
      }}
    >
      <div className="relative flex-1 min-w-0 w-64 sm:w-72">
        <Label htmlFor="lab-vendor-search" className="sr-only">
          {t("searchLabel")}
        </Label>
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          id="lab-vendor-search"
          placeholder={t("searchPlaceholder")}
          className="pl-8 h-9 text-sm w-full"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
      <Select
        value={statusFilter}
        onValueChange={(v) => updateQuery({ status: v })}
      >
        <SelectTrigger className="h-9 w-[130px]">
          <SelectValue placeholder={t("statusPlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t("allStatus")}</SelectItem>
          <SelectItem value="active">{t("statusActive")}</SelectItem>
          <SelectItem value="pending">{t("statusPending")}</SelectItem>
        </SelectContent>
      </Select>
      <Button type="submit" variant="secondary" size="sm" className="h-9 shrink-0">
        {t("search")}
      </Button>
      {showActions && (
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {selectedCount > 0 && onDeleteSelected && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-9 px-3 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center gap-1.5"
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
                  <Button type="button" onClick={onDeleteSelected} className="font-bold bg-rose-600 hover:bg-rose-700 text-white min-w-[7rem]">
                    {t("delete")}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <Button
            type="button"
            variant="ghost"
            className="h-9 px-4 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all"
            onClick={() => {
              setValue("");
              if (onClearSelection) onClearSelection();
              router.push("/dashboard/lab-vendors?page=1&pageSize=" + pageSize);
            }}
          >
            {t("clear")}
          </Button>
        </div>
      )}
    </form>
  );
}
