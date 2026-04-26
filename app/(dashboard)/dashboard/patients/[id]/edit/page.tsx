import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { getPatientById, getDoctorsForPatientAssignment } from "@/lib/actions/patient-actions";
import { getDepartments } from "@/lib/actions/department-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdatePatientForm } from "./update-patient-form";

export default async function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "receptionist") {
    redirect("/dashboard/patients");
  }

  const { id } = await params;
  const [result, doctors, deptResult] = await Promise.all([
    getPatientById({ patientId: id }),
    getDoctorsForPatientAssignment(),
    getDepartments(),
  ]);
  if (!result.success) notFound();

  const departments = deptResult.success && deptResult.data ? deptResult.data : [];
  const t = await getTranslations("patients");

  return (
    <div className="space-y-6 max-w-lg">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/dashboard/patients?fullProfile=${id}`}>{t("backToPatient")}</Link>
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>{t("editPatientLabel")}</CardTitle>
        </CardHeader>
        <CardContent>
          <UpdatePatientForm
            patient={result.data.patient}
            doctors={doctors}
            departments={departments}
          />
        </CardContent>
      </Card>
    </div>
  );
}
