"use client";

import type { TimelineEvent } from "@/lib/actions/medical-records-actions";
import type { GanttFeature, GanttStatus } from "@/components/ui/gantt";
import {
  GanttProvider,
  GanttSidebar,
  GanttSidebarGroup,
  GanttSidebarItem,
  GanttTimeline,
  GanttHeader,
  GanttFeatureList,
  GanttFeatureListGroup,
  GanttFeatureItem,
  GanttToday,
  GanttCreateMarkerTrigger,
} from "@/components/ui/gantt";
import { addDays, addHours, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { formatDoctorName } from "@/lib/utils/staff-display";
import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";
import { AppointmentDetailSheet } from "@/components/dashboard/appointment-detail-sheet";
import { rescheduleAppointment } from "@/lib/actions/appointment-actions";
import { BookAppointmentButton } from "@/app/(dashboard)/dashboard/appointments/book-appointment-button";

/** Per-doctor colors for sidebar and cards (Visit Timeline) */
const DOCTOR_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#06B6D4", // cyan
  "#EC4899", // pink
];

/** Group key for doctor grouping: doctorId or doctorName or "Unassigned" */
function getDoctorKey(event: TimelineEvent): string {
  const id = event.meta?.doctorId as string | undefined;
  const name = event.userName as string | undefined;
  return id ?? name ?? "Unassigned";
}

function getDoctorLabel(event: TimelineEvent): string {
  return formatDoctorName(
    event.userName ?? null,
    (event.meta?.doctorSpecialization as string) ?? event.userSpecialization ?? null
  );
}

function timelineEventToGanttFeature(event: TimelineEvent, doctorColor: string): GanttFeature {
  const startAt =
    event.type === "visit_created" && event.meta?.startTime
      ? new Date(event.meta.startTime as string)
      : new Date(event.timestamp);
  let endAt: Date;
  if (event.type === "visit_created" && event.meta?.endTime) {
    endAt = new Date(event.meta.endTime as string);
    if (endAt <= startAt) endAt = addHours(startAt, 1);
  } else if (event.type === "diagnosis_added") {
    endAt = addDays(startAt, 14);
  } else if (event.type === "note_added" || event.type === "attachment_uploaded") {
    endAt = addDays(startAt, 3);
  } else {
    endAt = addDays(startAt, 1);
  }
  return {
    id: event.id,
    name: event.patientName
      ? `${event.patientName} – Visit`
      : event.label,
    startAt,
    endAt,
    status: { id: "visit", name: "Visit", color: doctorColor },
  };
}

/** Pixels to offset each same-day appointment so they fan out across months instead of stacking. */
const SPREAD_PX_PER_INDEX = 90;

type DoctorGroup = { doctorKey: string; doctorLabel: string; doctorColor: string; features: GanttFeature[] };

function groupAppointmentsByDoctor(events: TimelineEvent[]): DoctorGroup[] {
  const visits = events.filter((e) => e.type === "visit_created");
  const byDoctor = new Map<string, { label: string; color: string; features: GanttFeature[] }>();
  const doctorOrder: string[] = [];
  for (const event of visits) {
    const key = getDoctorKey(event);
    const label = getDoctorLabel(event);
    if (!byDoctor.has(key)) {
      const color = DOCTOR_COLORS[doctorOrder.length % DOCTOR_COLORS.length];
      doctorOrder.push(key);
      byDoctor.set(key, { label, color, features: [] });
    }
    const entry = byDoctor.get(key)!;
    entry.features.push(timelineEventToGanttFeature(event, entry.color));
  }
  // Spread same-day visits per doctor
  for (const entry of byDoctor.values()) {
    const byDay = new Map<number, GanttFeature[]>();
    for (const f of entry.features) {
      const dayKey = startOfDay(f.startAt).getTime();
      if (!byDay.has(dayKey)) byDay.set(dayKey, []);
      byDay.get(dayKey)!.push(f);
    }
    for (const dayFeatures of byDay.values()) {
      dayFeatures.forEach((f, i) => {
        f.spreadOffsetPx = i * SPREAD_PX_PER_INDEX;
      });
    }
  }
  // Stable order by doctor label
  return Array.from(byDoctor.entries())
    .map(([doctorKey, { label, color, features }]) => ({ doctorKey, doctorLabel: label, doctorColor: color, features }))
    .sort((a, b) => a.doctorLabel.localeCompare(b.doctorLabel));
}

