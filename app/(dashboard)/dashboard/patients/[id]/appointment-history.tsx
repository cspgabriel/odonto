"use client";

import Link from "next/link";
import { useTranslations } from "@/lib/i18n";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { usePreferences } from "@/contexts/preferences-context";
import { formatDoctorName } from "@/lib/utils/staff-display";

type Appointment = {
  id: string;
  startTime: Date | string;
  endTime: Date | string;
  status: string;
  notes?: string | null;
  doctor?: { fullName: string; specialization?: string | null } | null;
};

export function AppointmentHistory({
  appointments,
  patientId,
}: {
  appointments: unknown[];
  patientId: string;
}) {
  const t = useTranslations("patients");
  const tAppointments = useTranslations("appointments");
  const tCommon = useTranslations("common");
  const { formatDateTime, formatTime } = usePreferences();
  const list = (appointments ?? []) as Appointment[];
  if (list.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t("appointmentHistoryTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t("noAppointmentsYet")}</p>
          <Button variant="outline" size="sm" className="mt-2" asChild>
            <Link href={`/dashboard/appointments?patientId=${patientId}`}>
              {tAppointments("bookAppointment")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{t("appointmentHistoryTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y">
          {list.map((apt) => (
            <li key={apt.id} className="py-3 first:pt-0 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium">
                  {formatDateTime(apt.startTime)} – {formatTime(apt.endTime)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDoctorName(apt.doctor?.fullName ?? null, apt.doctor?.specialization ?? null)} · {apt.status}
                </p>
                {apt.notes && (
                  <p className="text-xs text-muted-foreground mt-1">{apt.notes}</p>
                )}
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/dashboard/appointments?highlight=${apt.id}`}>{tCommon("view")}</Link>
              </Button>
            </li>
          ))}
        </ul>
        <Button variant="outline" size="sm" className="mt-4" asChild>
          <Link href={`/dashboard/appointments?patientId=${patientId}`}>
            {tAppointments("bookAppointment")}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
