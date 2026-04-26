"use client";

import React, { useState, useTransition, useRef, useEffect, useMemo } from "react";
import { useTranslations } from "@/lib/i18n";
import { Dialog, DialogPortal, DialogOverlay } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X, Save, Activity, CheckCircle, Clock, XCircle, Activity as ActivityIcon, Edit, Download, Phone, Mail, Building2, User, Eye, Edit3, Image as ImageIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { updateOdontogram } from "@/lib/actions/odontogram-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";
import { DatePicker } from "@/components/ui/date-picker";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

function getInitials(name: string | null) {
  return (name ?? "?").trim().split(/\s+/).map((s) => s[0]).join("").toUpperCase().slice(0, 2);
}

type Condition = 
  | "healthy" | "caries" | "filling" | "crown" | "bridge" 
  | "implant" | "extraction" | "root_canal" | "missing" 
  | "fractured" | "wear" | "restoration_needed" | "sealant" 
  | "veneer" | "temporary_filling" | "periapical_lesion";

const CONDITION_COLORS: Record<Condition, string> = {
  healthy: "text-slate-200 dark:text-slate-700 bg-transparent",
  caries: "text-rose-500 bg-rose-500/80",
  filling: "text-blue-500 bg-blue-500/80",
  missing: "text-transparent stroke-slate-300 dark:stroke-slate-700 stroke-[1px] border-dashed bg-transparent",
  extraction: "text-slate-100 dark:text-slate-900 border-x-red-500 line-through bg-transparent",
  crown: "text-amber-500 bg-amber-500/80",
  bridge: "text-indigo-500 bg-indigo-500/80",
  implant: "text-slate-400 bg-slate-400/80",
  root_canal: "text-rose-700 bg-rose-700/80",
  fractured: "text-orange-500 bg-orange-500/80",
  wear: "text-yellow-600 bg-yellow-600/80",
  restoration_needed: "text-pink-500 bg-pink-500/80",
  sealant: "text-teal-400 bg-teal-400/80",
  veneer: "text-purple-500 bg-purple-500/80",
  temporary_filling: "text-lime-500 bg-lime-500/80",
  periapical_lesion: "text-red-900 bg-red-900/80",
};

const CONDITION_BG: Record<Condition, string> = {
  healthy: "transparent",
  caries: "rgba(244, 63, 94, 0.8)",
  filling: "rgba(59, 130, 246, 0.8)",
  missing: "transparent",
  extraction: "transparent",
  crown: "rgba(245, 158, 11, 0.8)",
  bridge: "rgba(99, 102, 241, 0.8)",
  implant: "rgba(148, 163, 184, 0.8)",
  root_canal: "rgba(190, 18, 60, 0.8)",
  fractured: "rgba(249, 115, 22, 0.8)",
  wear: "rgba(202, 138, 4, 0.8)",
  restoration_needed: "rgba(236, 72, 153, 0.8)",
  sealant: "rgba(45, 212, 191, 0.8)",
  veneer: "rgba(168, 85, 247, 0.8)",
  temporary_filling: "rgba(132, 204, 22, 0.8)",
  periapical_lesion: "rgba(127, 29, 29, 0.8)",
};

/** Tooth images from public folder (run npm run download-teeth once to populate). */
const getToothImageSrc = (num: number) => `/teeth/${num}.png`;

const TOOTH_TYPE_KEYS = ["toothType3rdMolar", "toothType2ndMolar", "toothType1stMolar", "toothType2ndPremolar", "toothType1stPremolar", "toothTypeCanine", "toothTypeLateralIncisor", "toothTypeCentralIncisor"] as const;
const TOOTH_TYPE_KEYS_UL = ["toothTypeCentralIncisor", "toothTypeLateralIncisor", "toothTypeCanine", "toothType1stPremolar", "toothType2ndPremolar", "toothType1stMolar", "toothType2ndMolar", "toothType3rdMolar"] as const;

function getToothNameForNum(num: number, t: (key: string) => string): string {
  if (num >= 1 && num <= 8) return `${t("toothJawUpperRight")} ${t(TOOTH_TYPE_KEYS[num - 1])}`;
  if (num >= 9 && num <= 16) return `${t("toothJawUpperLeft")} ${t(TOOTH_TYPE_KEYS_UL[num - 9])}`;
  if (num >= 17 && num <= 24) return `${t("toothJawLowerLeft")} ${t(TOOTH_TYPE_KEYS[num - 17])}`;
  if (num >= 25 && num <= 32) return `${t("toothJawLowerRight")} ${t(TOOTH_TYPE_KEYS_UL[num - 25])}`;
  return (t as (key: string, values?: Record<string, string | number>) => string)("toothNum", { num });
}

/** Compact status badge — matches table, minimal height. */
function ChartStatusBadge({ status }: { status: string }) {
  const s = status.toUpperCase();
  const styles: Record<string, string> = {
    ACTIVE: "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50",
    COMPLETED: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50",
    PLANNED: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50",
    CANCELLED: "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50",
    ARCHIVED: "bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50",
  };
  const style = styles[s] ?? "bg-slate-50 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400 border-slate-200/50 dark:border-slate-700/50";
  return (
    <span className={`inline-flex items-center justify-center rounded border px-1.5 py-px text-[10px] font-semibold leading-none uppercase tracking-wider whitespace-nowrap shrink-0 ${style}`}>
      {status}
    </span>
  );
}

interface ToothData {
  tooth: number;
  condition: Condition;
  treatment?: string;
  notes?: string;
  /** Per-surface condition (occlusal, mesial, distal, buccal, lingual). Overlays on chart use this when set. */
  surfaces?: Record<string, Condition>;
  /** Tooth mobility 0–3 scale. */
  mobility?: 0 | 1 | 2 | 3;
  /** Periodontal pocket depths (mm) per surface. */
  pocketDepths?: { mesial?: number; distal?: number; buccal?: number; lingual?: number };
  /** Per-tooth treatment plan (procedure, status, priority, cost, duration, date, notes). */
  treatmentPlan?: {
    procedure: string;
    status: string;
    priority: string;
    estimatedCost: number;
    duration: string;
    plannedDate: string;
    notes: string;
  };
  /** When condition was recorded (restorative history). */
  conditionDate?: string;
}

export interface TreatmentPlanItem {
  id: string;
  tooth: number;
  procedure: string;
  status: string;
  priority: string;
  estimatedCost: number;
  estimatedDuration: string;
  plannedDate: string;
  notes: string;
  /** ADA CDT code for billing/claims (e.g. D2391). */
  cdtCode?: string;
  /** When patient accepted this treatment (ISO date string). */
  acceptedAt?: string;
}

const DEFAULT_TREATMENT: Omit<TreatmentPlanItem, "id"> = {
  tooth: 1,
  procedure: "",
  status: "planned",
  priority: "medium",
  estimatedCost: 0,
  estimatedDuration: "",
  plannedDate: "",
  notes: "",
  cdtCode: "",
  acceptedAt: "",
};

const CONDITION_TO_KEY: Record<string, string> = {
  healthy: "conditionHealthy", caries: "conditionCaries", filling: "conditionFilling", crown: "conditionCrown",
  bridge: "conditionBridge", implant: "conditionImplant", extraction: "conditionExtraction", root_canal: "conditionRootCanal",
  missing: "conditionMissing", fractured: "conditionFractured", wear: "conditionWear", restoration_needed: "conditionRestorationNeeded",
  sealant: "conditionSealant", veneer: "conditionVeneer", temporary_filling: "conditionTemporaryFilling", periapical_lesion: "conditionPeriapicalLesion",
};

