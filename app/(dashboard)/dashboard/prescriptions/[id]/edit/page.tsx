import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { prescriptions, patients, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PrescriptionEditForm } from "./prescription-edit-form";

export default async function EditPrescriptionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { checkPermission } = await import("@/lib/auth/require-permission");
  const canEdit = await checkPermission("prescriptions.edit");
  if (!canEdit) redirect("/dashboard/prescriptions");

  const t = await getTranslations("prescriptions");
  const { id } = await params;

  const [rx] = await db
    .select({
      id: prescriptions.id,
      patientId: prescriptions.patientId,
      doctorId: prescriptions.doctorId,
      medication: prescriptions.medication,
      dosage: prescriptions.dosage,
      inventoryItemId: prescriptions.inventoryItemId,
      frequency: prescriptions.frequency,
      duration: prescriptions.duration,
      instructions: prescriptions.instructions,
      drugInteractions: prescriptions.drugInteractions,
      pharmacyName: prescriptions.pharmacyName,
      pharmacyAddress: prescriptions.pharmacyAddress,
      issuedAt: prescriptions.issuedAt,
      patientName: patients.fullName,
      doctorName: users.fullName,
    })
    .from(prescriptions)
    .innerJoin(patients, eq(prescriptions.patientId, patients.id))
    .innerJoin(users, eq(prescriptions.doctorId, users.id))
    .where(eq(prescriptions.id, id))
    .limit(1);

  if (!rx) notFound();

  const allPatients = await db
    .select({ id: patients.id, fullName: patients.fullName })
    .from(patients)
    .orderBy(patients.fullName);

  const allDoctors = await db
    .select({ id: users.id, fullName: users.fullName })
    .from(users)
    .where(eq(users.role, "doctor"))
    .orderBy(users.fullName);

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex items-center gap-3 pt-4">
        <Button variant="ghost" size="sm" asChild className="h-8 px-3 text-slate-500 hover:text-slate-900 dark:hover:text-white">
          <Link href="/dashboard/prescriptions">
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            {t("backToPrescriptions")}
          </Link>
        </Button>
      </div>
      <div>
        <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
          {t("editPrescriptionPageTitle")}
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          {t("rxForPatient", { rx: id.slice(-6).toUpperCase(), patient: rx.patientName ?? "" })}
        </p>
      </div>
      <PrescriptionEditForm
        prescription={rx}
        patients={allPatients}
        doctors={allDoctors}
      />
    </div>
  );
}
