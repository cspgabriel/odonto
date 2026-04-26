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

export function PaymentSearch({
  defaultValue = "",
  pageSize = 10,
}: {
  defaultValue?: string;
  pageSize?: number;
}) {
  const router = useRouter();
  const t = useTranslations("payments");
  const tCommon = useTranslations("common");
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const updateQuery = useCallback(
    (updates?: { q?: string; status?: string; method?: string }) => {
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
      if (updates?.method !== undefined) {
        if (updates.method && updates.method !== "all") params.set("method", updates.method);
        else params.delete("method");
      }
      params.set("page", "1");
      params.set("pageSize", String(pageSize));
      router.push(`/dashboard/payments?${params.toString()}`);
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
          <Label htmlFor="payment-search" className="sr-only">
            {t("searchLabel")}
          </Label>
          <Search
            className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${
              isFocused ? "text-primary" : "text-slate-400"
            }`}
          />
          <Input
            id="payment-search"
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
            value={searchParams.get("method") ?? "all"}
            onValueChange={(v) => updateQuery({ method: v })}
          >
            <SelectTrigger className="h-10 w-full sm:w-[160px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
              <SelectValue placeholder={t("methodPlaceholder")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
              <SelectItem value="all" className="cursor-pointer font-medium text-xs">
                {t("allMethods")}
              </SelectItem>
              <SelectItem value="Insurance" className="cursor-pointer font-medium text-xs">
                {t("methodInsurance")}
              </SelectItem>
              <SelectItem value="Credit Card" className="cursor-pointer font-medium text-xs">
                {t("methodCreditCard")}
              </SelectItem>
              <SelectItem value="Bank Transfer" className="cursor-pointer font-medium text-xs">
                {t("methodBankTransfer")}
              </SelectItem>
              <SelectItem value="card" className="cursor-pointer font-medium text-xs">
                {t("methodCard")}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={searchParams.get("status") ?? "all"}
            onValueChange={(v) => updateQuery({ status: v })}
          >
            <SelectTrigger className="h-10 w-full sm:w-[140px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
              <SelectValue placeholder={t("tableStatus")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
              <SelectItem value="all" className="cursor-pointer font-medium text-xs">
                {t("allStatus")}
              </SelectItem>
              <SelectItem value="completed" className="cursor-pointer font-medium text-xs">
                {t("statusCompleted")}
              </SelectItem>
              <SelectItem value="pending" className="cursor-pointer font-medium text-xs">
                {t("statusPending")}
              </SelectItem>
              <SelectItem value="failed" className="cursor-pointer font-medium text-xs">
                {t("statusFailed")}
              </SelectItem>
            </SelectContent>
          </Select>
          {(searchParams.get("q") || searchParams.get("status") || searchParams.get("method")) && (
            <button
              type="button"
              className="h-10 px-4 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all text-sm"
              onClick={() => {
                setValue("");
                router.push(`/dashboard/payments?page=1&pageSize=${pageSize}`);
              }}
            >
              {tCommon("clear")}
            </button>
          )}
        </div>
      </div>
    </form>
  );
}