function ToothImage({ num, state, onClick, selected }: { num: number, state: ToothData, onClick: () => void, selected: boolean }) {
  const t = useTranslations("odontograms");
  const isUpper = num <= 16;
  const isRight = (num >= 1 && num <= 8) || (num >= 25 && num <= 32);

  const surfaces = [
    { nameKey: "surfaceOcclusal" as const, key: "occlusal" as const, top: !isUpper ? "0" : undefined, bottom: isUpper ? "0" : undefined, left: "25%", right: "25%", height: "33.33%" },
    { nameKey: "surfaceMesial" as const, key: "mesial" as const, top: "25%", bottom: "25%", right: isRight ? "0" : undefined, left: !isRight ? "0" : undefined, width: "33.33%" },
    { nameKey: "surfaceDistal" as const, key: "distal" as const, top: "25%", bottom: "25%", left: isRight ? "0" : undefined, right: !isRight ? "0" : undefined, width: "33.33%" },
    { nameKey: "surfaceBuccal" as const, key: "buccal" as const, top: "33.33%", bottom: "33.33%", left: "33.33%", right: "33.33%" },
    { nameKey: "surfaceLingual" as const, key: "lingual" as const, top: isUpper ? "0" : undefined, bottom: !isUpper ? "0" : undefined, left: "25%", right: "25%", height: "33.33%" },
  ];
  const getSurfaceBg = (key: string) => CONDITION_BG[state.surfaces?.[key] ?? state.condition] || "transparent";

  const getToothName = (n: number) => getToothNameForNum(n, t);
  const conditionLabel = CONDITION_TO_KEY[state.condition] ? t(CONDITION_TO_KEY[state.condition]) : state.condition.replace("_", " ");
  const mobilityLabel = state.mobility === 1 ? t("mobilitySlight") : state.mobility === 2 ? t("mobilityModerate") : t("mobilitySevere");

  return (
    <div className="relative group/tooth cursor-pointer flex flex-col items-center" onClick={onClick}>
      <div className={`relative transition-all duration-200 p-0.5 rounded-sm ${selected ? 'ring-2 ring-amber-400 ring-offset-2 bg-slate-50 dark:bg-slate-800' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
        {/* Main Tooth Tooltip */}
        <div className="absolute opacity-0 group-hover/tooth:opacity-100 transition-opacity duration-200 pointer-events-none bottom-full mb-2 left-1/2 -translate-x-1/2 w-max max-w-[220px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl rounded-xl p-3 z-50">
          <p className="font-bold text-sm text-slate-900 dark:text-white">{getToothName(num)}</p>
          <p className="text-sm text-slate-500 mt-0.5">{t("overall")}: <span className="capitalize">{conditionLabel}</span></p>
          {(state.mobility != null && state.mobility > 0) && (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Mobility: {state.mobility} – {mobilityLabel}</p>
          )}
          {state.conditionDate && (() => { try { const d = new Date(state.conditionDate); return !isNaN(d.getTime()); } catch { return false; } })() && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{t("recorded")}: {format(new Date(state.conditionDate!), "MM/dd/yyyy")}</p>
          )}
          <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 font-medium">{t("clickToEditConditions")}</p>
        </div>

        <div className="w-7 h-9 md:w-8 md:h-10 relative z-0">
          <img
            src={getToothImageSrc(num)}
            alt={t("toothNum", { num })}
            decoding="async"
            fetchPriority="low"
            className={`w-full h-full object-contain transition-all duration-200 ${state.condition === "missing" ? "opacity-20" : ""} ${state.condition === "extraction" ? "opacity-30 grayscale" : ""}`}
          />
        </div>
        <div className="w-7 h-9 md:w-8 md:h-10 absolute inset-0 z-10 -ml-0.5 mt-0.5 pointer-events-none">
          {surfaces.map((s) => (
            <div
              key={s.key}
              className="absolute hover:bg-slate-500 hover:bg-opacity-30 transition-colors group/surface pointer-events-auto"
              style={{
                top: s.top, bottom: s.bottom, left: s.left, right: s.right, width: s.width, height: s.height,
                backgroundColor: getSurfaceBg(s.key),
              }}
            >
              {/* Surface Tooltip */}
              <div className="absolute opacity-0 group-hover/surface:opacity-100 transition-opacity duration-200 pointer-events-none top-full mt-1 left-1/2 -translate-x-1/2 w-max bg-slate-700 dark:bg-slate-800 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg z-[60]">
                {t("surfaceSuffix", { name: t(s.nameKey) })}
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Tooth number — below tooth, clear and readable */}
      <span className="mt-1 min-w-[1.25rem] text-center text-sm font-bold tabular-nums text-slate-800 dark:text-slate-200 select-none">
        {num}
      </span>
    </div>
  );
}

export function OdontogramDetailModal({
  odontogram,
  open,
  onOpenChange,
  onEditMain,
}: {
  odontogram: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEditMain?: () => void;
}) {
  const t = useTranslations("odontograms");
  const tCommon = useTranslations("common");
  const [activeTab, setActiveTab] = useState("chart");
  const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(true);
  const [exportIncludeChart, setExportIncludeChart] = useState(true);
  const [exportIncludeTreatments, setExportIncludeTreatments] = useState(true);
  const [exportIncludePeriodontal, setExportIncludePeriodontal] = useState(true);
  const [exportIncludeNotes, setExportIncludeNotes] = useState(true);
  const [exportChartQuality, setExportChartQuality] = useState<"1" | "2">("2");
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Local state for optimistic updates
  const [localToothData, setLocalToothData] = useState<ToothData[]>(() => {
    return Array.isArray(odontogram?.toothData) ? odontogram.toothData : [];
  });
  const [localTreatments, setLocalTreatments] = useState<TreatmentPlanItem[]>(() => {
    const t = odontogram?.treatments;
    if (!Array.isArray(t)) return [];
    return t.map((x: any) => ({
      id: x.id ?? `t-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      tooth: Number(x.tooth) || 1,
      procedure: String(x.procedure ?? ""),
      status: String(x.status ?? "planned"),
      priority: String(x.priority ?? "medium"),
      estimatedCost: Number(x.estimatedCost) ?? 0,
      estimatedDuration: String(x.estimatedDuration ?? ""),
      plannedDate: String(x.plannedDate ?? ""),
      notes: String(x.notes ?? ""),
    }));
  });
  const [showAddTreatmentModal, setShowAddTreatmentModal] = useState(false);
  const [editingTreatmentId, setEditingTreatmentId] = useState<string | null>(null);
  const [treatmentForm, setTreatmentForm] = useState<Omit<TreatmentPlanItem, "id">>({ ...DEFAULT_TREATMENT });
  const [periodontalEditMode, setPeriodontalEditMode] = useState(false);
  const [periodontal, setPeriodontal] = useState({
    bleedingOnProbing: false,
    calculusPresent: false,
    plaqueIndex: 0,
    gingivalIndex: 0,
    notes: "",
  });
  const [isPending, startTransition] = useTransition();
  const [isExiting, setIsExiting] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  /** General (clinical) notes: list of items, separate from periodontal notes. */
  const [generalNotesList, setGeneralNotesList] = useState<Array<{ id: string; content: string }>>([]);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");

  // Reset exiting when modal is closed from outside
  useEffect(() => {
    if (!open) setIsExiting(false);
  }, [open]);

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setIsExiting(true);
      return;
    }
    onOpenChange(next);
  };

  const handleExitTransitionEnd = (e: React.TransitionEvent) => {
    if (!isExiting || e.target !== contentRef.current || e.propertyName !== "transform") return;
    onOpenChange(false);
    setIsExiting(false);
  };

  // Parse notes: periodontal (p) and general/clinical notes (clinical or clinicalNotes array)
  useEffect(() => {
    const raw = odontogram?.notes;
    if (!raw || typeof raw !== "string") {
      setGeneralNotesList([]);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as {
        p?: { b?: boolean; c?: boolean; pi?: number; gi?: number; n?: string };
        clinical?: string;
        clinicalNotes?: Array<{ id: string; content: string }>;
      };
      if (parsed?.p) {
        setPeriodontal({
          bleedingOnProbing: !!parsed.p.b,
          calculusPresent: !!parsed.p.c,
          plaqueIndex: Math.min(3, Math.max(0, Number(parsed.p.pi) || 0)),
          gingivalIndex: Math.min(3, Math.max(0, Number(parsed.p.gi) || 0)),
          notes: String(parsed.p.n ?? ""),
        });
      }
      if (Array.isArray(parsed?.clinicalNotes) && parsed.clinicalNotes.length > 0) {
        setGeneralNotesList(parsed.clinicalNotes.filter((n) => n && typeof n.id === "string" && typeof n.content === "string"));
      } else if (typeof parsed?.clinical === "string" && parsed.clinical.trim()) {
        setGeneralNotesList([{ id: `legacy-${Date.now()}`, content: parsed.clinical.trim() }]);
      } else {
        setGeneralNotesList([]);
      }
    } catch {
      setGeneralNotesList([]);
      setPeriodontal((prev) => ({ ...prev, notes: "" }));
    }
  }, [odontogram?.id, odontogram?.notes]);

  useEffect(() => {
    const t = odontogram?.treatments;
    if (!Array.isArray(t)) {
      setLocalTreatments([]);
      return;
    }
    setLocalTreatments(
      t.map((x: any) => ({
        id: x.id ?? `t-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        tooth: Number(x.tooth) || 1,
        procedure: String(x.procedure ?? ""),
        status: String(x.status ?? "planned"),
        priority: String(x.priority ?? "medium"),
        estimatedCost: Number(x.estimatedCost) ?? 0,
        estimatedDuration: String(x.estimatedDuration ?? ""),
        plannedDate: String(x.plannedDate ?? ""),
        notes: String(x.notes ?? ""),
        cdtCode: x.cdtCode != null ? String(x.cdtCode) : undefined,
        acceptedAt: x.acceptedAt != null ? String(x.acceptedAt) : undefined,
      }))
    );
  }, [odontogram?.id, odontogram?.treatments]);

  // Treatment progress: Overall Progress = completed / activeTotal * 100
  // Active = planned + in_progress + completed (cancelled excluded so they don't dilute the %)
  const treatmentStats = useMemo(() => {
    const total = localTreatments.length;
    const completed = localTreatments.filter((t) => t.status === "completed").length;
    const inProgress = localTreatments.filter((t) => t.status === "in_progress").length;
    const planned = localTreatments.filter((t) => t.status === "planned").length;
    const cancelled = localTreatments.filter((t) => t.status === "cancelled").length;
    const activeTotal = total - cancelled; // exclude cancelled from progress denominator
    const progressPct = activeTotal === 0 ? 0 : Math.round((completed / activeTotal) * 100);
    const totalCost = localTreatments.reduce((sum, t) => sum + (Number(t.estimatedCost) || 0), 0);
    return { total, completed, inProgress, planned, cancelled, progressPct, totalCost };
  }, [localTreatments]);

  if (!odontogram) return null;

  function openAddTreatment(editItem?: TreatmentPlanItem) {
    if (editItem) {
      setEditingTreatmentId(editItem.id);
      setTreatmentForm({
        tooth: editItem.tooth,
        procedure: editItem.procedure,
        status: editItem.status,
        priority: editItem.priority,
        estimatedCost: editItem.estimatedCost,
        estimatedDuration: editItem.estimatedDuration,
        plannedDate: editItem.plannedDate,
        notes: editItem.notes,
        cdtCode: editItem.cdtCode ?? "",
        acceptedAt: editItem.acceptedAt ?? "",
      });
    } else {
      setEditingTreatmentId(null);
      setTreatmentForm({
        ...DEFAULT_TREATMENT,
        tooth: selectedTooth ?? DEFAULT_TREATMENT.tooth,
      });
    }
    setShowAddTreatmentModal(true);
  }

  function closeAddTreatmentModal() {
    setShowAddTreatmentModal(false);
    setEditingTreatmentId(null);
    setTreatmentForm({ ...DEFAULT_TREATMENT });
  }

  function handleSaveTreatment() {
    const procedure = treatmentForm.procedure.trim();
    if (!procedure) {
      toast.error(t("treatmentProcedureRequired"));
      return;
    }
    const planned = treatmentForm.plannedDate
      ? (treatmentForm.plannedDate.includes("/")
          ? (() => {
              const [d, m, y] = treatmentForm.plannedDate.split("/");
              return y && m && d ? `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}` : treatmentForm.plannedDate;
            })()
          : treatmentForm.plannedDate)
      : "";
    const item: TreatmentPlanItem = {
      id: editingTreatmentId ?? `t-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      ...treatmentForm,
      procedure,
      plannedDate: planned,
      cdtCode: treatmentForm.cdtCode?.trim() || undefined,
      acceptedAt: treatmentForm.acceptedAt?.trim() || undefined,
    };
    const next = editingTreatmentId
      ? localTreatments.map((t) => (t.id === editingTreatmentId ? item : t))
      : [...localTreatments, item];
    setLocalTreatments(next);
    closeAddTreatmentModal();
    startTransition(async () => {
      try {
        await updateOdontogram(odontogram.id, { treatments: next });
        toast.success(editingTreatmentId ? t("treatmentUpdated") : t("treatmentAdded"));
      } catch (err) {
        toast.error(t("failedToSaveTreatment"));
      }
    });
  }

  function handleDeleteTreatment(id: string) {
    const next = localTreatments.filter((t) => t.id !== id);
    setLocalTreatments(next);
    startTransition(async () => {
      try {
        await updateOdontogram(odontogram.id, { treatments: next });
        toast.success(t("treatmentRemoved"));
      } catch (err) {
        toast.error(t("failedToRemoveTreatment"));
      }
    });
  }

  function buildNotesPayload(overrides: { p?: typeof periodontal; clinicalNotes?: Array<{ id: string; content: string }> } = {}) {
    const p = overrides.p ?? periodontal;
    const list = overrides.clinicalNotes ?? generalNotesList;
    const clinical = list.map((n) => n.content.trim()).filter(Boolean).join("\n\n");
    return JSON.stringify({
      p: {
        b: p.bleedingOnProbing,
        c: p.calculusPresent,
        pi: p.plaqueIndex,
        gi: p.gingivalIndex,
        n: p.notes,
      },
      clinical,
      clinicalNotes: list,
    });
  }

  function handleSavePeriodontal() {
    const payload = buildNotesPayload();
    startTransition(async () => {
      try {
        await updateOdontogram(odontogram.id, { notes: payload });
        setPeriodontalEditMode(false);
        toast.success(t("assessmentSaved"));
      } catch (err) {
        toast.error(t("failedToSaveAssessment"));
      }
    });
  }

  function handleAddNote() {
    const content = newNoteContent.trim();
    if (!content) return;
    const nextList = [...generalNotesList, { id: `gn-${Date.now()}-${Math.random().toString(36).slice(2)}`, content }];
    setGeneralNotesList(nextList);
    setNewNoteContent("");
    setIsAddingNote(false);
    persistGeneralNotes(nextList);
  }

  function handleEditNoteStart(id: string) {
    const note = generalNotesList.find((n) => n.id === id);
    if (note) {
      setEditingNoteId(id);
      setEditingNoteContent(note.content);
    }
  }

  function handleEditNoteSave() {
    if (editingNoteId == null) return;
    const content = editingNoteContent.trim();
    if (!content) return;
    const nextList = generalNotesList.map((n) => (n.id === editingNoteId ? { ...n, content } : n));
    setGeneralNotesList(nextList);
    setEditingNoteId(null);
    setEditingNoteContent("");
    persistGeneralNotes(nextList);
  }

  function handleDeleteNote(id: string) {
    const nextList = generalNotesList.filter((n) => n.id !== id);
    setGeneralNotesList(nextList);
    if (editingNoteId === id) {
      setEditingNoteId(null);
      setEditingNoteContent("");
    }
    persistGeneralNotes(nextList);
  }

  function persistGeneralNotes(list: Array<{ id: string; content: string }>) {
    const payload = buildNotesPayload({ clinicalNotes: list });
    startTransition(async () => {
      try {
        await updateOdontogram(odontogram.id, { notes: payload });
        toast.success(t("notesSaved"));
      } catch (err) {
        toast.error(t("failedToSaveNotes"));
      }
    });
  }

  // Render Top Teeth (1-16)
  const topTeeth = Array.from({ length: 16 }, (_, i) => i + 1);
  // Render Bottom Teeth (32 down to 17)
  const bottomTeeth = Array.from({ length: 16 }, (_, i) => 32 - i);

  function getToothState(num: number): ToothData {
    // Some basic migration logic if decay was used before
    let data = localToothData.find((t) => t.tooth === num) || { tooth: num, condition: "healthy" };
    if ((data.condition as any) === "decay") data = { ...data, condition: "caries" };
    if ((data.condition as any) === "extracted") data = { ...data, condition: "extraction" };
    return data;
  }

  function handleToothClick(num: number) {
    setSelectedTooth(num);
  }

  function handleSaveTooth(toothUpdate: ToothData) {
    // Optimistic Update
    const nextData = [...localToothData.filter((t) => t.tooth !== toothUpdate.tooth), toothUpdate];
    setLocalToothData(nextData);
    setSelectedTooth(null);

    // Background Save
    startTransition(async () => {
      try {
        await updateOdontogram(odontogram.id, { toothData: nextData });
        toast.success(t("toothUpdated", { num: toothUpdate.tooth }));
      } catch (err) {
        toast.error(t("failedToUpdateTooth"));
      }
    });
  }

  async function handleExportPdf() {
    if (!odontogram) return;
    setIsExportingPdf(true);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = doc.internal.pageSize.getWidth();
      const margin = 14;
      let y = 20;

      // Title
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(t("dentalChartReport"), margin, y);
      y += 12;

      // Patient info
      doc.setFontSize(11);
      doc.setFont("helvetica", "normal");
      doc.text(`${t("patient")}: ${odontogram.patientName ?? "—"}`, margin, y);
      y += 6;
      doc.text(t("ageNa"), margin, y);
      y += 6;
      doc.text(`${t("examinationDate")} ${format(new Date(odontogram.examinedAt), "MM/dd/yyyy")}`, margin, y);
      y += 6;
      doc.text(`${t("doctorLabel")}: ${t("doctorPrefix")} ${odontogram.doctorName ?? "—"}`, margin, y);
      y += 6;
      doc.text(t("numberingSystemUniversal"), margin, y);
      y += 14;

      // Chart image
      if (exportIncludeChart && chartContainerRef.current) {
        try {
          const scale = exportChartQuality === "2" ? 2 : 1;
          const canvas = await html2canvas(chartContainerRef.current, {
            scale,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
          });
          const imgData = canvas.toDataURL("image/png");
          const imgW = pageW - margin * 2;
          const imgH = (canvas.height * imgW) / canvas.width;
          if (y + imgH > 270) doc.addPage();
          doc.addImage(imgData, "PNG", margin, y, imgW, Math.min(imgH, 260));
          y += Math.min(imgH, 260) + 10;
        } catch (chartErr) {
          doc.setFontSize(10);
          doc.setTextColor(180, 0, 0);
          doc.text(t("chartImageFailed"), margin, y);
          y += 8;
          doc.setTextColor(0, 0, 0);
        }
      }

      // Condition legend (text list)
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.text(t("conditionLegend"), margin, y);
      y += 6;
      doc.setFont("helvetica", "normal");
      const conditions = Object.keys(CONDITION_COLORS).map((k) => (CONDITION_TO_KEY[k] ? t(CONDITION_TO_KEY[k]) : k.replace("_", " ")));
      doc.text(conditions.join(", "), margin, y);
      y += 8;
      const toothDataExport = Array.isArray(odontogram.toothData) ? odontogram.toothData : [];
      const teethWithMobility = toothDataExport.filter((t: any) => t.mobility > 0);
      if (teethWithMobility.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.text(t("toothMobilityRecorded"), margin, y);
        y += 5;
        doc.setFont("helvetica", "normal");
        doc.text(teethWithMobility.map((item: any) => `${t("toothNum", { num: item.tooth })}: ${item.mobility} (${item.mobility === 1 ? t("mobilitySlight") : item.mobility === 2 ? t("mobilityModerate") : t("mobilitySevere")})`).join("; "), margin, y);
        y += 8;
      }
      y += 4;

      if (exportIncludeTreatments) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(t("treatmentSummary"), margin, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        const treatments = Array.isArray(odontogram.treatments) ? odontogram.treatments : [];
        doc.text(`${t("total")}: ${treatments.length}`, margin, y);
        y += 6;
        const acceptedCount = treatments.filter((tr: any) => tr.acceptedAt).length;
        if (acceptedCount > 0) { doc.text(`${t("acceptedByPatient")} ${acceptedCount}`, margin, y); y += 6; }
        treatments.forEach((tr: any) => {
          if (y > 260) { doc.addPage(); y = 20; }
          const proc = tr.procedure || "—";
          const cdt = tr.cdtCode ? ` [${tr.cdtCode}]` : "";
          const acc = tr.acceptedAt ? ` · ${t("accepted")} ${format(new Date(tr.acceptedAt), "MM/dd/yyyy")}` : "";
          doc.text(`${t("toothNum", { num: tr.tooth })}: ${proc}${cdt}${acc}`, margin, y);
          y += 5;
        });
        y += 6;
      }

      if (exportIncludePeriodontal) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(t("periodontalAssessment"), margin, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.text(`${t("bleedingOnProbing")}: ${periodontal.bleedingOnProbing ? tCommon("yes") : tCommon("no")}`, margin, y);
        y += 6;
        doc.text(`${t("calculusPresent")}: ${periodontal.calculusPresent ? tCommon("yes") : tCommon("no")}`, margin, y);
        y += 6;
        doc.text(`${t("plaqueIndex")}: ${periodontal.plaqueIndex}/3 | ${t("gingivalIndex")}: ${periodontal.gingivalIndex}/3`, margin, y);
        y += 8;
        if (periodontal.notes) {
          const lines = doc.splitTextToSize(periodontal.notes, pageW - margin * 2);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 4;
        }
        y += 4;
      }

      let clinicalNotes = odontogram.notes || "";
      try {
        const j = JSON.parse(odontogram.notes || "{}") as { clinical?: string };
        if (typeof j.clinical === "string") clinicalNotes = j.clinical;
      } catch {
        clinicalNotes = odontogram.notes || "";
      }
      if (exportIncludeNotes && (odontogram.diagnosis || clinicalNotes)) {
        if (y > 250) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(12);
        doc.text(t("generalNotes"), margin, y);
        y += 8;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        if (odontogram.diagnosis) {
          const lines = doc.splitTextToSize(odontogram.diagnosis, pageW - margin * 2);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 4;
        }
        if (clinicalNotes) {
          const lines = doc.splitTextToSize(clinicalNotes, pageW - margin * 2);
          doc.text(lines, margin, y);
          y += lines.length * 5 + 4;
        }
      }

      const safeName = (odontogram.patientName ?? "Patient").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_.-]/g, "");
      const dateStr = format(new Date(), "yyyy-MM-dd");
      doc.save(`dental-chart-${safeName}-${dateStr}.pdf`);
      toast.success(t("pdfDownloaded"));
      setShowExportModal(false);
    } catch (err) {
      toast.error(t("failedToGeneratePdf"));
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogPortal>
          <DialogOverlay
            className={cn(
              "fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-500 ease-in-out",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:duration-500",
              isExiting && "opacity-0"
            )}
          />
          <DialogPrimitive.Content
            ref={contentRef}
            onTransitionEnd={handleExitTransitionEnd}
            className={cn(
              "fixed inset-x-0 mx-auto bottom-0 z-50 w-full sm:w-[calc(100%-2rem)] max-w-[1240px] max-h-[96vh] h-full sm:h-[97vh] p-0 flex flex-col rounded-t-[2rem] border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E] overflow-hidden shadow-2xl outline-none transition-transform duration-500 ease-in-out",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom data-[state=open]:duration-500",
              isExiting && "translate-y-full"
            )}
          >
            {/* Top Right Action Buttons */}
            <div className="absolute top-4 right-4 sm:top-5 sm:right-6 z-[60] flex items-center gap-2">
              <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm border-slate-200 dark:border-slate-800" onClick={() => { setActiveTab("chart"); setShowExportModal(true); }}>
                <Download className="h-4 w-4" />
              </Button>
              <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm border-slate-200 dark:border-slate-800" onClick={() => setIsEditMode(!isEditMode)}>
                {isEditMode ? <Eye className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
              </Button>
              <DialogPrimitive.Close className="h-8 w-8 inline-flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors shadow-sm">
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            {/* Scrollable Modal Content — scrollbar hidden to save space, scroll still works */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col bg-slate-50/30 dark:bg-[#0B0B1E] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              
              {/* Header — compact badges, aligned */}
              <div className="flex flex-col md:flex-row md:items-start justify-between px-4 sm:px-6 py-4 sm:py-5 shrink-0 bg-white dark:bg-[#0B0B1E] gap-3 md:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
                    <DialogPrimitive.Title className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-white leading-tight truncate">
                      {t("detailModalTitle", { name: odontogram.patientName ?? "" })}
                    </DialogPrimitive.Title>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ChartStatusBadge status={(odontogram as any).status || "ACTIVE"} />
                      <span className="inline-flex items-center justify-center rounded border border-slate-200/60 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 px-1.5 py-px text-[10px] font-semibold leading-none shrink-0">
                        v{odontogram.version || 1}
                      </span>
                    </div>
                  </div>
                  <div className="flex sm:hidden items-center gap-1.5 mt-2">
                    <ChartStatusBadge status={(odontogram as any).status || "ACTIVE"} />
                    <span className="inline-flex items-center justify-center rounded border border-slate-200/60 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 px-1.5 py-px text-[10px] font-semibold leading-none">
                      v{odontogram.version || 1}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span>{t("ageNa")}</span><span className="text-slate-300 dark:text-slate-600">•</span><span>{t("examined")}: {format(new Date(odontogram.examinedAt), "MM/dd/yyyy")}</span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="inline-flex items-center gap-1"><Phone className="h-3.5 w-3.5 shrink-0" /> 453-979-8216 x9</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span className="inline-flex items-center gap-1 min-w-0 truncate"><Mail className="h-3.5 w-3.5 shrink-0" /> {odontogram.patientName?.toLowerCase?.()?.replace?.(/\s+/g, "_") ?? ""}@gmail.com</span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5 shrink-0" /> Coastal Medical Los Angeles Medical Center</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    <span>{t("examined")}: {format(new Date(odontogram.examinedAt), "MM/dd/yyyy")}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-3">
                    <span className="inline-flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-px text-[10px] font-semibold leading-none">
                      {t("universalSystem")}
                    </span>
                    <span className="inline-flex items-center justify-center rounded border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-px text-[10px] font-semibold leading-none">
                      {t("adultPatient")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div className="px-4 sm:px-6 flex w-full border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
                <div className="flex w-full overflow-x-auto gap-6 sm:gap-8 justify-start">
                  {(["chart", "treatments", "periodontal", "notes"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2.5 sm:py-3 text-[12px] sm:text-[13px] font-semibold transition-all border-b-2 whitespace-nowrap -mb-px ${
                        activeTab === tab 
                          ? "border-primary text-primary" 
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                      }`}
                    >
                      {tab === "chart" ? t("tabChart") : tab === "treatments" ? t("tabTreatments") : tab === "periodontal" ? t("tabPeriodontal") : t("tabGeneralNotes")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Tab */}
              {activeTab === "chart" && (
                <div className="p-4 md:p-6 outline-none flex flex-col gap-4 md:gap-6 w-full shrink-0">
                  
                  {/* Chart Area — ref used for PDF export */}
                  <div ref={chartContainerRef} className="w-full bg-white dark:bg-[#0B0B1E] rounded-xl md:rounded-2xl p-4 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                      <div>
                        <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{t("dentalChart")}</h2>
                        <p className="text-xs md:text-sm text-slate-500 mt-0.5">{t("permanentTeethUniversal")}</p>
                      </div>
                      <span className="inline-flex items-center justify-center rounded border border-slate-200/60 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-px text-[10px] font-semibold leading-none w-fit">
                        {t("interactiveMode")}
                      </span>
                    </div>

                    <div className="flex flex-col items-center gap-8 w-full overflow-x-auto pb-4">
                      {/* Upper Jaw */}
                      <div className="space-y-4 w-max">
                        <h3 className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 text-center uppercase tracking-widest">{t("upperJaw")}</h3>
                        <div className="flex justify-center space-x-3 md:space-x-8">
                          <div className="flex space-x-1">
                            {topTeeth.slice(0, 8).map((num) => (
                              <ToothImage key={num} num={num} state={getToothState(num)} onClick={() => handleToothClick(num)} selected={selectedTooth === num} />
                            ))}
                          </div>
                          <div className="w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                          <div className="flex space-x-1">
                            {topTeeth.slice(8, 16).map((num) => (
                              <ToothImage key={num} num={num} state={getToothState(num)} onClick={() => handleToothClick(num)} selected={selectedTooth === num} />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-slate-200 dark:bg-slate-700 w-full shrink-0 max-w-2xl my-2" />
                      
                      {/* Lower Jaw */}
                      <div className="space-y-4 w-max">
                        <div className="flex justify-center space-x-3 md:space-x-8">
                          <div className="flex space-x-1">
                            {bottomTeeth.slice(0, 8).reverse().map((num) => (
                              <ToothImage key={num} num={num} state={getToothState(num)} onClick={() => handleToothClick(num)} selected={selectedTooth === num} />
                            ))}
                          </div>
                          <div className="w-px bg-slate-200 dark:bg-slate-700 flex-shrink-0" />
                          <div className="flex space-x-1">
                            {bottomTeeth.slice(8, 16).reverse().map((num) => (
                              <ToothImage key={num} num={num} state={getToothState(num)} onClick={() => handleToothClick(num)} selected={selectedTooth === num} />
                            ))}
                          </div>
                        </div>
                        <h3 className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 text-center uppercase tracking-widest">{t("lowerJaw")}</h3>
                      </div>
                    </div>

                    {/* Condition Legend — bottom of chart, 2-row grid */}
                    <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 w-full">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">{t("conditionLegend")}</h4>
                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-x-4 gap-y-2">
                        {Object.entries(CONDITION_COLORS).map(([key]) => {
                          const bgColors: Record<string, string> = {
                            healthy: "bg-green-500", caries: "bg-red-500", filling: "bg-blue-500",
                            crown: "bg-amber-500", bridge: "bg-indigo-500", implant: "bg-slate-500",
                            extraction: "bg-slate-400", root_canal: "bg-rose-700", missing: "bg-transparent border border-slate-400 border-dashed",
                            fractured: "bg-orange-500", wear: "bg-yellow-600", restoration_needed: "bg-pink-500",
                            sealant: "bg-teal-400", veneer: "bg-purple-500", temporary_filling: "bg-lime-500", periapical_lesion: "bg-red-900"
                          };
                          const boxClass = bgColors[key] ?? "bg-slate-300";
                          return (
                            <div key={key} className="flex items-center gap-2">
                              <span className={`w-3 h-3 rounded-sm shrink-0 ${boxClass}`} />
                              <span className="text-xs text-slate-700 dark:text-slate-300 capitalize">{CONDITION_TO_KEY[key] ? t(CONDITION_TO_KEY[key]) : key.replace("_", " ")}</span>
                            </div>
                          );
                        })}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">{t("version")} {odontogram.version}</p>
                    </div>
                  </div>

                  {/* Lower Row — Treatment Progress & Doctor */}
                  <div className="w-full shrink-0 bg-white dark:bg-[#0B0B1E] rounded-xl md:rounded-2xl p-4 md:p-5 border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 lg:grid-cols-[1fr_auto_260px] gap-5 md:gap-6 items-start">
                    
                    {/* Treatment Progress — same progress % as table (completed / total * 100) */}
                    <div className="w-full min-w-0">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                        <ActivityIcon className="h-3.5 w-3.5 text-slate-500" /> {t("treatmentProgress")}
                      </h3>
                      
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400">{t("overallProgress")}</span>
                            <span className="text-xs font-bold text-primary">{treatmentStats.progressPct}%</span>
                          </div>
                          <Progress value={treatmentStats.progressPct} className="h-1.5 bg-slate-100 dark:bg-slate-800" />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                          <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-2">
                            <p className="text-[10px] text-slate-500 mb-0.5">{t("totalPlanned")}</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{treatmentStats.total}</p>
                          </div>
                          <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-2">
                            <p className="text-[10px] text-slate-500 mb-0.5">{t("completed")}</p>
                            <p className="text-sm font-bold text-slate-900 dark:text-white">{treatmentStats.completed}</p>
                          </div>
                          <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-2">
                            <p className="text-[10px] text-slate-500 mb-0.5">{t("inProgress")}</p>
                            <p className="text-sm font-bold text-amber-600 dark:text-amber-400">{treatmentStats.inProgress}</p>
                          </div>
                          <div className="rounded-lg border border-slate-100 dark:border-slate-800 p-2">
                            <p className="text-[10px] text-slate-500 mb-0.5">{t("pending")}</p>
                            <p className="text-sm font-bold text-blue-600 dark:text-blue-400">{treatmentStats.planned}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                          <span className="text-[11px] text-slate-500">{t("estimatedCost")}</span>
                          <span className="text-sm font-bold text-slate-900 dark:text-white">
                            {treatmentStats.totalCost > 0 ? `$${treatmentStats.totalCost.toLocaleString()}` : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vertical Divider */}
                    <div className="hidden lg:block w-px h-full min-h-[120px] bg-slate-100 dark:bg-slate-800 self-stretch" />
                    <div className="block lg:hidden h-px w-full bg-slate-100 dark:bg-slate-800" />

                    {/* Doctor Info */}
                    <div className="w-full lg:w-[260px]">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                        <User className="h-3.5 w-3.5 text-slate-500" /> {t("doctorInformation")}
                      </h3>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t("doctorPrefix")} {odontogram.doctorName || "—"}</p>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3 shrink-0" /> {t("examined")}: {format(new Date(odontogram.examinedAt), "MM/dd/yyyy")}
                          </p>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>
              )}


              {/* Treatments Tab */}
              {activeTab === "treatments" && (
                <div className="p-4 md:p-6 m-0 outline-none shrink-0">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{t("treatmentPlans")}</h3>
                    {isEditMode && (
                      <Button variant="outline" size="sm" className="h-8 gap-2 font-semibold text-sm" onClick={() => openAddTreatment()}>
                        <PlusIcon className="h-4 w-4" /> {t("addTreatment")}
                      </Button>
                    )}
                  </div>
                  {localTreatments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 border border-slate-200 dark:border-slate-800 border-dashed rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                      <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">{t("noTreatmentPlansFound")}</p>
                    </div>
                  ) : (
                    <ul className="space-y-3">
                      {localTreatments.map((tr) => (
                        <li
                          key={tr.id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]"
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white">
                              Tooth #{tr.tooth} – {tr.procedure || "—"}
                              {tr.cdtCode && <span className="text-slate-500 font-normal ml-1">({tr.cdtCode})</span>}
                            </p>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {tr.status.replace("_", " ")} · {tr.priority} · Cost: {tr.estimatedCost} · {tr.plannedDate ? (() => { try { return format(new Date(tr.plannedDate), "dd/MM/yyyy"); } catch { return tr.plannedDate; } })() : t("noDate")}
                              {tr.acceptedAt && (
                                <span className="inline-flex items-center gap-1 ml-1 text-emerald-600 dark:text-emerald-400">
                                  · {t("accepted")} {(() => { try { return format(new Date(tr.acceptedAt!), "MM/dd/yyyy"); } catch { return tr.acceptedAt; } })()}
                                </span>
                              )}
                            </p>
                          </div>
                          {isEditMode && (
                            <div className="flex gap-2 shrink-0">
                              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => openAddTreatment(tr)}>{tCommon("edit")}</Button>
                              <Button variant="outline" size="sm" className="h-8 text-xs text-red-600 hover:text-red-700" onClick={() => handleDeleteTreatment(tr.id)}>{tCommon("delete")}</Button>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* Periodontal Tab */}
              {activeTab === "periodontal" && (
                <div className="p-4 md:p-6 m-0 outline-none shrink-0">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{t("periodontalAssessment")}</h3>
                    {!periodontalEditMode && isEditMode && (
                      <Button variant="outline" size="sm" className="h-8 gap-2 font-semibold text-sm" onClick={() => setPeriodontalEditMode(true)}>
                        <Edit className="h-3.5 w-3.5" /> {tCommon("edit")}
                      </Button>
                    )}
                    {periodontalEditMode && (
                      <Button variant="outline" size="sm" className="h-8 gap-2 font-semibold text-sm text-red-600 hover:text-red-700 border-red-200 dark:border-red-900" onClick={() => setPeriodontalEditMode(false)}>
                        <X className="h-3.5 w-3.5" /> {tCommon("cancel")}
                      </Button>
                    )}
                  </div>

                  {!periodontalEditMode ? (
                    /* View mode — badges and values */
                    <div className="bg-white dark:bg-[#0B0B1E] border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{t("bleedingOnProbing")}</span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {periodontal.bleedingOnProbing ? tCommon("yes") : tCommon("no")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{t("calculusPresent")}</span>
                          <span className="inline-flex items-center rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {periodontal.calculusPresent ? tCommon("yes") : tCommon("no")}
                          </span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{t("plaqueIndex")}</span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{periodontal.plaqueIndex}/3</span>
                        </div>
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                          <span className="text-sm text-slate-600 dark:text-slate-400">{t("gingivalIndex")}</span>
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{periodontal.gingivalIndex}/3</span>
                        </div>
                      </div>
                      {periodontal.notes && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t("periodontalNotes")}</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{periodontal.notes}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Edit mode — toggles, sliders, notes, Save/Cancel */
                    <div className="bg-white dark:bg-[#0B0B1E] border border-slate-200 dark:border-slate-800 rounded-xl p-5 md:p-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="space-y-5">
                          <div className="flex items-center justify-between gap-4">
                            <Label className="text-sm text-slate-700 dark:text-slate-300">{t("bleedingOnProbing")}</Label>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={periodontal.bleedingOnProbing}
                                onCheckedChange={(v) => setPeriodontal((p) => ({ ...p, bleedingOnProbing: !!v }))}
                              />
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-6">
                                {periodontal.bleedingOnProbing ? tCommon("yes") : tCommon("no")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between gap-4">
                            <Label className="text-sm text-slate-700 dark:text-slate-300">{t("calculusPresent")}</Label>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={periodontal.calculusPresent}
                                onCheckedChange={(v) => setPeriodontal((p) => ({ ...p, calculusPresent: !!v }))}
                              />
                              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 w-6">
                                {periodontal.calculusPresent ? tCommon("yes") : tCommon("no")}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-5">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm text-slate-700 dark:text-slate-300">{t("plaqueIndex")}</Label>
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{periodontal.plaqueIndex}/3</span>
                            </div>
                            <div className="relative h-5 flex items-center">
                              <div className="absolute w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                              <div
                                className="absolute h-2 rounded-l-full bg-primary left-0"
                                style={{ width: `${(periodontal.plaqueIndex / 3) * 100}%` }}
                              />
                              <input
                                type="range"
                                min={0}
                                max={3}
                                step={1}
                                value={periodontal.plaqueIndex}
                                onChange={(e) => setPeriodontal((p) => ({ ...p, plaqueIndex: parseInt(e.target.value, 10) }))}
                                className="relative z-10 w-full h-2 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                              />
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm text-slate-700 dark:text-slate-300">{t("gingivalIndex")}</Label>
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{periodontal.gingivalIndex}/3</span>
                            </div>
                            <div className="relative h-5 flex items-center">
                              <div className="absolute w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700" />
                              <div
                                className="absolute h-2 rounded-l-full bg-primary left-0"
                                style={{ width: `${(periodontal.gingivalIndex / 3) * 100}%` }}
                              />
                              <input
                                type="range"
                                min={0}
                                max={3}
                                step={1}
                                value={periodontal.gingivalIndex}
                                onChange={(e) => setPeriodontal((p) => ({ ...p, gingivalIndex: parseInt(e.target.value, 10) }))}
                                className="relative z-10 w-full h-2 appearance-none bg-transparent [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">{t("periodontalNotes")}</Label>
                        <Textarea
                          placeholder={t("periodontalNotesPlaceholder")}
                          value={periodontal.notes}
                          onChange={(e) => setPeriodontal((p) => ({ ...p, notes: e.target.value }))}
                          rows={4}
                          className="rounded-xl border-slate-200 dark:border-slate-700 resize-none"
                        />
                      </div>

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Button onClick={handleSavePeriodontal} disabled={isPending} className="gap-2">
                          <Save className="h-4 w-4" /> {tCommon("saveChanges")}
                        </Button>
                        <Button variant="outline" onClick={() => setPeriodontalEditMode(false)} disabled={isPending}>
                          <X className="h-4 w-4 mr-2" /> {tCommon("cancel")}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* General Notes Tab — separate from Periodontal notes; add / edit / delete */}
              {activeTab === "notes" && (
                <div className="p-4 md:p-6 m-0 outline-none space-y-6 shrink-0">
                  {odontogram.diagnosis && (
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">{t("diagnosis")}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{odontogram.diagnosis}</p>
                    </div>
                  )}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t("clinicalNotes")}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={() => setIsAddingNote(true)}
                      >
                        <Plus className="h-3.5 w-3.5" />
                        {t("addNote")}
                      </Button>
                    </div>
                    {generalNotesList.length === 0 && !isAddingNote && (
                      <EmptyState
                        icon={<Edit className="h-6 w-6" />}
                        title={t("noGeneralNotes")}
                        description={t("noGeneralNotesDescription")}
                      />
                    )}
                    <ul className="space-y-3">
                      {generalNotesList.map((note) => (
                        <li key={note.id} className="rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 overflow-hidden">
                          {editingNoteId === note.id ? (
                            <div className="p-4 space-y-3">
                              <Textarea
                                value={editingNoteContent}
                                onChange={(e) => setEditingNoteContent(e.target.value)}
                                placeholder={t("noteContentPlaceholder")}
                                className="min-h-[80px] resize-y"
                              />
                              <div className="flex gap-2">
                                <Button type="button" size="sm" onClick={handleEditNoteSave}>
                                  {tCommon("save")}
                                </Button>
                                <Button type="button" size="sm" variant="outline" onClick={() => { setEditingNoteId(null); setEditingNoteContent(""); }}>
                                  {tCommon("cancel")}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 flex items-start justify-between gap-3">
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap flex-1 min-w-0">{note.content || "—"}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => handleEditNoteStart(note.id)}>
                                  <Edit3 className="h-3.5 w-3.5" />
                                  <span className="sr-only">{tCommon("edit")}</span>
                                </Button>
                                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-destructive" onClick={() => handleDeleteNote(note.id)}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="sr-only">{tCommon("delete")}</span>
                                </Button>
                              </div>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                    {isAddingNote && (
                      <div className="mt-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 space-y-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">{t("insertTemplate")}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { label: t("templateRoutineExam"), text: t("templateRoutineExamText") },
                              { label: t("templatePerioAssessment"), text: t("templatePerioAssessmentText") },
                              { label: t("templateTreatmentDiscussed"), text: t("templateTreatmentDiscussedText") },
                              { label: t("templateFollowUp"), text: t("templateFollowUpText") },
                              { label: t("templateRadiograph"), text: t("templateRadiographText") },
                            ].map((tpl) => (
                              <Button
                                key={tpl.label}
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => setNewNoteContent((prev) => (prev ? `${prev}\n\n${tpl.text}` : tpl.text))}
                              >
                                {tpl.label}
                              </Button>
                            ))}
                          </div>
                        </div>
                        <Textarea
                          value={newNoteContent}
                          onChange={(e) => setNewNoteContent(e.target.value)}
                          placeholder={t("enterNewNote")}
                          className="min-h-[80px] resize-y"
                        />
                        <div className="flex gap-2">
                          <Button type="button" size="sm" onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                            {t("addNote")}
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => { setIsAddingNote(false); setNewNoteContent(""); }}>
                            {tCommon("cancel")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* Export Dental Chart Modal */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[70] w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E] p-6 shadow-2xl outline-none">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t("exportDentalChart")}</h3>
              <DialogPrimitive.Close className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {t("exportDescription")}
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">{t("pdfReportExport")}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {t("pdfReportDescription")}
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t("exportOptions")}</h4>
                <div className="flex items-center space-x-2">
                  <Checkbox id="ex-chart" checked={exportIncludeChart} onCheckedChange={(v) => setExportIncludeChart(!!v)} />
                  <Label htmlFor="ex-chart" className="text-sm font-medium cursor-pointer">{t("includeDentalChart")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="ex-treatments" checked={exportIncludeTreatments} onCheckedChange={(v) => setExportIncludeTreatments(!!v)} />
                  <Label htmlFor="ex-treatments" className="text-sm font-medium cursor-pointer">{t("includeTreatmentPlans")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="ex-periodontal" checked={exportIncludePeriodontal} onCheckedChange={(v) => setExportIncludePeriodontal(!!v)} />
                  <Label htmlFor="ex-periodontal" className="text-sm font-medium cursor-pointer">{t("includePeriodontalAssessment")}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="ex-notes" checked={exportIncludeNotes} onCheckedChange={(v) => setExportIncludeNotes(!!v)} />
                  <Label htmlFor="ex-notes" className="text-sm font-medium cursor-pointer">{t("includeGeneralNotes")}</Label>
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{t("chartImageQuality")}</Label>
                <Select value={exportChartQuality} onValueChange={(v: "1" | "2") => setExportChartQuality(v)}>
                  <SelectTrigger className="mt-2 h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">{t("standardQuality")}</SelectItem>
                    <SelectItem value="2">{t("highQuality")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 mb-6">
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">{t("pdfExport")}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mb-1">
                {t("pdfReportDescription")}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{t("patient")}: {odontogram.patientName ?? "—"}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">Date: {format(new Date(), "M/d/yyyy")}</p>
              <p className="text-xs text-slate-600 dark:text-slate-300">{t("version")}: {odontogram.version ?? 1}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">{t("pdfReportWillBeDownloaded")}</p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowExportModal(false)} disabled={isExportingPdf}>
                {tCommon("cancel")}
              </Button>
              <Button onClick={handleExportPdf} disabled={isExportingPdf}>
                {isExportingPdf ? t("generating") : t("exportPdf")}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* Add / Edit Treatment Modal */}
      <Dialog open={showAddTreatmentModal} onOpenChange={(open) => !open && closeAddTreatmentModal()}>
        <DialogPortal>
          <DialogOverlay className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[70] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E] p-6 shadow-2xl outline-none">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingTreatmentId ? t("editingTreatment") : t("addTreatment")}
              </h3>
              <DialogPrimitive.Close className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={closeAddTreatmentModal}>
                <X className="h-4 w-4" />
              </DialogPrimitive.Close>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("toothNumber")}</Label>
                <Select
                  value={String(treatmentForm.tooth)}
                  onValueChange={(v) => setTreatmentForm((f) => ({ ...f, tooth: parseInt(v, 10) }))}
                >
                  <SelectTrigger className="mt-1.5 h-9 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[80]">
                    {Array.from({ length: 32 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>{t("toothNum", { num: n })}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("treatmentProcedure")}</Label>
                <Input
                  placeholder={t("treatmentProcedurePlaceholder")}
                  value={treatmentForm.procedure}
                  onChange={(e) => setTreatmentForm((f) => ({ ...f, procedure: e.target.value }))}
                  className="mt-1.5 h-9 rounded-lg"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("cdtCodeOptional")}</Label>
                <Input
                  placeholder={t("cdtCodePlaceholder")}
                  value={treatmentForm.cdtCode ?? ""}
                  onChange={(e) => setTreatmentForm((f) => ({ ...f, cdtCode: e.target.value }))}
                  className="mt-1.5 h-9 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("status")}</Label>
                  <Select
                    value={treatmentForm.status}
                    onValueChange={(v) => setTreatmentForm((f) => ({ ...f, status: v }))}
                  >
                    <SelectTrigger className="mt-1.5 h-9 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[80]">
                      <SelectItem value="planned">{t("planned")}</SelectItem>
                      <SelectItem value="in_progress">{t("inProgress")}</SelectItem>
                      <SelectItem value="completed">{t("completed")}</SelectItem>
                      <SelectItem value="cancelled">{t("cancelled")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("priority")}</Label>
                  <Select
                    value={treatmentForm.priority}
                    onValueChange={(v) => setTreatmentForm((f) => ({ ...f, priority: v }))}
                  >
                    <SelectTrigger className="mt-1.5 h-9 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[80]">
                      <SelectItem value="low">{t("low")}</SelectItem>
                      <SelectItem value="medium">{t("medium")}</SelectItem>
                      <SelectItem value="high">{t("high")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("estimatedCost")}</Label>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    value={treatmentForm.estimatedCost}
                    onChange={(e) => setTreatmentForm((f) => ({ ...f, estimatedCost: parseFloat(e.target.value) || 0 }))}
                    placeholder="0"
                    className="mt-1.5 h-9 rounded-lg"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("estimatedDuration")}</Label>
                  <Input
                    placeholder={t("estimatedDurationPlaceholder")}
                    value={treatmentForm.estimatedDuration}
                    onChange={(e) => setTreatmentForm((f) => ({ ...f, estimatedDuration: e.target.value }))}
                    className="mt-1.5 h-9 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("plannedDate")}</Label>
                <div className="mt-1.5">
                  <DatePicker
                    date={
                      treatmentForm.plannedDate
                        ? (() => {
                            const s = treatmentForm.plannedDate;
                            if (s.includes("-")) return new Date(s.slice(0, 10));
                            const parts = s.split("/");
                            if (parts.length === 3) {
                              const [d, m, y] = parts;
                              return new Date(parseInt(y!, 10), parseInt(m!, 10) - 1, parseInt(d!, 10));
                            }
                            return undefined;
                          })()
                        : undefined
                    }
                    onSelect={(date) =>
                      setTreatmentForm((f) => ({
                        ...f,
                        plannedDate: date ? format(date, "yyyy-MM-dd") : "",
                      }))
                    }
                    placeholder="dd/mm/yyyy"
                    fromDate={new Date()}
                    popoverClassName="z-[80]"
                    className="h-9 rounded-lg w-full border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="treatment-accepted"
                    checked={!!treatmentForm.acceptedAt}
                    onCheckedChange={(v) =>
                      setTreatmentForm((f) => ({
                        ...f,
                        acceptedAt: v ? format(new Date(), "yyyy-MM-dd") : "",
                      }))
                    }
                  />
                  <Label htmlFor="treatment-accepted" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                    {t("patientAcceptedTreatment")}
                  </Label>
                </div>
                {treatmentForm.acceptedAt && (
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Accepted: {format(new Date(treatmentForm.acceptedAt), "MM/dd/yyyy")}
                  </span>
                )}
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t("notes")}</Label>
                <Textarea
                  placeholder={t("treatmentNotesPlaceholder")}
                  value={treatmentForm.notes}
                  onChange={(e) => setTreatmentForm((f) => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  className="mt-1.5 rounded-lg resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button variant="outline" onClick={closeAddTreatmentModal} disabled={isPending}>{tCommon("cancel")}</Button>
              <Button onClick={handleSaveTreatment} disabled={isPending}>
                <Save className="h-4 w-4 mr-2" /> {tCommon("save")}
              </Button>
            </div>
          </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* Nested Tooth Edit Modal */}
      <ToothEditModal
        toothNum={selectedTooth}
        onClose={() => setSelectedTooth(null)}
        toothData={selectedTooth ? getToothState(selectedTooth) : null}
        onSave={handleSaveTooth}
      />
    </>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return <svg className={className} width="14" height="14" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 2.75C8 2.47386 7.77614 2.25 7.5 2.25C7.22386 2.25 7 2.47386 7 2.75V7H2.75C2.47386 7 2.25 7.22386 2.25 7.5C2.25 7.77614 2.47386 8 2.75 8H7V12.25C7 12.5261 7.22386 12.75 7.5 12.75C7.77614 12.75 8 12.5261 8 12.25V8H12.25C12.5261 8 12.75 7.77614 12.75 7.5C12.75 7.22386 12.5261 7 12.25 7H8V2.75Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>;
}

// ── Nested Tooth Edit Modal (competitor-style: 4 tabs) ──
const SURFACE_KEYS = ["occlusal", "mesial", "distal", "buccal", "lingual"] as const;
const SURFACE_LABEL_KEYS: Record<string, string> = { occlusal: "surfaceOcclusal", mesial: "surfaceMesial", distal: "surfaceDistal", buccal: "surfaceBuccal", lingual: "surfaceLingual" };
const CONDITION_OPTION_KEYS: { value: Condition; key: string }[] = [
  { value: "healthy", key: "conditionHealthy" }, { value: "caries", key: "conditionCaries" }, { value: "filling", key: "conditionFilling" },
  { value: "crown", key: "conditionCrown" }, { value: "bridge", key: "conditionBridge" }, { value: "implant", key: "conditionImplant" },
  { value: "extraction", key: "conditionExtraction" }, { value: "root_canal", key: "conditionRootCanal" }, { value: "missing", key: "conditionMissing" },
  { value: "fractured", key: "conditionFractured" }, { value: "wear", key: "conditionWear" }, { value: "restoration_needed", key: "conditionRestorationNeeded" },
  { value: "sealant", key: "conditionSealant" }, { value: "veneer", key: "conditionVeneer" }, { value: "temporary_filling", key: "conditionTemporaryFilling" },
  { value: "periapical_lesion", key: "conditionPeriapicalLesion" },
];
const TREATMENT_STATUS_OPTIONS = [{ value: "planned", key: "planned" }, { value: "in_progress", key: "inProgress" }, { value: "completed", key: "completed" }, { value: "cancelled", key: "cancelled" }];
const PRIORITY_OPTIONS = [{ value: "low", key: "low" }, { value: "medium", key: "medium" }, { value: "high", key: "high" }];

const DEFAULT_TREATMENT_PLAN = {
  procedure: "",
  status: "planned",
  priority: "medium",
  estimatedCost: 0,
  duration: "",
  plannedDate: "",
  notes: "",
};

function ToothEditModal({ toothNum, toothData, onClose, onSave }: { toothNum: number | null; toothData: ToothData | null; onClose: () => void; onSave: (data: ToothData) => void }) {
  const t = useTranslations("odontograms");
  const tCommon = useTranslations("common");
  const open = toothNum !== null;
  const [toothTab, setToothTab] = useState<"overall" | "surface" | "treatment" | "advanced">("overall");
  const [condition, setCondition] = useState<Condition>("healthy");
  const [surfaces, setSurfaces] = useState<Record<string, Condition>>({});
  const [mobility, setMobility] = useState<0 | 1 | 2 | 3>(0);
  const [notes, setNotes] = useState("");
  const [treatmentPlan, setTreatmentPlan] = useState(DEFAULT_TREATMENT_PLAN);
  const [pocketDepths, setPocketDepths] = useState({ mesial: 0, distal: 0, buccal: 0, lingual: 0 });
  const [conditionDate, setConditionDate] = useState("");

  React.useEffect(() => {
    if (toothData) {
      setCondition(toothData.condition || "healthy");
      setSurfaces(toothData.surfaces ?? {});
      setMobility((toothData.mobility ?? 0) as 0 | 1 | 2 | 3);
      setNotes(toothData.notes ?? "");
      setConditionDate(toothData.conditionDate ?? "");
      setTreatmentPlan(
        toothData.treatmentPlan
          ? { ...DEFAULT_TREATMENT_PLAN, ...toothData.treatmentPlan }
          : toothData.treatment
            ? { ...DEFAULT_TREATMENT_PLAN, procedure: toothData.treatment }
            : DEFAULT_TREATMENT_PLAN
      );
      setPocketDepths({
        mesial: toothData.pocketDepths?.mesial ?? 0,
        distal: toothData.pocketDepths?.distal ?? 0,
        buccal: toothData.pocketDepths?.buccal ?? 0,
        lingual: toothData.pocketDepths?.lingual ?? 0,
      });
    }
  }, [toothData]);

  const surfacesWithCondition = SURFACE_KEYS.filter((k) => surfaces[k] && surfaces[k] !== "healthy").length;

  if (!open || toothNum == null) return null;

  const handleSave = () => {
    onSave({
      tooth: toothNum,
      condition,
      notes: notes.trim() || undefined,
      surfaces: Object.keys(surfaces).length ? surfaces : undefined,
      mobility: mobility !== 0 ? mobility : undefined,
      treatmentPlan: treatmentPlan.procedure || treatmentPlan.notes ? treatmentPlan : undefined,
      pocketDepths: (pocketDepths.mesial || pocketDepths.distal || pocketDepths.buccal || pocketDepths.lingual)
        ? pocketDepths
        : undefined,
      conditionDate: conditionDate.trim() || undefined,
    });
    onClose();
  };

  const selectCls = "rounded-xl max-h-56 z-[70]";
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-[60] w-full max-w-lg max-h-[90vh] -translate-x-1/2 -translate-y-1/2 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E] shadow-2xl outline-none">
          <div className="px-6 pt-5 pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <DialogPrimitive.Title className="text-lg font-bold text-slate-900 dark:text-white">
                  {t("toothNum", { num: toothNum })} – {getToothNameForNum(toothNum, t)}
                </DialogPrimitive.Title>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t("editingToothConditions")}</p>
              </div>
              <DialogPrimitive.Close className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>
            {/* Tabs */}
            <div className="flex gap-1 mt-4 border-b border-slate-100 dark:border-slate-800 -mb-px">
              {(["overall", "surface", "treatment", "advanced"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setToothTab(tab)}
                  className={cn(
                    "px-3 py-2 text-xs font-semibold capitalize border-b-2 transition-colors",
                    toothTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  )}
                >
                  {tab === "overall" && t("overallCondition")}
                  {tab === "surface" && t("surfaceDetails")}
                  {tab === "treatment" && t("treatmentPlan")}
                  {tab === "advanced" && t("advanced")}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 p-6">
            {toothTab === "overall" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 block">{t("primaryCondition")}</Label>
                  <Select value={condition} onValueChange={(v: Condition) => setCondition(v)}>
                    <SelectTrigger className="h-10 rounded-lg text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0B1E]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={selectCls} position="popper">
                      {CONDITION_OPTION_KEYS.map((o) => (
                        <SelectItem key={o.value} value={o.value}>{t(o.key)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 block">{t("toothMobility")}</Label>
                  <div className="flex gap-4 flex-wrap">
                    {([0, 1, 2, 3] as const).map((n) => (
                      <label key={n} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="mobility"
                          checked={mobility === n}
                          onChange={() => setMobility(n)}
                          className="rounded-full border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {n} – {n === 0 ? t("noMobility") : n === 1 ? t("mobilitySlight") : n === 2 ? t("mobilityModerate") : t("mobilitySevere")}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2 block">{t("generalNotes")}</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t("toothNotesPlaceholder")}
                    rows={3}
                    className="rounded-lg text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0B1E] resize-y"
                  />
                </div>
              </div>
            )}

            {toothTab === "surface" && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t("surfaceSpecificConditions")}</h4>
                <div className="space-y-2">
                  {SURFACE_KEYS.map((key) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-700 dark:text-slate-300 w-28 shrink-0">{t(SURFACE_LABEL_KEYS[key])}</span>
                      <Select value={surfaces[key] ?? "healthy"} onValueChange={(v: Condition) => setSurfaces((prev) => ({ ...prev, [key]: v }))}>
                        <SelectTrigger className="h-9 rounded-lg text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B0B1E] flex-1 max-w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={selectCls} position="popper">
                          {CONDITION_OPTION_KEYS.map((o) => (
                            <SelectItem key={o.value} value={o.value}>{t(o.key)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {surfacesWithCondition === 0 ? t("noSurfacesAssigned") : t("surfacesAssigned", { count: surfacesWithCondition })}
                </p>
              </div>
            )}

            {toothTab === "treatment" && (
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t("treatmentPlanning")}</h4>
                <div>
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">{t("plannedProcedure")}</Label>
                  <Input
                    value={treatmentPlan.procedure}
                    onChange={(e) => setTreatmentPlan((p) => ({ ...p, procedure: e.target.value }))}
                    placeholder={t("plannedProcedurePlaceholder")}
                    className="h-10 rounded-lg text-sm border-slate-200 dark:border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">{t("status")}</Label>
                    <Select value={treatmentPlan.status} onValueChange={(v) => setTreatmentPlan((p) => ({ ...p, status: v }))}>
                      <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className={selectCls} position="popper">
                        {TREATMENT_STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{t(o.key)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">{t("priority")}</Label>
                    <Select value={treatmentPlan.priority} onValueChange={(v) => setTreatmentPlan((p) => ({ ...p, priority: v }))}>
                      <SelectTrigger className="h-9 rounded-lg text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent className={selectCls} position="popper">
                        {PRIORITY_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{t(o.key)}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">{t("estimatedCostDollar")}</Label>
                    <Input type="number" min={0} step={0.01} value={treatmentPlan.estimatedCost || ""} onChange={(e) => setTreatmentPlan((p) => ({ ...p, estimatedCost: parseFloat(e.target.value) || 0 }))} className="h-9 rounded-lg text-sm" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">{t("duration")}</Label>
                    <Input value={treatmentPlan.duration} onChange={(e) => setTreatmentPlan((p) => ({ ...p, duration: e.target.value }))} placeholder={t("durationPlaceholder")} className="h-9 rounded-lg text-sm" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">{t("plannedDate")}</Label>
                  <DatePicker
                    date={treatmentPlan.plannedDate ? new Date(treatmentPlan.plannedDate) : undefined}
                    onSelect={(d) => setTreatmentPlan((p) => ({ ...p, plannedDate: d ? format(d, "yyyy-MM-dd") : "" }))}
                    placeholder={t("pickDate")}
                    popoverClassName="z-[70]"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">{t("treatmentNotes")}</Label>
                  <Textarea value={treatmentPlan.notes} onChange={(e) => setTreatmentPlan((p) => ({ ...p, notes: e.target.value }))} placeholder={t("treatmentNotesMaterialsPlaceholder")} rows={2} className="rounded-lg text-sm resize-none" />
                </div>
              </div>
            )}

            {toothTab === "advanced" && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1 block">{t("conditionDateRecorded")}</Label>
                  <DatePicker
                    date={conditionDate ? (() => { const d = new Date(conditionDate); return isNaN(d.getTime()) ? undefined : d; })() : undefined}
                    onSelect={(d) => setConditionDate(d ? format(d, "yyyy-MM-dd") : "")}
                    placeholder={t("whenConditionRecorded")}
                    popoverClassName="z-[70]"
                  />
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">{t("periodontalPocketDepth")}</h4>
                <div className="grid grid-cols-2 gap-3">
                  {(["mesial", "distal", "buccal", "lingual"] as const).map((key) => (
                    <div key={key}>
                      <Label className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1 block">{t("pocketDepthMm", { surface: t(SURFACE_LABEL_KEYS[key]) })}</Label>
                      <Input
                        type="number"
                        min={0}
                        max={15}
                        value={pocketDepths[key] || ""}
                        onChange={(e) => setPocketDepths((p) => ({ ...p, [key]: parseInt(e.target.value, 10) || 0 }))}
                        className="h-9 rounded-lg text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> {t("changesWillBeSaved")}
            </p>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
            <Button variant="outline" onClick={onClose} className="h-9 px-4 rounded-lg font-semibold text-sm">{tCommon("cancel")}</Button>
            <Button onClick={handleSave} className="h-9 px-4 rounded-lg font-bold text-sm gap-2">
              <Save className="h-4 w-4" /> {tCommon("saveChanges")}
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
