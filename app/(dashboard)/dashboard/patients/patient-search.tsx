"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { toast } from "sonner";
import { useTranslations } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Search, Download, Trash2, Loader2 } from "lucide-react";
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

export function PatientSearch({
  defaultValue = "",
  pageSize = 10,
  action,
  selectedCount = 0,
  canDelete = true,
  canExport = false,
  onDeleteSelected,
  onClearSelection,
}: {
  defaultValue?: string;
  currentPage?: number;
  pageSize?: number;
  action?: React.ReactNode;
  selectedCount?: number;
  canDelete?: boolean;
  canExport?: boolean;
  onDeleteSelected?: () => void;
  onClearSelection?: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("patients");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const [value, setValue] = useState(defaultValue);

  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  const updateQuery = useCallback((updates?: { q?: string; type?: string; status?: string; gender?: string; bg?: string }) => {
    const params = new URLSearchParams(searchParams);
    
    // Manage query
    if (updates && updates.q !== undefined) {
      if (updates.q.trim()) params.set("q", updates.q.trim());
      else params.delete("q");
    } else if (value.trim()) {
      params.set("q", value.trim());
    } else {
      params.delete("q");
    }

    // Manage type
    if (updates && 'type' in updates) {
      if (updates.type) params.set("type", updates.type);
      else params.delete("type");
    }

    // Manage status
    if (updates && 'status' in updates) {
      if (updates.status) params.set("status", updates.status);
      else params.delete("status");
    }

    // Manage gender
    if (updates && 'gender' in updates) {
      if (updates.gender) params.set("gender", updates.gender);
      else params.delete("gender");
    }

    // Manage blood group
    if (updates && 'bg' in updates) {
      if (updates.bg) params.set("bg", updates.bg);
      else params.delete("bg");
    }

    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    router.push(`/dashboard/patients?${params.toString()}`);
  }, [value, router, pageSize, searchParams]);

  const handleDownload = () => {
    const params = new URLSearchParams(searchParams);
    if (value.trim()) params.set("q", value.trim());
    toast.loading(t("preparingDownload"), { id: "patient-export" });
    const a = document.createElement("a");
    a.href = `/api/patients/export?${params.toString()}`;
    a.download = "patients.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => {
      toast.success(t("downloadStarted"), { id: "patient-export" });
    }, 600);
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
        
        {/* Search Input */}
        <div className="relative flex-1 w-full sm:w-auto">
          <Label htmlFor="patient-search" className="sr-only">
            {t("searchPatients")}
          </Label>
          <Search className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 transition-colors duration-200 pointer-events-none ${isFocused ? "text-primary" : "text-slate-400"}`} />
          <Input
            id="patient-search"
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
            <Label className="sr-only">{t("typeFilter")}</Label>
            <Select 
              value={searchParams.get("type") ?? "all"}
              onValueChange={(v) => updateQuery(v === "all" ? { type: "" } : { type: v })}
            >
              <SelectTrigger className="h-10 w-full sm:w-[150px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
                <SelectValue placeholder={t("allTypes")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                <SelectItem value="all" className="cursor-pointer font-medium text-xs">{t("allTypes")}</SelectItem>
                <SelectItem value="adults" className="cursor-pointer font-medium text-xs">{t("adults")}</SelectItem>
                <SelectItem value="pediatric" className="cursor-pointer font-medium text-xs">{t("pediatric")}</SelectItem>
                <SelectItem value="seniors" className="cursor-pointer font-medium text-xs">{t("seniors")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="shrink-0 flex-1 sm:flex-none">
            <Label className="sr-only">{t("statusFilter")}</Label>
            <Select 
              value={searchParams.get("status") ?? "all"}
              onValueChange={(v) => updateQuery(v === "all" ? { status: "" } : { status: v })}
            >
              <SelectTrigger className="h-10 w-full sm:w-[140px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
                <SelectValue placeholder={t("allStatus")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                <SelectItem value="all" className="cursor-pointer font-medium text-xs">{t("allStatus")}</SelectItem>
                <SelectItem value="active" className="cursor-pointer font-medium text-xs">{tStatus("active")}</SelectItem>
                <SelectItem value="inactive" className="cursor-pointer font-medium text-xs">{tStatus("inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="shrink-0 flex-1 sm:flex-none">
            <Label className="sr-only">{t("genderFilter")}</Label>
            <Select 
              value={searchParams.get("gender") ?? "all"}
              onValueChange={(v) => updateQuery(v === "all" ? { gender: "" } : { gender: v })}
            >
              <SelectTrigger className="h-10 w-full sm:w-[130px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
                <SelectValue placeholder={t("allGenders")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                <SelectItem value="all" className="cursor-pointer font-medium text-xs">{t("allGenders")}</SelectItem>
                <SelectItem value="Male" className="cursor-pointer font-medium text-xs">Male</SelectItem>
                <SelectItem value="Female" className="cursor-pointer font-medium text-xs">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="shrink-0 flex-1 sm:flex-none">
            <Label className="sr-only">{t("bloodFilter")}</Label>
            <Select 
              value={searchParams.get("bg") ?? "all"}
              onValueChange={(v) => updateQuery(v === "all" ? { bg: "" } : { bg: v })}
            >
              <SelectTrigger className="h-10 w-full sm:w-[110px] bg-white dark:bg-[#0B0B1E] border-slate-200/60 dark:border-slate-800/60 rounded-lg focus:ring-primary/50 font-medium text-sm transition-all text-slate-700 dark:text-slate-200 shadow-sm">
                <SelectValue placeholder={t("allBlood")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800">
                <SelectItem value="all" className="cursor-pointer font-medium text-xs">{t("allBlood")}</SelectItem>
                <SelectItem value="A+" className="cursor-pointer font-medium text-xs">A+</SelectItem>
                <SelectItem value="A-" className="cursor-pointer font-medium text-xs">A-</SelectItem>
                <SelectItem value="B+" className="cursor-pointer font-medium text-xs">B+</SelectItem>
                <SelectItem value="B-" className="cursor-pointer font-medium text-xs">B-</SelectItem>
                <SelectItem value="O+" className="cursor-pointer font-medium text-xs">O+</SelectItem>
                <SelectItem value="O-" className="cursor-pointer font-medium text-xs">O-</SelectItem>
                <SelectItem value="AB+" className="cursor-pointer font-medium text-xs">AB+</SelectItem>
                <SelectItem value="AB-" className="cursor-pointer font-medium text-xs">AB-</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(searchParams.get("q") || searchParams.get("type") || searchParams.get("status") || searchParams.get("gender") || searchParams.get("bg") || selectedCount > 0) ? (
            <div className="flex items-center gap-1 shrink-0 ml-1">
              {selectedCount > 0 && canDelete && onDeleteSelected && (
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
                      <AlertDialogTitle className="font-heading">{t("bulkDeleteTitle")}</AlertDialogTitle>
                      <AlertDialogDescription className="text-slate-500">
                        {t("bulkDeleteDescription", { count: selectedCount })}
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800">{tCommon("cancel")}</AlertDialogCancel>
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
              {canExport && (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 px-3 rounded-lg font-bold text-slate-600 hover:text-primary hover:bg-slate-100 transition-all flex items-center gap-1.5"
                  onClick={handleDownload}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{tCommon("export")}</span>
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                className="h-10 px-4 rounded-lg font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-all flex items-center justify-center"
                onClick={() => {
                  setValue("");
                  if (onClearSelection) onClearSelection();
                  router.push("/dashboard/patients?page=1&pageSize=" + pageSize);
                }}
              >
                {tCommon("clear")}
              </Button>
            </div>
          ) : null}
          {action && <div className="ml-auto flex items-center gap-2">{action}</div>}
        </div>
      </div>
    </form>
  );
}
