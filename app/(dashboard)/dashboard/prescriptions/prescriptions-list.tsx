"use client";

import React, { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import {
  FileText, ChevronUp, ChevronDown, ChevronsUpDown,
  Pill, User, Stethoscope, Phone, Mail, Calendar,
  ClipboardList, Building2, Trash2, Edit, Package,
  Clock, CheckCircle, AlertCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader,
  AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format, differenceInYears } from "date-fns";
import { toast } from "sonner";
import { updatePrescription, deletePrescription } from "@/lib/actions/prescription-actions";
import { PrescriptionForm } from "./prescription-form";
import { PrescriptionsSearch } from "./prescriptions-search";
import { useFullProfileSheet } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Prescription {
  id: string; patientId: string; doctorId: string; appointmentId?: string | null;
  medication: string; dosage: string; instructions: string | null;
  frequency: string | null; duration: string | null;
  drugInteractions: string | null; pharmacyName: string | null; pharmacyAddress: string | null;
  issuedAt: Date; updatedAt: Date;
  patientName: string; patientPhone: string; patientEmail: string | null;
  patientDob: string; patientGender: string | null;
  doctorName: string; doctorSpecialization: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
  "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
  "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  "bg-purple-50 text-purple-600 dark:bg-purple-500/10",
  "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10",
];
function getAvatarColor(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = id.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}
function getInitials(name: string) {
  return (name ?? "").trim().split(/\s+/).map(s => s[0]).join("").toUpperCase().slice(0, 2);
}
function getRxNumber(id: string) { return "RX-" + id.slice(-6).toUpperCase(); }
function getRxStatus(rx: Prescription): "active" | "pending" | "dispensed" | "completed" {
  const days = (Date.now() - new Date(rx.issuedAt).getTime()) / 864e5;
  if (days <= 7)  return "active";
  if (days <= 14) return "pending";
  if (days <= 30) return "dispensed";
  return "completed";
}
const STATUS_CONFIG = {
  active:    { labelKey: "statusActive" as const,    icon: CheckCircle, cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200/60" },
  pending:   { labelKey: "statusPending" as const,   icon: Clock,       cls: "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200/60" },
  dispensed: { labelKey: "statusDispensed" as const, icon: Package,     cls: "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200/60" },
  completed: { labelKey: "statusCompleted" as const, icon: CheckCircle, cls: "bg-slate-100 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400 border-slate-200/60" },
};

// ── Sortable header ───────────────────────────────────────────────────────────
function SortableHeader({ label, sortKey }: { label: string; sortKey: string }) {
  const router = useRouter();
  const sp = useSearchParams();
  const pathname = usePathname();
  const cur = sp.get("sortBy") ?? "date";
  const ord = sp.get("sortOrder") ?? "desc";
  const active = cur === sortKey;
  const toggle = () => {
    const p = new URLSearchParams(sp);
    p.set("sortBy", sortKey);
    p.set("sortOrder", active && ord === "asc" ? "desc" : "asc");
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  };
  return (
    <button onClick={toggle} className={`flex items-center gap-1.5 hover:text-slate-900 dark:hover:text-white transition-colors select-none ${active ? "text-slate-900 dark:text-white" : ""}`}>
      {label}
      {active ? (ord === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />) : <ChevronsUpDown className="h-3 w-3 opacity-30" />}
    </button>
  );
}

// ── Main list component ───────────────────────────────────────────────────────
export function PrescriptionsList({
  prescriptions: list,
  doctors,
  patients,
  searchContent,
  canCreate,
  canEdit = true,
  canDelete = true,
  children,
}: {
  prescriptions: Prescription[];
  doctors: { id: string; fullName: string }[];
  patients: { id: string; fullName: string }[];
  searchContent?: React.ReactNode;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  children?: React.ReactNode;
}) {
  const t = useTranslations("prescriptions");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const { openFullProfile } = useFullProfileSheet();
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [viewRx, setViewRx] = useState<Prescription | null>(null);
  const [editRx, setEditRx] = useState<Prescription | null>(null);

  const toggleRow = (id: string) => setSelectedRows(p => { const s = new Set(p); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const toggleAll = (checked: boolean) => setSelectedRows(checked ? new Set(list.map(r => r.id)) : new Set());

  async function handleDeleteOne(id: string) {
    toast.promise(
      deletePrescription(id).then((r) => { if (!r.success) throw new Error(r.error); }),
      {
        loading: t("deleting"),
        success: () => { router.refresh(); return t("deleted"); },
        error: (e) => e instanceof Error ? e.message : t("failedToDelete"),
      }
    );
  }

  // Inject bulk-action props into search bar
  const enrichedSearch = React.isValidElement(searchContent)
    ? React.cloneElement(searchContent as React.ReactElement<any>, {
        selectedCount: selectedRows.size,
        canDelete,
        onDeleteSelected: canDelete ? async () => {
          const ids = Array.from(selectedRows);
          toast.promise(
            Promise.all(ids.map((id) => deletePrescription(id))).then((results) => {
              const failed = results.filter((r) => !r.success);
              if (failed.length) throw new Error(failed[0].error ?? "Failed to delete.");
            }),
            {
              loading: t("deletingCount", { count: ids.length }),
              success: () => { setSelectedRows(new Set()); router.refresh(); return t("deletedCount", { count: ids.length }); },
              error: (e) => e instanceof Error ? e.message : t("failedToDelete"),
            }
          );
        } : undefined,
        onClearSelection: () => setSelectedRows(new Set()),
      })
    : searchContent;

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
        {/* Search bar */}
        {enrichedSearch && (
          <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60 transition-colors">
            {enrichedSearch}
          </div>
        )}

        {list.length === 0 ? (
          <EmptyState
            icon={<FileText className="h-6 w-6" />}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
          />
        ) : (
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/50">
              <TableRow className="border-slate-200/60 dark:border-slate-800/60 hover:bg-transparent">
                <TableHead className="pl-6 w-[50px]">
                  <Checkbox
                    checked={selectedRows.size === list.length && list.length > 0}
                    onCheckedChange={(c: boolean | "indeterminate") => toggleAll(!!c)}
                    className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary"
                  />
                </TableHead>
                <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[160px]">{t("tablePrescription")}</TableHead>
                <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[200px]"><SortableHeader label={t("tablePatient")} sortKey="patient" /></TableHead>
                <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest w-[180px]"><SortableHeader label={t("tableDoctor")} sortKey="doctor" /></TableHead>
                <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest hidden md:table-cell">{t("tableMedications")}</TableHead>
                <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest hidden lg:table-cell w-[120px]">{t("tableStatus")}</TableHead>
                <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest hidden lg:table-cell w-[130px]"><SortableHeader label={t("tableDate")} sortKey="date" /></TableHead>
                <TableHead className="font-bold text-slate-500 dark:text-slate-400 h-12 uppercase text-[10px] tracking-widest text-right pr-6 w-[100px]">{t("tableActions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {list.map(rx => {
                const status = getRxStatus(rx);
                const { labelKey, icon: Icon, cls } = STATUS_CONFIG[status];
                const avatarColor = getAvatarColor(rx.patientId);
                const isSelected = selectedRows.has(rx.id);
                return (
                  <TableRow
                    key={rx.id}
                    className={`border-slate-200/60 dark:border-slate-800/60 hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors cursor-pointer ${isSelected ? "bg-primary/5 dark:bg-primary/10" : ""}`}
                    onClick={() => setViewRx(rx)}
                  >
                    <TableCell className="pl-6 py-4 align-middle" onClick={e => e.stopPropagation()}>
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleRow(rx.id)}
                        className="translate-y-0.5 border-slate-300 dark:border-slate-700 data-[state=checked]:bg-primary" />
                    </TableCell>

                    <TableCell className="py-4 align-middle">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="text-[11px] font-black text-primary tracking-wider">{getRxNumber(rx.id)}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{rx.frequency ?? t("dailyFallback")}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 align-middle" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center gap-2.5">
                        <Avatar className={`h-7 w-7 shrink-0 ${avatarColor}`}>
                          <AvatarFallback className={`text-[10px] font-black bg-transparent ${avatarColor.split(" ").find(c => c.startsWith("text-"))}`}>
                            {getInitials(rx.patientName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <Button
                            variant="link"
                            className="h-auto p-0 text-sm font-semibold text-slate-900 dark:text-white hover:text-primary justify-start"
                            onClick={() => openFullProfile(rx.patientId)}
                          >
                            {rx.patientName}
                          </Button>
                          <p className="text-[11px] text-slate-400 mt-0.5">{rx.patientPhone}</p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-4 align-middle">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{rx.doctorName}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{rx.doctorSpecialization ?? t("generalPractice")}</p>
                    </TableCell>

                    <TableCell className="py-4 align-middle hidden md:table-cell">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white leading-none">{rx.medication}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{rx.dosage} · {rx.duration ?? "N/A"}</p>
                    </TableCell>

                    <TableCell className="py-4 align-middle hidden lg:table-cell">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${cls}`}>
                        <Icon className="h-3 w-3" />{t(labelKey)}
                      </span>
                    </TableCell>

                    <TableCell className="py-4 align-middle hidden lg:table-cell">
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium whitespace-nowrap">
                        {format(new Date(rx.issuedAt), "MMM dd, yyyy")}
                      </p>
                    </TableCell>

                    {/* Always-visible actions — same as patient table */}
                    <TableCell className="text-right pr-6 py-4 align-middle" onClick={e => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {canEdit && (
                        <Button variant="ghost" size="icon"
                          className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                          onClick={() => setEditRx(rx)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">{t("edit")}</span>
                        </Button>
                        )}
                        {canDelete && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon"
                              className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all">
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">{t("delete")}</span>
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B0B1E]">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="font-heading text-lg font-bold">{t("deleteOneTitle")}</AlertDialogTitle>
                              <AlertDialogDescription className="text-slate-500 text-sm">
                                {t("deleteOneDescription", { rx: getRxNumber(rx.id), patient: rx.patientName })} {tCommon("deleteDescription")}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="mt-4 gap-2">
                              <AlertDialogCancel className="font-bold border-slate-200 dark:border-slate-800 rounded-lg">{tCommon("cancel")}</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteOne(rx.id)}
                                className="font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg px-6">
                                {t("confirmDelete")}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
        {children}
      </div>

      {/* ── View Detail Sheet ─────────────────────────────────────────────── */}
      <Sheet open={!!viewRx} onOpenChange={open => { if (!open) setViewRx(null); }}>
        <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">{t("detailsTitle")}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {viewRx && <RxDetailView rx={viewRx} onEdit={() => { setViewRx(null); setEditRx(viewRx); }} canEdit={canEdit} t={t} />}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Edit Sheet ────────────────────────────────────────────────────── */}
      <Sheet open={!!editRx} onOpenChange={open => { if (!open) setEditRx(null); }}>
        <SheetContent side="right" className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl">
          <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
            <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
              {t("editTitle")} {editRx ? getRxNumber(editRx.id) : ""}
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            {editRx && (
              <PrescriptionForm
                isEdit rxId={editRx.id}
                initial={{
                  patientId: editRx.patientId, doctorId: editRx.doctorId,
                  medication: editRx.medication, dosage: editRx.dosage,
                  frequency: editRx.frequency ?? "", duration: editRx.duration ?? "",
                  instructions: editRx.instructions ?? "", drugInteractions: editRx.drugInteractions ?? "",
                  pharmacyName: editRx.pharmacyName ?? "", pharmacyAddress: editRx.pharmacyAddress ?? "",
                }}
                patients={patients} doctors={doctors}
                onSuccess={() => { setEditRx(null); router.refresh(); }}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

// ── Detail view ───────────────────────────────────────────────────────────────
function RxDetailView({ rx, onEdit, canEdit = true, t }: { rx: Prescription; onEdit: () => void; canEdit?: boolean; t: ReturnType<typeof useTranslations<"prescriptions">> }) {
  const status = getRxStatus(rx);
  const { labelKey, icon: Icon, cls } = STATUS_CONFIG[status];
  const avatarColor = getAvatarColor(rx.patientId);
  const age = rx.patientDob ? differenceInYears(new Date(), new Date(rx.patientDob)) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <ClipboardList className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{getRxNumber(rx.id)}</h2>
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider mt-1 ${cls}`}>
              <Icon className="h-3 w-3" />{t(labelKey)}
            </span>
          </div>
        </div>
        {canEdit && (
          <Button variant="outline" className="font-bold" onClick={onEdit}>
            <Edit className="h-3.5 w-3.5 mr-1.5" />{t("edit")}
          </Button>
        )}
      </div>

      <Section title={t("sectionPatient")}>
        <div className="flex items-center gap-3 mb-4">
          <Avatar className={`h-10 w-10 ${avatarColor}`}>
            <AvatarFallback className={`text-sm font-black bg-transparent ${avatarColor.split(" ").find(c => c.startsWith("text-"))}`}>{getInitials(rx.patientName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">{rx.patientName}</p>
            <p className="text-xs text-slate-500">{age ? `${age} yrs` : ""}{rx.patientGender ? ` · ${rx.patientGender}` : ""}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50">
          <DetailField label={t("labelDateOfBirth")} value={rx.patientDob ? format(new Date(rx.patientDob), "MMMM d, yyyy") : "—"} />
          <DetailField label={t("labelPhone")} value={rx.patientPhone} />
          {rx.patientEmail && <DetailField label={t("labelEmail")} value={rx.patientEmail} />}
        </div>
      </Section>

      <Section title={t("sectionDoctor")}>
        <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50">
          <DetailField label={t("labelDoctorName")} value={rx.doctorName} />
          <DetailField label={t("labelSpecialization")} value={rx.doctorSpecialization ?? t("generalPractice")} />
        </div>
      </Section>

      <Section title={t("sectionMedication")}>
        <div className="rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
          <div className="p-4 bg-slate-50/50 dark:bg-slate-900/30 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Pill className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{rx.medication}</p>
              <p className="text-xs text-slate-500">{rx.dosage}</p>
            </div>
          </div>
          <div className="px-4 py-3 grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800">
            <MiniField label={t("labelFrequency")} value={rx.frequency ?? t("asDirected")} />
            <MiniField label={t("labelDuration")} value={rx.duration ?? "N/A"} />
            <MiniField label={t("labelIssued")} value={format(new Date(rx.issuedAt), "MMM d, yyyy")} />
          </div>
        </div>
        {rx.instructions && (
          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{t("clinicalNotes")}</p>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{rx.instructions}</p>
          </div>
        )}
      </Section>

      {(rx.pharmacyName || rx.pharmacyAddress) && (
        <Section title={t("sectionPharmacy")}>
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50">
            {rx.pharmacyName    && <DetailField label={t("labelName")}    value={rx.pharmacyName} />}
            {rx.pharmacyAddress && <DetailField label={t("labelAddress")} value={rx.pharmacyAddress} />}
          </div>
        </Section>
      )}

      {rx.drugInteractions && (
        <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-0.5">{t("drugInteractions")}</p>
            <p className="text-xs text-amber-800 dark:text-amber-300">{rx.drugInteractions}</p>
          </div>
        </div>
      )}

      <p className="text-[10px] text-slate-400 text-center">
        {t("lastUpdated")}: {format(new Date(rx.updatedAt), "MMM d, yyyy 'at' h:mm a")}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">{title}</h3>{children}</div>;
}
function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="font-semibold text-slate-900 dark:text-white text-sm">{value}</p>
    </div>
  );
}
function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}
