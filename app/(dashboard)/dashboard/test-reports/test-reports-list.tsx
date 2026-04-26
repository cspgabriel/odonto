"use client";

import React, { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { useTranslations } from "@/lib/i18n";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FileText, Edit } from "lucide-react";
import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";
import { bulkDeleteTestReports } from "@/lib/actions/lab-test-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface TestReport {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentId: string | null;
  labVendorId: string | null;
  testType: string;
  results: string;
  notes: string | null;
  reportDate: string;
  status: string;
  attachments: string[] | null;
  patientName: string;
  doctorName: string;
  vendorName: string | null;
}

export function TestReportsList({
  testReports: list,
  searchContent,
  createAction,
  children,
}: {
  testReports: TestReport[];
  searchContent?: React.ReactNode;
  createAction?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const t = useTranslations("testReports");
  const tCommon = useTranslations("common");
  const router = useRouter();
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
    setSelectedRows(checked ? new Set(list.map((r) => r.id)) : new Set());
  };

  const handlePatientClick = (patientId: string) => {
    openFullProfile(patientId);
  };

  const searchWithProps =
    searchContent && React.isValidElement(searchContent)
      ? React.cloneElement(
          searchContent as React.ReactElement<{
            selectedCount?: number;
            onDeleteSelected?: () => void;
            onClearSelection?: () => void;
          }>,
          {
            selectedCount: selectedRows.size,
            onDeleteSelected: async () => {
              const ids = Array.from(selectedRows);
              const result = await bulkDeleteTestReports(ids);
              if (result.success) {
                setSelectedRows(new Set());
                toast.success(t("deletedCount", { count: ids.length }));
                router.refresh();
              } else {
                toast.error(result.error);
              }
            },
            onClearSelection: () => setSelectedRows(new Set()),
          }
        )
      : searchContent;

  if (list.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
        {searchWithProps && (
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
            {searchWithProps}
          </div>
        )}
        <EmptyState
          icon={<FileText className="h-6 w-6" />}
          title={t("noTestReportsYet")}
          description={t("noTestReportsDescription")}
          action={createAction}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      {searchWithProps && (
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
          {searchWithProps}
        </div>
      )}
      <Table>
        <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
          <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent transition-none">
            <TableHead className="pl-6 w-[50px]">
              <Checkbox
                checked={selectedRows.size === list.length && list.length > 0}
                onCheckedChange={(c) => toggleAll(!!c)}
                className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
              />
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest pl-2">
              {t("reportDetails")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              {t("patient")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              {t("test")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              {t("vendor")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              {t("testDate")}
            </TableHead>
            <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
              {t("status")}
            </TableHead>
          <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest">
            {t("attachments")}
          </TableHead>
          <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[80px]">
            {t("actions")}
          </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.map((report) => (
            <TableRow
              key={report.id}
              className="border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
            >
              <TableCell className="pl-6 py-4 align-middle">
                <Checkbox
                  checked={selectedRows.has(report.id)}
                  onCheckedChange={() => toggleRow(report.id)}
                  className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
                />
              </TableCell>
              <TableCell className="pl-2 py-4 align-middle">
                <span className="font-medium text-slate-900 dark:text-white">
                  {report.testType} – {format(new Date(report.reportDate), "MMM d, yyyy")}
                </span>
              </TableCell>
              <TableCell className="py-4 align-middle">
                <button
                  type="button"
                  onClick={() => handlePatientClick(report.patientId)}
                  className="text-primary hover:underline font-medium text-left"
                >
                  {report.patientName}
                </button>
              </TableCell>
              <TableCell className="py-4 align-middle">{report.testType}</TableCell>
              <TableCell className="py-4 align-middle">{report.vendorName ?? "—"}</TableCell>
              <TableCell className="py-4 align-middle">{format(new Date(report.reportDate), "MMM dd, yyyy")}</TableCell>
              <TableCell className="py-4 align-middle">
                <span
                  className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${
                    report.status === "verified"
                      ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                      : report.status === "delivered"
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10"
                        : report.status === "recorded"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                  }`}
                >
                  {report.status}
                </span>
              </TableCell>
              <TableCell className="py-4 align-middle">
                {report.attachments && report.attachments.length > 0
                  ? t("filesCount", { count: report.attachments.length })
                  : "—"}
              </TableCell>
              <TableCell className="text-right pr-6 py-4 align-middle">
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary" asChild>
                  <Link href={`/dashboard/test-reports/${report.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">{tCommon("edit")}</span>
                  </Link>
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
