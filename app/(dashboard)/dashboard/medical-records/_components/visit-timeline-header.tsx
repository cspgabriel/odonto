"use client";

import { useTranslations } from "next-intl";
import { BookAppointmentButton } from "@/app/(dashboard)/dashboard/appointments/book-appointment-button";

export function VisitTimelineHeader({ canAdd }: { canAdd: boolean }) {
  const t = useTranslations("medicalRecords");
  return (
    <div className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 pb-3">
      <div className="min-w-0">
        <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
          {t("visitTimelineTitle")}
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          {t("visitTimelineDescription")}
        </p>
      </div>
      {canAdd && (
        <BookAppointmentButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md" />
      )}
    </div>
  );
}
