"use client";

import { useState, useEffect } from "react";
import { getPatientById } from "@/lib/actions/patient-actions";
import type { patients } from "@/lib/db/schema";

type PatientRow = typeof patients.$inferSelect;
export type PatientData = {
  patient: PatientRow;
  appointments: unknown[];
  invoices: unknown[];
} | null;

export function usePatientData(patientId: string | null) {
  const [data, setData] = useState<PatientData>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!patientId) {
      setData(null);
      return;
    }
    setIsLoading(true);
    getPatientById({ patientId })
      .then((result) => {
        if (result.success && result.data) {
          setData(result.data);
        } else {
          setData(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, [patientId]);

  return { data, isLoading };
}
