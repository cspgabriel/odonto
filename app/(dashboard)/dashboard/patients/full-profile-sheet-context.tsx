"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { PatientFullProfileSheet } from "./patient-full-profile-sheet";

type FullProfileSheetContextValue = {
  openFullProfile: (patientId: string) => void;
  closeFullProfile: () => void;
};

const FullProfileSheetContext = createContext<FullProfileSheetContextValue | null>(null);

export function useFullProfileSheet() {
  const ctx = useContext(FullProfileSheetContext);
  if (!ctx) {
    throw new Error("useFullProfileSheet must be used within FullProfileSheetProvider");
  }
  return ctx;
}

type FullProfileSheetProviderProps = {
  userRole: string;
  canEditPatient?: boolean;
  canViewMedicalHistory?: boolean;
  children: React.ReactNode;
};

export function FullProfileSheetProvider({ userRole, canEditPatient, canViewMedicalHistory = false, children }: FullProfileSheetProviderProps) {
  const [patientId, setPatientId] = useState<string | null>(null);
  const open = Boolean(patientId);

  const openFullProfile = useCallback((id: string) => {
    setPatientId(id);
  }, []);

  const closeFullProfile = useCallback(() => {
    setPatientId(null);
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) setPatientId(null);
    },
    []
  );

  return (
    <FullProfileSheetContext.Provider value={{ openFullProfile, closeFullProfile }}>
      {children}
      {patientId ? (
        <PatientFullProfileSheet
          patientId={patientId}
          open={open}
          onOpenChange={handleOpenChange}
          userRole={userRole}
          canEdit={canEditPatient}
          canViewMedicalHistory={canViewMedicalHistory}
        />
      ) : null}
    </FullProfileSheetContext.Provider>
  );
}
