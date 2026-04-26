"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PrescriptionForm } from "./prescription-form";

export function AddPrescriptionButton({
  className,
  doctors,
  patients,
}: {
  className?: string;
  doctors: { id: string; fullName: string }[];
  patients: { id: string; fullName: string }[];
}) {
  const t = useTranslations("prescriptions");
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className={className ?? "shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md"}
        onClick={() => setOpen(true)}
      >
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        {t("addPrescription")}
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
        >
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
              {t("addPrescription")}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <PrescriptionForm
              doctors={doctors}
              patients={patients}
              onSuccess={() => setOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
