"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  CalendarDays,
  Activity,
  FileText,
  Stethoscope,
  Paperclip,
  User,
  Clock,
  Pill,
  FlaskConical,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { format } from "date-fns";
import type { TimelineEvent, TimelineEventType } from "@/lib/actions/medical-records-actions";
import { formatDoctorName } from "@/lib/utils/staff-display";
import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";

const EVENT_ICONS: Record<TimelineEventType, React.ReactNode> = {
  visit_created: <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />,
  vitals_recorded: <Activity className="h-3.5 w-3.5 text-muted-foreground" />,
  diagnosis_added: <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />,
  attachment_uploaded: <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />,
  note_added: <FileText className="h-3.5 w-3.5 text-muted-foreground" />,
  prescription_issued: <Pill className="h-3.5 w-3.5 text-muted-foreground" />,
  test_report_added: <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />,
};

export function TimelineEventCards({
  list,
  searchContent,
  children,
}: {
  list: TimelineEvent[];
  searchContent?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const { openFullProfile } = useFullProfileSheet();
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
          title={t("emptyNoTimelineEvents")}
          description={t("emptyNoTimelineEventsDescription")}
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
      <div className="relative py-6 pl-8 pr-4">
        {/* Vertical line */}
        <div className="absolute left-[19px] top-6 bottom-6 w-px bg-slate-200/80 dark:bg-slate-700/80" />
        <div className="space-y-6 relative">
          {list.map((event) => (
            <div key={event.id} className="relative flex gap-4">
              {/* Dot + icon */}
              <div className="absolute -left-8 flex h-9 w-9 items-center justify-center rounded-full border-2 border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-[#0B0B1E] shadow-sm z-10">
                <div className="rounded-md bg-muted p-1">
                  {EVENT_ICONS[event.type]}
                </div>
              </div>
              <Card className="flex-1 min-w-0 group relative transition-all duration-200 hover:shadow-md border-border/50 border-slate-200/60 dark:border-slate-800/60">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4 pb-2 px-4 pt-4">
                  <div className="space-y-1 min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white text-sm block">
                      {event.label}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{format(new Date(event.timestamp), "EEE, MMM d, yyyy · HH:mm")}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <Button
                      variant="link"
                      className="h-auto p-0 font-semibold text-slate-900 dark:text-white hover:text-primary"
                      onClick={() => openFullProfile(event.patientId)}
                    >
                      <span className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {event.patientName ?? "—"}
                      </span>
                    </Button>
                    {event.userName && (
                      <span className="text-slate-600 dark:text-slate-400">
                        By {formatDoctorName(event.userName, event.userSpecialization ?? null)}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
      {children}
    </div>
  );
}
