import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, patients } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewPrescriptionFormWrapper } from "./new-prescription-form-wrapper";

export default async function NewPrescriptionPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const canCreate = user.role === "admin" || user.role === "doctor";
  if (!canCreate) redirect("/dashboard/prescriptions");

  const t = await getTranslations("prescriptions");
  const [doctors, patientsList] = await Promise.all([
    db
      .select({ id: users.id, fullName: users.fullName })
      .from(users)
      .where(eq(users.role, "doctor"))
      .orderBy(users.fullName),
    db
      .select({ id: patients.id, fullName: patients.fullName })
      .from(patients)
      .orderBy(patients.fullName),
  ]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/prescriptions">{t("backToPrescriptions")}</Link>
          </Button>
        </div>
        <h1 className="dashboard-page-title font-heading">{t("newPrescriptionTitle")}</h1>
        <p className="dashboard-page-description text-muted-foreground">
          {t("newPrescriptionDescription")}
        </p>
      </div>
      <Card className="rounded-[var(--radius)] border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-base">{t("addPrescriptionCardTitle")}</CardTitle>
          <CardDescription>
            {t("addPrescriptionCardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <NewPrescriptionFormWrapper
            doctors={doctors}
            patients={patientsList}
          />
        </CardContent>
      </Card>
    </div>
  );
}
