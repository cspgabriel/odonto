"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { BookAppointmentForm } from "./book-appointment-form";

export function BookAppointmentButton({
  patientId,
  initialDate,
  open: controlledOpen,
  onOpenChange,
  className,
}: {
  patientId?: string;
  initialDate?: Date;
  /** When provided, opens/closes the sheet programmatically (no button shown). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
} = {}) {
  const t = useTranslations("appointments");
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <>
      {!isControlled && (
        <Button className={className} onClick={() => setOpen(true)}>{t("bookAppointment")}</Button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">{t("bookAppointment")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <BookAppointmentForm
              patientId={patientId}
              defaultStartDate={initialDate}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
