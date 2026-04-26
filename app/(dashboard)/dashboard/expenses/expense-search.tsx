"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function ExpenseSearch({
  defaultValue = "",
  pageSize = 10,
}: {
  defaultValue?: string;
  pageSize?: number;
}) {
  const router = useRouter();
  const t = useTranslations("expenses");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const updateQuery = useCallback(
    (updates?: { q?: string; status?: string; category?: string }) => {
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
      if (updates?.category !== undefined) {
        if (updates.category && updates.category !== "all") params.set("category", updates.category);
        else params.delete("category");
      }
      params.set("page", "1");
      params.set("pageSize", String(pageSize));
      router.push(`/dashboard/expenses?${params.toString()}`);
    },
    [value, router, pageSize, searchParams]
  );

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
          <Label htmlFor="expense-search" className="sr-only">
            {t("searchLabel")}
          </Label>
          <Search
            className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors pointer-events-none ${
              isFocused ? "text-primary" : "text-slate-400"
            }`}
          />
          <Input
            id="expense-search"
            placeholder={t("searchPlaceholder")}
            className="pl-10 h-10 w-full bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg font-medium text-sm placeholder:text-slate-400 shadow-sm"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
        <div className="flex w-full sm:w-auto shrink-0 items-center gap-2">
          <Select value={searchParams.get("category") ?? "all"} onValueChange={(v) => updateQuery({ category: v })}>
            <SelectTrigger className="h-10 w-full sm:w-[150px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg font-medium text-sm">
              <SelectValue placeholder={t("categoryPlaceholder")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
              <SelectItem value="all" className="cursor-pointer font-medium text-xs">{t("allCategories")}</SelectItem>
              <SelectItem value="utilities" className="cursor-pointer font-medium text-xs">{t("categoryUtilities")}</SelectItem>
              <SelectItem value="equipment" className="cursor-pointer font-medium text-xs">{t("categoryEquipment")}</SelectItem>
              <SelectItem value="maintenance" className="cursor-pointer font-medium text-xs">{t("categoryMaintenance")}</SelectItem>
              <SelectItem value="staff" className="cursor-pointer font-medium text-xs">{t("categoryStaff")}</SelectItem>
              <SelectItem value="insurance" className="cursor-pointer font-medium text-xs">{t("categoryInsurance")}</SelectItem>
              <SelectItem value="other" className="cursor-pointer font-medium text-xs">{t("categoryOther")}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={searchParams.get("status") ?? "all"} onValueChange={(v) => updateQuery({ status: v })}>
            <SelectTrigger className="h-10 w-full sm:w-[130px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg font-medium text-sm">
              <SelectValue placeholder={t("tableStatus")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
              <SelectItem value="all" className="cursor-pointer font-medium text-xs">{t("allStatus")}</SelectItem>
              <SelectItem value="paid" className="cursor-pointer font-medium text-xs">{t("statusPaid")}</SelectItem>
              <SelectItem value="pending" className="cursor-pointer font-medium text-xs">{t("statusPending")}</SelectItem>
              <SelectItem value="cancelled" className="cursor-pointer font-medium text-xs">{t("statusCancelled")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </form>
  );
}
