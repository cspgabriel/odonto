"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTranslations } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Users, X, Check, User, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { createOdontogram } from "@/lib/actions/odontogram-actions";
import { searchPatients } from "@/lib/actions/patient-actions";
import { getPatients } from "@/lib/actions/patient-actions";
import { format, differenceInYears } from "date-fns";

type PatientOption = {
  id: string;
  fullName: string;
  phone?: string | null;
  dateOfBirth?: string | null;
};

export function CreateOdontogramModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("odontograms");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [step, setStep] = useState<"patient" | "form">("patient");
  const [method, setMethod] = useState<"search" | "all">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<PatientOption[]>([]);
  const [allPatients, setAllPatients] = useState<PatientOption[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientOption | null>(null);
  const [examinedAt, setExaminedAt] = useState<Date | undefined>(new Date());
  const [numberingSystem, setNumberingSystem] = useState("universal");
  const [patientType, setPatientType] = useState("adult");
  const [bleedingOnProbing, setBleedingOnProbing] = useState(false);
  const [calculusPresent, setCalculusPresent] = useState(false);
  const [plaqueIndex, setPlaqueIndex] = useState("");
  const [gingivalIndex, setGingivalIndex] = useState("");
  const [generalNotes, setGeneralNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    if (method === "search" && searchQuery.trim().length < 2) return;
    setError(null);
    setIsSearching(true);
    try {
      const results = await searchPatients(searchQuery.trim());
      setSearchResults(results);
    } catch (e) {
      setError(t("failedToLoadPatients"));
    } finally {
      setIsSearching(false);
    }
  }, [method, searchQuery]);

  const loadAllPatients = useCallback(async () => {
    setError(null);
    setIsSearching(true);
    try {
      const list = await getPatients();
      setAllPatients(
        list.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          phone: null as string | null,
          dateOfBirth: null as string | null,
        }))
      );
    } catch (e) {
      setError(t("failedToLoadPatients"));
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (open && method === "search" && searchQuery.trim().length >= 2) {
      const t = setTimeout(() => handleSearch(), 400);
      return () => clearTimeout(t);
    }
  }, [open, method, searchQuery, handleSearch]);

  useEffect(() => {
    if (open && method === "all") {
      loadAllPatients();
    }
  }, [open, method, loadAllPatients]);

  const handleSelectPatient = (p: PatientOption) => {
    setSelectedPatient(p);
    setStep("form");
  };

  const handleChangePatient = () => {
    setSelectedPatient(null);
    setStep("patient");
    setSearchQuery("");
    setSearchResults([]);
  };

  const buildNotes = () => {
    const parts: string[] = [];
    if (bleedingOnProbing) parts.push("Bleeding on Probing: Yes");
    if (calculusPresent) parts.push("Calculus Present: Yes");
    if (plaqueIndex !== "") parts.push(`Plaque Index (0-3): ${plaqueIndex}`);
    if (gingivalIndex !== "") parts.push(`Gingival Index (0-3): ${gingivalIndex}`);
    parts.push(`Numbering System: ${numberingSystem === "universal" ? "Universal (1-32)" : numberingSystem === "palmer" ? "Palmer Notation" : "FDI (ISO 3950)"}`);
    parts.push(`Patient Type: ${patientType === "adult" ? "Adult (Permanent Teeth)" : "Child (Primary Teeth)"}`);
    if (generalNotes.trim()) parts.push(`\nGeneral Notes:\n${generalNotes.trim()}`);
    return parts.join("\n");
  };

  const handleSubmit = async () => {
    if (!selectedPatient) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await createOdontogram({
        patientId: selectedPatient.id,
        examinedAt: examinedAt ? format(examinedAt, "yyyy-MM-dd") : undefined,
        notes: buildNotes(),
      });
      router.refresh();
      onOpenChange(false);
      resetForm();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("failedToCreate"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep("patient");
    setSelectedPatient(null);
    setSearchQuery("");
    setSearchResults([]);
    setAllPatients([]);
    setExaminedAt(new Date());
    setNumberingSystem("universal");
    setPatientType("adult");
    setBleedingOnProbing(false);
    setCalculusPresent(false);
    setPlaqueIndex("");
    setGingivalIndex("");
    setGeneralNotes("");
    setError(null);
  };

  const handleClose = (o: boolean) => {
    if (!o) resetForm();
    onOpenChange(o);
  };

  const age = selectedPatient?.dateOfBirth
    ? differenceInYears(new Date(), new Date(selectedPatient.dateOfBirth))
    : null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-md sm:max-w-lg rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] shadow-xl p-0 overflow-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-300"
        showClose={true}
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">
            {t("createTitle")}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 dark:text-slate-400">
            {step === "patient"
              ? t("createDescriptionPatient")
              : t("createDescriptionForm", { name: selectedPatient?.fullName ?? "" })}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {step === "patient" ? (
              <motion.div
                key="patient"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="space-y-4"
              >
                <div>
                  <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {t("selectMethod")}
                  </Label>
                  <div className="flex gap-2 mt-2">
                    <Button
                      type="button"
                      variant={method === "search" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "flex-1 rounded-lg font-semibold transition-all duration-200",
                        method === "search"
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary/30"
                      )}
                      onClick={() => setMethod("search")}
                    >
                      <Search className="mr-2 h-4 w-4" />
                      {t("search")}
                    </Button>
                    <Button
                      type="button"
                      variant={method === "all" ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "flex-1 rounded-lg font-semibold transition-all duration-200",
                        method === "all"
                          ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                          : "border-slate-200 dark:border-slate-700 hover:border-primary/30"
                      )}
                      onClick={() => setMethod("all")}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      {t("allPatients")}
                    </Button>
                  </div>
                </div>

                <AnimatePresence mode="wait">
                  {method === "search" && (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <Label htmlFor="patient-search" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t("searchPatient")}
                      </Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 transition-colors" />
                        <Input
                          id="patient-search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder={t("searchPatientPlaceholder")}
                          className="pl-10 h-11 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 focus-visible:ring-primary focus-visible:ring-2 focus-visible:border-primary/50 transition-all duration-200"
                        />
                        {isSearching && (
                          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
                        )}
                      </div>

                      {searchQuery.trim().length < 2 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-12 text-slate-400"
                        >
                          <Search className="h-12 w-12 mb-3 opacity-40" />
                          <p className="text-sm font-medium">
                            {t("typeToSearch")}
                          </p>
                        </motion.div>
                      )}

                      {searchQuery.trim().length >= 2 && !isSearching && searchResults.length === 0 && !error && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="flex flex-col items-center justify-center py-12 text-slate-400"
                        >
                          <Users className="h-12 w-12 mb-3 opacity-40" />
                          <p className="text-sm font-medium">{t("noPatientsFound")}</p>
                        </motion.div>
                      )}

                      {searchQuery.trim().length >= 2 && searchResults.length > 0 && (
                        <motion.ul
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2 }}
                          className="space-y-1 max-h-48 overflow-y-auto rounded-xl border border-slate-200/60 dark:border-slate-800/60"
                        >
                          {searchResults.map((p) => (
                            <li key={p.id}>
                              <button
                                type="button"
                                className="w-full text-left px-4 py-3 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors duration-150 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                onClick={() => handleSelectPatient(p)}
                              >
                                {p.fullName}
                                {p.phone && (
                                  <span className="block text-xs text-slate-500 font-normal mt-0.5">{p.phone}</span>
                                )}
                              </button>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </motion.div>
                  )}

                  {method === "all" && (
                    <motion.div
                      key="all"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-3 overflow-hidden"
                    >
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {t("selectPatient")}
                      </Label>
                      <Select
                        value={selectedPatient?.id ?? ""}
                        onValueChange={(id) => {
                          const p = allPatients.find((x) => x.id === id);
                          if (p) handleSelectPatient(p);
                        }}
                        disabled={isSearching}
                      >
                        <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 focus:ring-primary focus:ring-2 transition-all duration-200">
                          <SelectValue placeholder={t("selectPatientPlaceholder")} />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-200 dark:border-slate-800 max-h-60">
                          {allPatients.map((p) => (
                            <SelectItem
                              key={p.id}
                              value={p.id}
                              className="rounded-lg focus:bg-primary/10 focus:text-primary-foreground"
                            >
                              {p.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        {isSearching
                          ? t("loadingPatients")
                          : t("patientsAvailable", { count: allPatients.length })}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive"
                  >
                    {error}
                  </motion.p>
                )}
              </motion.div>
            ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="space-y-4"
            >
              {/* Patient card */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 dark:bg-primary/10 border border-primary/20 dark:border-primary/30 transition-colors duration-200">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white">{selectedPatient?.fullName}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Age: {age ?? "—"} • {selectedPatient?.phone ?? "—"}
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-primary hover:text-primary/80"
                  onClick={handleChangePatient}
                >
                  {t("changePatient")}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("examinationDate")}
                  </Label>
                  <DatePicker
                    date={examinedAt}
                    onSelect={setExaminedAt}
                    placeholder={t("selectDate")}
                    className={cn(
                      "h-11 w-full rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 text-slate-900 dark:text-white text-sm focus-visible:ring-primary/30 transition-all border justify-start font-normal"
                    )}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {t("numberingSystem")}
                  </Label>
                  <Select value={numberingSystem} onValueChange={setNumberingSystem}>
                    <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-800">
                      <SelectValue placeholder={t("selectSystem")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="universal">{t("universal")}</SelectItem>
                      <SelectItem value="palmer">{t("palmerNotation")}</SelectItem>
                      <SelectItem value="fdi">{t("fdi")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("patientType")}
                </Label>
                <Select value={patientType} onValueChange={setPatientType}>
                  <SelectTrigger className="h-11 rounded-xl border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder={t("selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="adult">{t("adult")}</SelectItem>
                    <SelectItem value="child">{t("child")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-4 pt-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t("initialAssessment")}
                </h4>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={bleedingOnProbing}
                      onCheckedChange={(c) => setBleedingOnProbing(!!c)}
                      className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-primary"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Bleeding on Probing
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={calculusPresent}
                      onCheckedChange={(c) => setCalculusPresent(!!c)}
                      className="border-slate-300 dark:border-slate-600 data-[state=checked]:bg-primary"
                    />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Calculus Present
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Plaque Index (0-3)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={3}
                      value={plaqueIndex}
                      onChange={(e) => setPlaqueIndex(e.target.value)}
                      placeholder="0-3"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Gingival Index (0-3)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      max={3}
                      value={gingivalIndex}
                      onChange={(e) => setGingivalIndex(e.target.value)}
                      placeholder="0-3"
                      className="h-11 rounded-xl border-slate-200 dark:border-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {t("generalNotes")}
                </Label>
                <Textarea
                  value={generalNotes}
                  onChange={(e) => setGeneralNotes(e.target.value)}
                  placeholder={t("generalNotesPlaceholder")}
                  className="min-h-[100px] rounded-xl border-slate-200 dark:border-slate-800 resize-y"
                  rows={4}
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}
            </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="px-6 py-4 border-t border-slate-200/60 dark:border-slate-800/60 flex justify-end gap-2 transition-colors duration-200">
          {step === "patient" ? (
            <Button
              type="button"
              variant="outline"
              className="rounded-lg border-slate-200 dark:border-slate-700 transition-all duration-200 hover:border-primary/30"
              onClick={() => handleClose(false)}
            >
              <X className="mr-2 h-4 w-4" />
              {tCommon("cancel")}
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                className="rounded-lg border-slate-200 dark:border-slate-700 transition-all duration-200 hover:border-primary/30"
                onClick={() => handleClose(false)}
              >
<X className="mr-2 h-4 w-4" />
              {tCommon("cancel")}
            </Button>
              <Button
                type="button"
                className="rounded-lg bg-primary hover:bg-primary/90 transition-all duration-200"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                <Check className="mr-2 h-4 w-4" />
                {isSubmitting ? t("creating") : t("createOdontogram")}
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
