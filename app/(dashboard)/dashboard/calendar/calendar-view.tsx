"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { format, isSameDay } from "date-fns";
import { Calendar as CalendarIcon, Clock } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { usePreferences } from "@/contexts/preferences-context";
import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";

type AppointmentRow = {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  notes?: string | null;
  patientId: string;
  doctorId: string;
  patient: { fullName: string } | null;
  doctor: { fullName: string } | null;
};

export function CalendarView({ appointments }: { appointments: AppointmentRow[] }) {
  const t = useTranslations("calendar");
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const { formatTime } = usePreferences();
  const { openFullProfile } = useFullProfileSheet();

  const appointmentsByDay = useMemo(() => {
    const map = new Map<string, AppointmentRow[]>();
    for (const a of appointments) {
      const d = typeof a.startTime === "string" ? new Date(a.startTime) : a.startTime;
      const key = format(d, "yyyy-MM-dd");
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    for (const arr of map.values()) {
      arr.sort(
        (x, y) =>
          new Date(x.startTime).getTime() - new Date(y.startTime).getTime()
      );
    }
    return map;
  }, [appointments]);

  const selectedKey = selected ? format(selected, "yyyy-MM-dd") : null;
  const dayAppointments = selectedKey
    ? appointmentsByDay.get(selectedKey) ?? []
    : [];

  const daysWithAppointments = useMemo(() => {
    return appointments.map((a) => {
      const d = typeof a.startTime === "string" ? new Date(a.startTime) : a.startTime;
      return format(d, "yyyy-MM-dd");
    });
  }, [appointments]);

  return (
    <div className="grid gap-6 md:grid-cols-[auto_1fr]">
      <Card className="w-fit">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Pick a day</CardTitle>
        </CardHeader>
        <CardContent className="p-0 pb-4">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={setSelected}
            defaultMonth={selected}
            modifiers={{
              hasAppointment: (date) =>
                daysWithAppointments.includes(format(date, "yyyy-MM-dd")),
            }}
            modifiersClassNames={{
              hasAppointment: "font-semibold ring-1 ring-primary/30",
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {selected
              ? isSameDay(selected, new Date())
                ? "Today"
                : format(selected, "EEEE, MMM d, yyyy")
              : "Select a day"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selected ? (
            <p className="text-muted-foreground text-sm">
              {t("selectDayHint")}
            </p>
          ) : dayAppointments.length === 0 ? (
            <EmptyState
              icon={<CalendarIcon className="h-6 w-6" />}
              title={t("emptyNoAppointments")}
              description={t("emptyNoAppointmentsOnDate", { date: format(selected, "MMM d, yyyy") })}
            />
          ) : (
            <ul className="space-y-3">
              {dayAppointments.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/dashboard/appointments?date=${format(
                      typeof a.startTime === "string"
                        ? new Date(a.startTime)
                        : a.startTime,
                      "yyyy-MM-dd"
                    )}`}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        <Button
                          variant="link"
                          className="h-auto p-0 font-medium text-foreground hover:text-primary"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            openFullProfile(a.patientId);
                          }}
                        >
                          {a.patient?.fullName ?? "—"}
                        </Button>
                      </p>
                      <p className="text-muted-foreground text-sm truncate">
                        {a.doctor?.fullName ?? "—"} ·{" "}
                        {formatTime(
                          typeof a.startTime === "string"
                            ? new Date(a.startTime)
                            : a.startTime
                        )}{" "}
                        –{" "}
                        {formatTime(
                          typeof a.endTime === "string"
                            ? new Date(a.endTime)
                            : a.endTime
                        )}
                      </p>
                    </div>
                    <Badge variant="secondary" className="shrink-0 capitalize">
                      {a.status}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
