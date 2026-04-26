"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateClinicalNote } from "@/lib/actions/medical-records-actions";
import { formatDoctorName } from "@/lib/utils/staff-display";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil } from "lucide-react";

export type ClinicalNoteRow = {
  id: string;
  patientId: string;
  patientName: string | null;
  content: string;
  authorName: string | null;
  authorSpecialization: string | null;
  createdAt: Date;
  appointmentId: string | null;
};

export function ClinicalNoteSheet({
  open,
  onOpenChange,
  row,
  mode: initialMode = "view",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: ClinicalNoteRow | null;
  mode?: "view" | "edit";
}) {
  const router = useRouter();
  const t = useTranslations("medicalRecords");
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState("");

  useEffect(() => {
    if (row) {
      setMode(initialMode);
      setContent(row.content ?? "");
    }
  }, [row, initialMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!row || !content.trim()) return;
    setSaving(true);
    try {
      const result = await updateClinicalNote({ id: row.id, content: content.trim() });
      if (result.success) {
        toast.success(t("noteUpdated"));
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

  const title = row ? (mode === "edit" ? "Edit Note" : "Clinical Note") : "";
  const createdAt = row?.createdAt ? format(new Date(row.createdAt), "PPp") : "—";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[480px] sm:max-w-[480px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0 flex flex-row items-center justify-between">
          <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {title}
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
            <p className="text-sm text-muted-foreground">No note selected.</p>
          ) : mode === "view" ? (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Patient</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">{row.patientName ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Author</dt>
                <dd className="mt-0.5">{formatDoctorName(row.authorName, row.authorSpecialization)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Date</dt>
                <dd className="mt-0.5">{createdAt}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Content</dt>
                <dd className="mt-0.5 text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{row.content || "—"}</dd>
              </div>
            </dl>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Content</Label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Note content..."
                  className="min-h-[200px] resize-y"
                  required
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setMode("view")} disabled={saving}>
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
