"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateDiagnosis } from "@/lib/actions/medical-records-actions";
import { formatDoctorName } from "@/lib/utils/staff-display";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil } from "lucide-react";

export type DiagnosisRow = {
  id: string;
  patientId: string;
  patientName: string | null;
  title: string;
  icdCode: string | null;
  status: "active" | "resolved";
  diagnosedAt: Date;
  createdAt: Date;
  doctorName: string | null;
  doctorSpecialization: string | null;
};

export function DiagnosisSheet({
  open,
  onOpenChange,
  row,
  mode: initialMode = "view",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: DiagnosisRow | null;
  mode?: "view" | "edit";
}) {
  const router = useRouter();
  const t = useTranslations("medicalRecords");
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [icdCode, setIcdCode] = useState("");
  const [status, setStatus] = useState<"active" | "resolved">("active");
  const [diagnosedAt, setDiagnosedAt] = useState("");

  useEffect(() => {
    if (row) {
      setMode(initialMode);
      setTitle(row.title);
      setIcdCode(row.icdCode ?? "");
      setStatus(row.status);
      setDiagnosedAt(
        row.diagnosedAt
          ? format(new Date(row.diagnosedAt), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd")
      );
    }
  }, [row, initialMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!row || !title.trim()) return;
    setSaving(true);
    try {
      const result = await updateDiagnosis({
        id: row.id,
        title: title.trim(),
        icdCode: icdCode.trim() || undefined,
        status,
        diagnosedAt: diagnosedAt || undefined,
      });
      if (result.success) {
        toast.success(t("diagnosisUpdated"));
        setMode("view");
        router.refresh();
      } else {
        toast.error(result.error ?? "Failed to update.");
      }
    } catch {
      toast.error(t("networkError"));
    } finally {
      setSaving(false);
    }
  }

  const sheetTitle = row ? (mode === "edit" ? "Edit Diagnosis" : "Diagnosis") : "";
  const diagnosedAtFormatted = row?.diagnosedAt
    ? format(new Date(row.diagnosedAt), "PPP")
    : "—";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] sm:max-w-[480px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex flex-row items-center justify-between">
          <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {sheetTitle}
          </SheetTitle>
          {row && mode === "view" && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setMode("edit")}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {!row ? (
            <p className="text-sm text-muted-foreground">No diagnosis selected.</p>
          ) : mode === "view" ? (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                  Patient
                </dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">
                  {row.patientName ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                  Title
                </dt>
                <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{row.title}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                  Doctor
                </dt>
                <dd className="mt-0.5 text-slate-700 dark:text-slate-300">
                  {formatDoctorName(row.doctorName ?? null, row.doctorSpecialization ?? null)}
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                  ICD Code
                </dt>
                <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{row.icdCode ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                  Status
                </dt>
                <dd className="mt-0.5">
                  <span
                    className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                      row.status === "active"
                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {row.status}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">
                  Date
                </dt>
                <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{diagnosedAtFormatted}</dd>
              </div>
            </dl>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="diagnosis-title">Title</Label>
                <Input
                  id="diagnosis-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Essential hypertension"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis-icd">ICD Code (optional)</Label>
                <Input
                  id="diagnosis-icd"
                  value={icdCode}
                  onChange={(e) => setIcdCode(e.target.value)}
                  placeholder="e.g. I10"
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as "active" | "resolved")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="diagnosis-date">Diagnosed date</Label>
                <Input
                  id="diagnosis-date"
                  type="date"
                  value={diagnosedAt}
                  onChange={(e) => setDiagnosedAt(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMode("view")}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
