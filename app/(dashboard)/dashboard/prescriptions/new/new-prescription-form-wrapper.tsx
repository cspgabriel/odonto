"use client";

import { useRouter } from "next/navigation";
import { PrescriptionForm } from "../prescription-form";

export function NewPrescriptionFormWrapper({
  doctors,
  patients,
}: {
  doctors: { id: string; fullName: string | null }[];
  patients: { id: string; fullName: string }[];
}) {
  const router = useRouter();

  return (
    <PrescriptionForm
      patients={patients}
      doctors={doctors.map((d) => ({ id: d.id, fullName: d.fullName ?? "" }))}
      onSuccess={() => {
        router.push("/dashboard/prescriptions");
        router.refresh();
      }}
    />
  );
}
