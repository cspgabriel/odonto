"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { updateVitals } from "@/lib/actions/medical-records-actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { Pencil } from "lucide-react";
import type { VitalsRow } from "./vitals-table";

function formatBP(s: number | null, d: number | null) {
  return s != null && d != null ? `${s}/${d}` : "—";
}

export function VitalsRecordSheet({
  open,
  onOpenChange,
  row,
  mode: initialMode = "view",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  row: VitalsRow | null;
  mode?: "view" | "edit";
}) {
  const router = useRouter();
  const t = useTranslations("medicalRecords");
  const [mode, setMode] = useState<"view" | "edit">(initialMode);
  const [saving, setSaving] = useState(false);
  const [bloodPressureSystolic, setBloodPressureSystolic] = useState("");
  const [bloodPressureDiastolic, setBloodPressureDiastolic] = useState("");
  const [heartRate, setHeartRate] = useState("");
  const [temperature, setTemperature] = useState("");
  const [weight, setWeight] = useState("");
  const [height, setHeight] = useState("");

  useEffect(() => {
    if (row) {
      setMode(initialMode);
      setBloodPressureSystolic(row.bloodPressureSystolic != null ? String(row.bloodPressureSystolic) : "");
      setBloodPressureDiastolic(row.bloodPressureDiastolic != null ? String(row.bloodPressureDiastolic) : "");
      setHeartRate(row.heartRate != null ? String(row.heartRate) : "");
      setTemperature(row.temperature != null ? String(row.temperature) : "");
      setWeight(row.weight ?? "");
      setHeight(row.height ?? "");
    }
  }, [row, initialMode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!row) return;
    setSaving(true);
    try {
      const result = await updateVitals({
        id: row.id,
        bloodPressureSystolic: bloodPressureSystolic ? parseInt(bloodPressureSystolic, 10) : undefined,
        bloodPressureDiastolic: bloodPressureDiastolic ? parseInt(bloodPressureDiastolic, 10) : undefined,
        heartRate: heartRate ? parseInt(heartRate, 10) : undefined,
        temperature: temperature ? parseFloat(temperature) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
      });
      if (result.success) {
        toast.success(t("vitalsUpdated"));
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

  const title = row ? (mode === "edit" ? "Edit Vitals" : "Vitals Record") : "";
  const recordedAt = row?.recordedAt ? format(new Date(row.recordedAt), "PPp") : "—";

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
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => setMode("edit")}
            >
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          )}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {!row ? (
            <p className="text-sm text-muted-foreground">No record selected.</p>
          ) : mode === "view" ? (
            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Patient</dt>
                <dd className="font-semibold text-slate-900 dark:text-white mt-0.5">{row.patientName ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Recorded</dt>
                <dd className="mt-0.5">{recordedAt}</dd>
                {row.recordedByName && (
                  <dd className="text-muted-foreground text-xs mt-0.5">by {row.recordedByName}</dd>
                )}
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Blood pressure</dt>
                <dd className="mt-0.5 tabular-nums">{formatBP(row.bloodPressureSystolic, row.bloodPressureDiastolic)}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Heart rate (bpm)</dt>
                <dd className="mt-0.5 tabular-nums">{row.heartRate != null ? row.heartRate : "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Temp (°C)</dt>
                <dd className="mt-0.5 tabular-nums">{row.temperature != null ? row.temperature : "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Weight (kg)</dt>
                <dd className="mt-0.5 tabular-nums">{row.weight ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">Height (cm)</dt>
                <dd className="mt-0.5 tabular-nums">{row.height ?? "—"}</dd>
              </div>
              <div>
                <dt className="font-semibold text-muted-foreground uppercase tracking-wider text-xs">BMI</dt>
                <dd className="mt-0.5 tabular-nums">{row.bmi ?? "—"}</dd>
              </div>
            </dl>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>BP Systolic</Label>
                  <Input
                    type="number"
                    placeholder="120"
                    value={bloodPressureSystolic}
                    onChange={(e) => setBloodPressureSystolic(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>BP Diastolic</Label>
                  <Input
                    type="number"
                    placeholder="80"
                    value={bloodPressureDiastolic}
                    onChange={(e) => setBloodPressureDiastolic(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Heart rate (bpm)</Label>
                  <Input
                    type="number"
                    placeholder="72"
                    value={heartRate}
                    onChange={(e) => setHeartRate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temp (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="36.6"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="70"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    placeholder="170"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                  />
                </div>
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
