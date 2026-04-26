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

export function StaffSearch({
  defaultValue = "",
  pageSize = 10,
  selectedCount = 0,
  onDeleteSelected,
  onClearSelection,
}: {
  defaultValue?: string;
  pageSize?: number;
  selectedCount?: number;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
}) {
  const t = useTranslations("staff");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  const updateQuery = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    router.push(`/dashboard/staff?${params.toString()}`);
  }, [value, router, searchParams, pageSize]);

  const hasFilters = !!searchParams.get("q");
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
        <Label htmlFor="staff-search" className="sr-only">
          {t("searchLabel")}
        </Label>
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          id="staff-search"
          placeholder={t("searchPlaceholder")}
          className="pl-8 h-9 text-sm w-full"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
      </div>
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
                    {t("bulkDeleteDescription", { count: selectedCount })} {tCommon("deleteDescription")}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800">{tCommon("cancel")}</AlertDialogCancel>
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
            className="h-9 px-4 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center"
            onClick={() => {
              setValue("");
              if (onClearSelection) onClearSelection();
              router.push("/dashboard/staff?page=1&pageSize=" + pageSize);
            }}
          >
            {t("clear")}
          </Button>
        </div>
      )}
    </form>
  );
}
