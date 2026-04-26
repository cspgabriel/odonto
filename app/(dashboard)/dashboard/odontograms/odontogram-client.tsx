"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Eye, Edit, Trash2, ChevronUp, ChevronDown, ChevronsUpDown, HeartPulse } from "lucide-react";
import { deleteOdontogram } from "@/lib/actions/odontogram-actions";
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

const OdontogramDetailModal = dynamic(
  () => import("./odontogram-detail-modal").then((mod) => mod.OdontogramDetailModal),
  {
    loading: () => <div className="h-96 animate-pulse rounded-lg bg-muted" />,
    ssr: false,
  }
);
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

/** Tooth images from public/teeth (run npm run download-teeth once). Preload so chart opens fast. */
const getToothImageUrl = (num: number) => `/teeth/${num}.png`;

function getInitials(name: string): string {
  return (name ?? "")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
  "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
  "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  "bg-purple-50 text-purple-600 dark:bg-purple-500/10",
  "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10",
];

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const styles: Record<string, string> = {
    COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50",
    CANCELLED: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50",
    ACTIVE: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50",
    PENDING: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50",
    ARCHIVED: "bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50",
  };
  const style = styles[s] ?? "bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50";
  return (
    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-widest rounded-md border whitespace-nowrap inline-block text-center min-w-max ${style}`}>
      {status}
    </span>
  );
}

function getProgressIndicatorClass(value: number): string {
  if (value >= 80) return "bg-emerald-500 dark:bg-emerald-500";
  if (value >= 70) return "bg-emerald-400 dark:bg-emerald-500";
  if (value >= 50) return "bg-amber-500 dark:bg-amber-500";
  return "bg-rose-500 dark:bg-rose-500";
}

function getProgressTextClass(value: number): string {
  if (value >= 80) return "text-emerald-600 dark:text-emerald-400 font-bold";
  if (value >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (value >= 50) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
}

/** Treatment completion progress: completed / activeTotal * 100 (cancelled excluded). Same formula as modal "Overall Progress". */
function getTreatmentProgressPercent(treatments: unknown): number {
  if (!Array.isArray(treatments) || treatments.length === 0) return 0;
  const completed = treatments.filter((t: { status?: string }) => t?.status === "completed").length;
  const cancelled = treatments.filter((t: { status?: string }) => t?.status === "cancelled").length;
  const activeTotal = treatments.length - cancelled;
  if (activeTotal === 0) return 0;
  return Math.round((completed / activeTotal) * 100);
}

function ProgressCell({ value }: { value: number }) {
  return (
    <div className="flex items-center justify-between w-[120px] gap-3">
      <Progress
        value={value}
        className="h-2 flex-1"
        indicatorClassName={getProgressIndicatorClass(value)}
      />
      <span className={`text-xs w-8 ${getProgressTextClass(value)}`}>{value}%</span>
    </div>
  );
}

function SortableHeader({ label, sortKey, alignRight }: { label: string; sortKey: string; alignRight?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  
  const currentSortBy = searchParams.get("sortBy") ?? "patientName";
  const currentSortOrder = searchParams.get("sortOrder") ?? "asc";
  const isActive = currentSortBy === sortKey;

  const toggleSort = () => {
    const params = new URLSearchParams(searchParams);
    if (isActive) {
      params.set("sortOrder", currentSortOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortBy", sortKey);
      params.set("sortOrder", "asc");
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <button 
      onClick={toggleSort}
      className={`flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors select-none ${alignRight ? 'ml-auto justify-end' : ''} ${isActive ? 'text-slate-900 dark:text-white' : ''}`}
    >
      {label}
      {isActive ? (
        currentSortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

export function OdontogramClient({ 
  initialData, 
  searchContent,
  children 
}: { 
  initialData: any[];
  searchContent?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const t = useTranslations("odontograms");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [selectedOdontogram, setSelectedOdontogram] = useState<any | null>(null);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // Preload tooth images (1–32) via API proxy so the dental chart modal opens with images already in cache
  useEffect(() => {
    const t = setTimeout(() => {
      for (let num = 1; num <= 32; num++) {
        const img = new Image();
        img.src = getToothImageUrl(num);
      }
    }, 100);
    return () => clearTimeout(t);
  }, []);

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const toggleAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(initialData.map((p) => p.id)));
    } else {
      setSelectedRows(new Set());
    }
  };

  if (!initialData || initialData.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
        {searchContent && (
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
            {React.isValidElement(searchContent)
              ? React.cloneElement(searchContent as React.ReactElement<any>, { 
                  selectedCount: selectedRows.size,
                  onDeleteSelected: async () => {
                    const ids = Array.from(selectedRows);
                    for (const id of ids) await deleteOdontogram(id);
                    setSelectedRows(new Set());
                    router.refresh();
                  },
                  onClearSelection: () => setSelectedRows(new Set())
                })
              : searchContent}
          </div>
        )}
        <div className="flex-1 p-8 py-16 flex items-center justify-center">
          <EmptyState
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            icon={<HeartPulse className="h-6 w-6 text-slate-400" />}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      {searchContent && (
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
          {React.isValidElement(searchContent)
            ? React.cloneElement(searchContent as React.ReactElement<any>, { 
                selectedCount: selectedRows.size,
                onDeleteSelected: async () => {
                  const ids = Array.from(selectedRows);
                  try {
                    for (const id of ids) await deleteOdontogram(id);
                    setSelectedRows(new Set());
                    if (selectedOdontogram && ids.includes(selectedOdontogram.id)) setSelectedOdontogram(null);
                    router.refresh();
                    toast.success(ids.length === 1 ? t("deletedSuccess") : t("bulkDeletedSuccess", { count: ids.length }));
                  } catch {
                    toast.error(t("failedToDelete"));
                  }
                },
                onClearSelection: () => setSelectedRows(new Set())
              })
            : searchContent}
        </div>
      )}
      
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent transition-none">
            <TableHead className="pl-6 w-[50px]">
              <Checkbox 
                checked={selectedRows.size === initialData.length && initialData.length > 0} 
                onCheckedChange={(checked) => toggleAll(!!checked)}
                className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
              />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest pl-2 w-[250px]">
              <SortableHeader label={t("tablePatient")} sortKey="patientName" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[160px]">
              <SortableHeader label={t("tableDoctor")} sortKey="doctorName" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[180px]">
              <SortableHeader label={t("tableDateTime")} sortKey="examinedAt" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-center w-[100px]">
              {t("tableVersion")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px]">
              {t("tableStatus")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[180px] hidden lg:table-cell">
              {t("tableProgress")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest hidden xl:table-cell">
              {t("tableTreatments")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[140px]">
              {t("tableActions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initialData.map((od) => {
            const progressVal = getTreatmentProgressPercent(od.treatments);

            return (
              <TableRow
                key={od.id}
                className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group cursor-pointer"
                onClick={() => setSelectedOdontogram(od)}
              >
                <TableCell className="pl-6 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                  <Checkbox 
                    checked={selectedRows.has(od.id)} 
                    onCheckedChange={() => toggleRow(od.id)}
                    className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
                  />
                </TableCell>
                <TableCell className="pl-2 py-4 align-middle">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-slate-200/60 dark:border-slate-800 shadow-sm shrink-0">
                      <AvatarFallback className={`text-xs font-bold ${getAvatarColor(od.patientId)}`}>
                        {getInitials(od.patientName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900 dark:text-white hover:text-primary transition-colors">
                        {od.patientName}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-4 align-middle">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                    {od.doctorName || "Dr. Annabell"}
                  </span>
                </TableCell>
                <TableCell className="py-4 align-middle">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                      {format(new Date(od.examinedAt), "PP")}
                    </span>
                    <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                      {format(new Date(od.examinedAt), "p")}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4 align-middle text-center">
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/50 whitespace-nowrap inline-block min-w-max">
                    v{od.version || 1}
                  </span>
                </TableCell>
                <TableCell className="py-4 align-middle">
                  <StatusBadge status={od.status || "ACTIVE"} />
                </TableCell>
                <TableCell className="py-4 align-middle hidden lg:table-cell">
                  <ProgressCell value={progressVal} />
                </TableCell>
                <TableCell className="py-4 align-middle hidden xl:table-cell">
                  <span className="text-xs text-slate-500 font-medium line-clamp-1 block">
                    {od.treatments?.length > 0 ? t("treatmentsPlanned", { count: od.treatments.length }) : t("routineCheckup")}
                  </span>
                </TableCell>
                <TableCell className="text-right pr-6 py-4 align-middle" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOdontogram(od);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">{tCommon("edit")}</span>
                    </Button>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{tCommon("delete")}</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E] data-[state=open]:animate-none data-[state=closed]:animate-none sm:zoom-in-100 sm:slide-in-from-bottom-0 sm:fade-in-100 duration-0 transition-none" onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-heading text-lg font-bold">{t("deleteTitle")}</AlertDialogTitle>
                          <AlertDialogDescription className="text-slate-500 text-sm">
                            {t("deleteDescription", { version: od.version || 1 })}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="mt-4 gap-2">
                          <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">{tCommon("cancel")}</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                await deleteOdontogram(od.id);
                                if (selectedOdontogram?.id === od.id) setSelectedOdontogram(null);
                                router.refresh();
                                toast.success(t("deletedSuccess"));
                              } catch {
                                toast.error(t("failedToDelete"));
                              }
                            }}
                            className="font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-6"
                          >
                            {tCommon("confirmDelete")}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      
      {children}

      {selectedOdontogram && (
        <OdontogramDetailModal
          odontogram={selectedOdontogram}
          open={!!selectedOdontogram}
          onOpenChange={(v) => !v && setSelectedOdontogram(null)}
        />
      )}
    </div>
  );
}
