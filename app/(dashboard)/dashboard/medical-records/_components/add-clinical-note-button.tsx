"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPatients } from "@/lib/actions/patient-actions";
import { createClinicalNote } from "@/lib/actions/medical-records-actions";
import { toast } from "sonner";
import { Plus } from "lucide-react";

export function AddClinicalNoteButton({
  className,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: {
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const t = useTranslations("medicalRecords");
  const tCommon = useTranslations("common");
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange != null;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [patients, setPatients] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) getPatients().then(setPatients);
  }, [open]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!patientId || !content.trim()) {
      setError(t("selectPatientAndNote"));
      return;
    }
    setLoading(true);
    try {
      const result = await createClinicalNote({ patientId, content: content.trim() });
      if (result.success) {
        toast.success(t("clinicalNoteAdded"));
        setOpen(false);
        router.refresh();
        setPatientId("");
        setContent("");
      } else {
        setError(result.error ?? t("failedToSave"));
      }
    } catch {
      setError(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {!isControlled && (
        <Button className={className} onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("addClinicalNote")}
        </Button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">{t("addClinicalNoteTitle")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("patientLabel")}</Label>
                <Select value={patientId} onValueChange={setPatientId} required>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectPatient")} />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.fullName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Note</Label>
                <Textarea placeholder={t("notePlaceholder")} value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="resize-y" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading}>{loading ? t("saving") : tCommon("save")}</Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
