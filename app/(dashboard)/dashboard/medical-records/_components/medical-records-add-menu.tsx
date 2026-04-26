"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Activity, FileText, Stethoscope, Paperclip } from "lucide-react";
import { AddVitalsButton } from "./add-vitals-button";
import { AddClinicalNoteButton } from "./add-clinical-note-button";
import { AddDiagnosisButton } from "./add-diagnosis-button";
import { AddAttachmentButton } from "./add-attachment-button";

export function MedicalRecordsAddMenu({ className }: { className?: string }) {
  const t = useTranslations("medicalRecords");
  const [openVitals, setOpenVitals] = useState(false);
  const [openNote, setOpenNote] = useState(false);
  const [openDiag, setOpenDiag] = useState(false);
  const [openAttach, setOpenAttach] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className={className}>
            <Plus className="h-4 w-4 mr-2" />
            {t("add")}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px] rounded-xl border border-slate-200 dark:border-slate-800">
          <DropdownMenuItem onClick={() => setOpenVitals(true)} className="gap-2 cursor-pointer">
            <Activity className="h-4 w-4" />
            {t("recordVitals")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenNote(true)} className="gap-2 cursor-pointer">
            <FileText className="h-4 w-4" />
            {t("addClinicalNote")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenDiag(true)} className="gap-2 cursor-pointer">
            <Stethoscope className="h-4 w-4" />
            {t("addDiagnosis")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setOpenAttach(true)} className="gap-2 cursor-pointer">
            <Paperclip className="h-4 w-4" />
            {t("addAttachment")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AddVitalsButton open={openVitals} onOpenChange={setOpenVitals} />
      <AddClinicalNoteButton open={openNote} onOpenChange={setOpenNote} />
      <AddDiagnosisButton open={openDiag} onOpenChange={setOpenDiag} />
      <AddAttachmentButton open={openAttach} onOpenChange={setOpenAttach} />
    </>
  );
}
