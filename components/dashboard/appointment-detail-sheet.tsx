"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2, User, Calendar, Clock } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAppointmentById } from "@/lib/actions/appointment-actions";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_VARIANTS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  completed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  cancelled: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

type AppointmentData = {
  id: string;
  patientId: string;
  doctorId: string;
  startTime: Date;
  endTime: Date;
  status: string;
  notes: string | null;
  patientName?: string;
  doctorName?: string;
};

export function AppointmentDetailSheet({
  appointmentId,
  open,
  onOpenChange,
  onViewPatient,
}: {
  appointmentId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when user clicks "View patient file" – parent can open PatientFileDrawer */
  onViewPatient?: (patientId: string) => void;
}) {
  const tCommon = useTranslations("common");
  const [data, setData] = useState<AppointmentData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !appointmentId) {
      setData(null);
      return;
    }
    setLoading(true);
    getAppointmentById(appointmentId)
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setData({
            id: d.id,
            patientId: d.patientId,
            doctorId: d.doctorId,
            startTime: new Date(d.startTime),
            endTime: new Date(d.endTime),
            status: d.status,
            notes: d.notes,
            patientName: d.patientName,
            doctorName: d.doctorName,
          });
        } else {
          toast.error(res.success ? undefined : res.error ?? tCommon("failedToLoadAppointment"));
        }
      })
      .catch(() => toast.error(tCommon("failedToLoadAppointment")))
      .finally(() => setLoading(false));
  }, [open, appointmentId]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[520px] sm:max-w-[520px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            Appointment Details
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">Loading appointment...</p>
            </div>
          ) : data ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-2">
                <Badge
                  className={STATUS_VARIANTS[data.status] ?? STATUS_VARIANTS.pending}
                  variant="outline"
                >
                  {data.status}
                </Badge>
                {onViewPatient && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="font-bold"
                    onClick={() => {
                      onOpenChange(false);
                      onViewPatient(data.patientId);
                    }}
                  >
                    View patient file
                  </Button>
                )}
              </div>

              <div className="space-y-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Patient</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {data.patientName || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Doctor</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {data.doctorName || "Unknown"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Date</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {format(data.startTime, "EEEE, MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Time</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {format(data.startTime, "h:mm a")} – {format(data.endTime, "h:mm a")}
                    </p>
                  </div>
                </div>
              </div>

              {data.notes && (
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notes</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 rounded-lg border border-slate-200/60 dark:border-slate-800/60 p-3 bg-slate-50/50 dark:bg-slate-900/50">
                    {data.notes}
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="font-bold" asChild>
                  <Link href={`/dashboard/medical-records?patientId=${data.patientId}`}>
                    Medical Records
                  </Link>
                </Button>
                <Button variant="outline" className="font-bold" asChild>
                  <Link href={`/dashboard/appointments/${data.id}/edit`}>Edit Appointment</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
