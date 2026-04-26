"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "@/lib/i18n";
import { useCallback, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function InvoiceSearch({
  defaultValue = "",
  pageSize = 10,
  canExport = false,
}: {
  defaultValue?: string;
  pageSize?: number;
  canExport?: boolean;
}) {
  const t = useTranslations("invoices");
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
      router.push(`/dashboard/invoices?${params.toString()}`);
    },
    [value, router, pageSize, searchParams]
  );

  const handleExport = () => {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) params.set("q", value.trim());
    const a = document.createElement("a");
    a.href = `/api/invoices/export?${params.toString()}`;
    a.download = "invoices.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

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
          <Label htmlFor="invoice-search" className="sr-only">
            Search invoices
          </Label>
          <Search
            className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
              isFocused ? "text-primary" : "text-slate-400"
            }`}
          />
          <Input
            id="invoice-search"
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
            <SelectTrigger className="h-10 w-full sm:w-[160px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
              <SelectValue placeholder={t("allStatus")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
              <SelectItem value="all" className="cursor-pointer font-medium text-xs">
                {t("allStatus")}
              </SelectItem>
              <SelectItem value="paid" className="cursor-pointer font-medium text-xs">
                {t("statusPaid")}
              </SelectItem>
              <SelectItem value="unpaid" className="cursor-pointer font-medium text-xs">
                {t("statusPending")}
              </SelectItem>
              <SelectItem value="overdue" className="cursor-pointer font-medium text-xs">
                {t("statusOverdue")}
              </SelectItem>
              <SelectItem value="cancelled" className="cursor-pointer font-medium text-xs">
                {t("statusCancelled")}
              </SelectItem>
            </SelectContent>
          </Select>
          {canExport && (
            <Button
              type="button"
              variant="ghost"
              className="h-10 px-3 rounded-lg font-bold text-slate-600 hover:text-primary hover:bg-slate-100 transition-all flex items-center gap-1.5"
              onClick={handleExport}
            >
              <Download className="h-3.5 w-3.5" />
              <span>{tCommon("export")}</span>
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
