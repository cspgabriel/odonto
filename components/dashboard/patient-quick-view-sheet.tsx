"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Loader2, Phone, Mail, Copy } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FullProfileButton } from "@/components/dashboard/full-profile-button";
import { getPatientById } from "@/lib/actions/patient-actions";
import { toast } from "sonner";
import { differenceInYears, format } from "date-fns";

const AVATAR_COLORS = [
  "bg-rose-50 text-rose-600 dark:bg-rose-500/10",
  "bg-blue-50 text-blue-600 dark:bg-blue-500/10",
  "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10",
  "bg-amber-50 text-amber-600 dark:bg-amber-500/10",
  "bg-purple-50 text-purple-600 dark:bg-purple-500/10",
  "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/10",
];

function getInitials(name: string): string {
  return (name ?? "")
    .trim()
    .split(/\s+/)
    .map((s) => s[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getAvatarColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function PatientQuickViewSheet({
  patientId,
  open,
  onOpenChange,
}: {
  patientId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("common");
  const [patientData, setPatientData] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!patientId || !open) {
      setPatientData(null);
      return;
    }
    setIsLoading(true);
    getPatientById({ patientId })
      .then((result) => {
        if (result.success && result.data?.patient) {
          setPatientData(result.data.patient as Record<string, unknown>);
        } else {
          toast.error(t("failedToLoadPatient"));
        }
      })
      .catch(() => toast.error("Failed to load patient."))
      .finally(() => setIsLoading(false));
  }, [patientId, open]);

  const p = patientData;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[600px] sm:max-w-[600px] border-l border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] flex flex-col p-0 overflow-hidden shadow-2xl"
      >
        <SheetHeader className="p-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
          <SheetTitle className="text-xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            Patient File
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
              <p className="text-sm font-medium">Loading patient details...</p>
            </div>
          ) : p ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-800/60 pb-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border-2 border-slate-200/60 dark:border-slate-800 shadow-sm">
                    <AvatarFallback className={`text-xl font-black ${getAvatarColor(String(p.id))}`}>
                      {getInitials(String(p.fullName))}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">{String(p.fullName)}</h2>
                    <p className="text-sm font-semibold text-slate-500">Patient Details</p>
                  </div>
                </div>
                <FullProfileButton patientId={String(p.id)} variant="outline" className="font-bold" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Full Name</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{String(p.fullName)}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Date of Birth</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {p.dateOfBirth ? format(new Date(String(p.dateOfBirth)), "MMMM d, yyyy") : t("notSpecified")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Age</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {p.dateOfBirth ? `${differenceInYears(new Date(), new Date(String(p.dateOfBirth)))} years` : t("notSpecified")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Gender</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{String(p.gender || t("notSpecified"))}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Blood Group</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{String(p.bloodGroup || t("notSpecified"))}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Contact Information</h3>
                <div className="grid gap-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Phone</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">{String(p.phone || t("notSpecified"))}</p>
                        {p.phone ? (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-400 hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(String(p.phone));
                                toast.success(t("copiedToClipboard"));
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-primary" asChild>
                              <a href={`tel:${p.phone}`}>
                                <Phone className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Email</p>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm break-all">
                          {String(p.email || t("notSpecified"))}
                        </p>
                        {p.email ? (
                          <div className="flex gap-1 shrink-0">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-slate-400 hover:text-primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(String(p.email));
                                toast.success(t("copiedToClipboard"));
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-primary" asChild>
                              <a href={`mailto:${p.email}`}>
                                <Mail className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Address</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">{String(p.address || t("notSpecified"))}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Emergency Contact</h3>
                <div className="grid grid-cols-3 gap-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 p-4 bg-rose-50/50 dark:bg-rose-500/5">
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Name</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {String(p.emergencyContactName || t("notSpecified"))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Phone</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {String(p.emergencyContactPhone || t("notSpecified"))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Relationship</p>
                    <p className="font-semibold text-slate-900 dark:text-white text-sm">
                      {String(p.emergencyContactRelation || t("notSpecified"))}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
