"use client";

import { PatientFullProfileSheet } from "./patient-full-profile-sheet";

type FullProfileSheetWrapperProps = {
  fullProfileId: string | undefined;
  userRole: string;
  children: React.ReactNode;
};

export function FullProfileSheetWrapper({
  fullProfileId,
  userRole,
  children,
}: FullProfileSheetWrapperProps) {
  const open = Boolean(fullProfileId);

  return (
    <>
      {children}
      <PatientFullProfileSheet
        patientId={fullProfileId ?? null}
        open={open}
        onOpenChange={() => {}}
        userRole={userRole}
      />
    </>
  );
}