export function VisitTimelineGantt({
  events,
  canEdit = false,
  canAdd = false,
}: {
  events: TimelineEvent[];
  canEdit?: boolean;
  canAdd?: boolean;
}) {
  const t = useTranslations("medicalRecords");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { openFullProfile } = useFullProfileSheet();
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);

  const doctorGroups = groupAppointmentsByDoctor(events);

  /** Opens appointment detail sheet. All timeline items here are visit_created, so id = appointment id. */
  const handleSelectItem = (id: string) => setSelectedAppointmentId(id);

  const handleViewPatient = (patientId: string) => {
    setSelectedAppointmentId(null);
    openFullProfile(patientId);
  };

  const handleMove = useCallback(
    async (id: string, startAt: Date, endAt: Date | null) => {
      const event = events.find((e) => e.id === id);
      if (!event) return;
      if (event.type !== "visit_created") {
        toast.info("Only visits can be rescheduled from the timeline.");
        return;
      }
      const end = endAt ?? addHours(startAt, 1);
      const result = await rescheduleAppointment({
        appointmentId: id,
        newStartTime: startAt.toISOString(),
        newEndTime: end.toISOString(),
      });
      if (result.success) {
        toast.success(t("visitRescheduled"));
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to reschedule.");
      }
    },
    [events, router]
  );

  if (events.length === 0) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-slate-500 bg-card">
        <p className="font-semibold">No appointments</p>
        <p className="text-sm mt-1">Shows past 3 days + next 3 months. Appointments will appear here. Drag bars to edit date; scroll horizontally for more months.</p>
      </div>
    );
  }

  const [addAtDate, setAddAtDate] = useState<Date | null>(null);
  const handleAddAtDate = useCallback((date: Date) => setAddAtDate(date), []);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-2 bg-card">
      {canAdd && (
        <BookAppointmentButton
          key={addAtDate?.toISOString() ?? "idle"}
          open={!!addAtDate}
          onOpenChange={(o) => !o && setAddAtDate(null)}
          initialDate={addAtDate ?? undefined}
        />
      )}
      <GanttProvider
        range="monthly"
        zoom={100}
        rowHeight={44}
        endYear={2030}
        onAddItem={canAdd ? handleAddAtDate : undefined}
        goToTodayTitle={tCommon("goToTodayAndZoomIn")}
        className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border border-slate-200/60 dark:border-slate-800/60 rounded-lg"
      >
          <GanttSidebar>
            {doctorGroups.map(({ doctorKey, doctorLabel, doctorColor, features }, idx) => (
              <GanttSidebarGroup
                key={doctorKey}
                name={doctorLabel}
                groupColor={doctorColor}
                collapsible
                defaultOpen={idx === 0}
              >
                {features.map((feature) => (
                  <GanttSidebarItem
                    key={feature.id}
                    feature={feature}
                    onSelectItem={handleSelectItem}
                  />
                ))}
              </GanttSidebarGroup>
            ))}
          </GanttSidebar>
          <GanttTimeline>
            <GanttHeader />
            <GanttFeatureList>
              {doctorGroups.map(({ doctorKey, features }) => (
              <GanttFeatureListGroup key={doctorKey}>
                {features.map((feature) => (
                  <GanttFeatureItem
                    key={feature.id}
                    {...feature}
                    onMove={canEdit ? handleMove : undefined}
                    onSelectItem={handleSelectItem}
                  />
                ))}
              </GanttFeatureListGroup>
            ))}
            </GanttFeatureList>
            {canAdd && <GanttCreateMarkerTrigger onCreateMarker={handleAddAtDate} />}
            <GanttToday />
          </GanttTimeline>
        </GanttProvider>
      <AppointmentDetailSheet
        appointmentId={selectedAppointmentId}
        open={!!selectedAppointmentId}
        onOpenChange={(open) => !open && setSelectedAppointmentId(null)}
        onViewPatient={handleViewPatient}
      />
    </div>
  );
}
