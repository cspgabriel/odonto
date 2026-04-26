import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDoctorsForPatientAssignment } from "@/lib/actions/patient-actions";
import { getDepartments } from "@/lib/actions/department-actions";
import { CreatePatientForm } from "./create-patient-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewPatientPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "receptionist") {
    redirect("/dashboard/patients");
  }

  const [doctors, deptResult] = await Promise.all([
    getDoctorsForPatientAssignment(),
    getDepartments(),
  ]);
  const departments = deptResult.success && deptResult.data ? deptResult.data : [];

  return (
    <div className="space-y-6 max-w-lg">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard/patients">← Patients</Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Add patient</CardTitle>
        </CardHeader>
        <CardContent>
          <CreatePatientForm doctors={doctors} departments={departments} />
        </CardContent>
      </Card>
    </div>
  );
}
