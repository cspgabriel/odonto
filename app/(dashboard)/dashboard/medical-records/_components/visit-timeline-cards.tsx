"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CalendarDays, User, Clock } from "lucide-react";
import { FullProfileButton } from "@/components/dashboard/full-profile-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import { formatDoctorName } from "@/lib/utils/staff-display";

type VisitRow = {
  id: string;
  patientId: string;
  patientName: string | null;
  doctorName: string | null;
  doctorSpecialization?: string | null;
  startTime: Date;
  endTime: Date;
  status: string;
  notes: string | null;
  createdAt: Date;
};

export function VisitTimelineCards({
  list,
  searchContent,
  children,
}: {
  list: VisitRow[];
  searchContent?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const t = useTranslations("medicalRecords");
  if (list.length === 0) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
        {searchContent && (
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
            {searchContent}
          </div>
        )}
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" />}
          title={t("emptyNoVisits")}
          description={t("emptyNoVisitsDescription")}
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
      {searchContent && (
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
          {searchContent}
        </div>
      )}
      <div className="p-4 space-y-3">
        {list.map((row) => (
          <Card
            key={row.id}
            className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 border-slate-200/60 dark:border-slate-800/60"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-muted p-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-sm">
                  {row.startTime ? format(new Date(row.startTime), "EEE, MMM d, yyyy · HH:mm") : "—"}
                </span>
              </div>
              <span
                className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                  row.status === "completed"
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : row.status === "cancelled"
                      ? "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                      : row.status === "confirmed"
                        ? "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                }`}
              >
                {row.status}
              </span>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                  <FullProfileButton
                    patientId={row.patientId}
                    variant="link"
                    className="h-auto p-0 font-semibold text-slate-900 dark:text-white hover:text-primary"
                  >
                    {row.patientName ?? "—"}
                  </FullProfileButton>
                </div>
                {row.doctorName && (
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <span>{formatDoctorName(row.doctorName, row.doctorSpecialization ?? null)}</span>
                  </div>
                )}
                {row.endTime && (
                  <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-500">
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {format(new Date(row.startTime), "HH:mm")} – {format(new Date(row.endTime), "HH:mm")}
                    </span>
                  </div>
                )}
              </div>
              {row.notes && (
                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {row.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {children}
    </div>
  );
}
