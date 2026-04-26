"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPatients } from "@/lib/actions/patient-actions";
import { createAttachment, uploadMedicalAttachment } from "@/lib/actions/medical-records-actions";
import { toast } from "sonner";
import { Plus, Upload, Link as LinkIcon } from "lucide-react";

const ACCEPT = "application/pdf,image/jpeg,image/jpg,image/png,image/gif,image/webp,.doc,.docx";

export function AddAttachmentButton({
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined && controlledOnOpenChange != null;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange : setInternalOpen;

  const [patients, setPatients] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [patientId, setPatientId] = useState("");
  const [mode, setMode] = useState<"upload" | "link">("upload");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileType, setFileType] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) getPatients().then(setPatients);
  }, [open]);

  function resetForm() {
    setPatientId("");
    setMode("upload");
    setSelectedFile(null);
    setFileName("");
    setFileUrl("");
    setFileType("");
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!patientId) {
      setError(t("selectPatientError"));
      return;
    }

    if (mode === "upload") {
      if (!selectedFile) {
        setError(t("chooseFileToUpload"));
        return;
      }
      setLoading(true);
      try {
        const formData = new FormData();
        formData.set("file", selectedFile);
        formData.set("patientId", patientId);
        const uploadResult = await uploadMedicalAttachment(formData);
        if (!uploadResult.success) {
          setError(uploadResult.error ?? t("uploadFailed"));
          return;
        }
        const createResult = await createAttachment({
          patientId,
          fileName: uploadResult.fileName,
          fileUrl: uploadResult.url,
          fileType: uploadResult.fileType,
        });
        if (createResult.success) {
          toast.success(t("attachmentUploadedAndLinked"));
          setOpen(false);
          router.refresh();
          resetForm();
        } else {
          setError(createResult.error ?? t("failedToSave"));
        }
      } catch {
        setError(t("networkError"));
      } finally {
        setLoading(false);
        return;
      }
    }

    if (!fileName.trim() || !fileUrl.trim()) {
      setError(t("enterFileNameAndUrl"));
      return;
    }
    setLoading(true);
    try {
      const result = await createAttachment({
        patientId,
        fileName: fileName.trim(),
        fileUrl: fileUrl.trim(),
        fileType: fileType.trim() || undefined,
      });
      if (result.success) {
        toast.success(t("attachmentAdded"));
        setOpen(false);
        router.refresh();
        resetForm();
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
          {t("addAttachment")}
        </Button>
      )}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">{t("addAttachmentTitle")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Patient *</Label>
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

              <div className="flex gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-3">
                <Button
                  type="button"
                  variant={mode === "upload" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => { setMode("upload"); setError(null); setSelectedFile(null); setFileName(""); setFileUrl(""); setFileType(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                >
                  <Upload className="h-3.5 w-3.5" />
                  {t("uploadFile")}
                </Button>
                <Button
                  type="button"
                  variant={mode === "link" ? "secondary" : "ghost"}
                  size="sm"
                  className="gap-1.5"
                  onClick={() => { setMode("link"); setError(null); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                >
                  <LinkIcon className="h-3.5 w-3.5" />
                  Paste link
                </Button>
              </div>

              {mode === "upload" ? (
                <div className="space-y-2">
                  <Label>File *</Label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="flex min-h-[100px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30 px-4 py-6 transition-colors hover:bg-slate-100/80 dark:hover:bg-slate-800/50"
                  >
                    <Upload className="mb-2 h-8 w-8 text-slate-400" />
                    {selectedFile ? (
                      <>
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{selectedFile.name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Click to change (PDF, images, DOC/DOCX, max 10MB)</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-slate-600 dark:text-slate-400">Click to choose file</p>
                        <p className="text-xs text-slate-500 mt-0.5">PDF, JPG, PNG, GIF, WebP, DOC/DOCX — max 10MB</p>
                      </>
                    )}
                  </div>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPT}
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setSelectedFile(f ?? null);
                      setError(null);
                    }}
                  />
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>File name *</Label>
                    <Input placeholder="e.g. lab-results-2024.pdf" value={fileName} onChange={(e) => setFileName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>File URL *</Label>
                    <Input placeholder="https://..." value={fileUrl} onChange={(e) => setFileUrl(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>File type (optional)</Label>
                    <Input placeholder="e.g. application/pdf" value={fileType} onChange={(e) => setFileType(e.target.value)} />
                  </div>
                </>
              )}

              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading}>{loading ? t("saving") : tCommon("save")}</Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
