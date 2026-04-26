"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, ChevronUp, ChevronDown, ChevronsUpDown, Eye } from "lucide-react";
import type { MedicalRecordOverviewRow } from "@/lib/actions/medical-records-actions";
import { formatDoctorName } from "@/lib/utils/staff-display";
import { format } from "date-fns";
import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";

const AVATAR_COLORS = [
  "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
  "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
  "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  "bg-purple-50 text-purple-600 dark:bg-purple-500/10",
  "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10",
];

function getInitials(name: string | null): string {
  return (name ?? "")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function SortableHeader({
  label,
  sortKey,
}: {
  label: string;
  sortKey: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const currentSortBy = searchParams.get("sortBy") ?? "lastActivityAt";
  const currentSortOrder = searchParams.get("sortOrder") ?? "desc";
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
      className={`flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors select-none ${isActive ? "text-slate-900 dark:text-white" : ""}`}
    >
      {label}
      {isActive ? (
        currentSortOrder === "asc" ? (
          <ChevronUp className="h-3 w-3" />
        ) : (
          <ChevronDown className="h-3 w-3" />
        )
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}

export function MedicalRecordsOverviewTable({
  list,
  searchContent,
  children,
}: {
  list: MedicalRecordOverviewRow[];
  searchContent?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const t = useTranslations("medicalRecords");
  const { openFullProfile } = useFullProfileSheet();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (checked: boolean) => {
    setSelectedRows(checked ? new Set(list.map((r) => r.patientId)) : new Set());
  };

  if (list.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
        {searchContent && (
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
            {searchContent}
          </div>
        )}
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={t("emptyTitle")}
          description={t("emptyDescription")}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      {searchContent && (
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
          {searchContent}
        </div>
      )}
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent transition-none">
            <TableHead className="pl-6 w-[50px]">
              <Checkbox
                checked={selectedRows.size === list.length && list.length > 0}
                onCheckedChange={(checked) => toggleAll(!!checked)}
                className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
              />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest pl-2 w-[250px]">
              <SortableHeader label={t("tablePatient")} sortKey="patientName" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[180px] hidden md:table-cell">
              {t("tablePrimaryDoctor")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[120px]">
              <SortableHeader label={t("tableTotalRecords")} sortKey="totalRecords" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px]">
              {t("tableActiveCases")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[100px] hidden md:table-cell">
              {t("tableCompletedVisits")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[140px]">
              <SortableHeader label={t("tableLastActivity")} sortKey="lastActivityAt" />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[100px]">
              {t("actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((row) => (
            <TableRow
              key={row.patientId}
              className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
            >
              <TableCell className="pl-6 py-4 align-middle">
                <Checkbox
                  checked={selectedRows.has(row.patientId)}
                  onCheckedChange={() => toggleRow(row.patientId)}
                  className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
                />
              </TableCell>
              <TableCell className="pl-2 py-4 align-middle">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 border border-slate-200/60 dark:border-slate-800 shadow-sm shrink-0">
                    <AvatarFallback
                      className={`text-xs font-bold ${getAvatarColor(row.patientId)}`}
                    >
                      {getInitials(row.patientName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <Button
                      variant="link"
                      className="h-auto p-0 font-bold text-slate-900 dark:text-white hover:text-primary justify-start"
                      onClick={() => openFullProfile(row.patientId)}
                    >
                      {row.patientName ?? "—"}
                    </Button>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4 align-middle hidden md:table-cell font-medium text-slate-600 dark:text-slate-300 text-sm">
                {formatDoctorName(row.primaryDoctorName, row.primaryDoctorSpecialization)}
              </TableCell>
              <TableCell className="py-4 align-middle">
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm tabular-nums">
                  {row.totalRecords}
                </span>
              </TableCell>
              <TableCell className="py-4 align-middle">
                <span
                  className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${
                    row.activeCases > 0
                      ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {row.activeCases}
                </span>
              </TableCell>
              <TableCell className="py-4 align-middle hidden md:table-cell font-semibold text-slate-700 dark:text-slate-300 text-sm tabular-nums">
                {row.completedVisits}
              </TableCell>
              <TableCell className="py-4 align-middle">
                <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm whitespace-nowrap">
                  {row.lastActivityAt
                    ? format(new Date(row.lastActivityAt), "yyyy-MM-dd HH:mm")
                    : "—"}
                </span>
              </TableCell>
              <TableCell className="text-right pr-6 py-4 align-middle">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                  onClick={() => openFullProfile(row.patientId)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="sr-only">{t("view")}</span>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {children}
    </div>
  );
}
