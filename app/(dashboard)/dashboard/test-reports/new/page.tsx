import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import {
  getLabVendorsForDropdown,
  getLaboratoryTestsForDropdown,
  getStaffForRecordedBy,
} from "@/lib/actions/lab-test-actions";
import { getPatients } from "@/lib/actions/patient-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TestReportForm } from "./test-report-form";

export default async function NewTestReportPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("testReports");

  const [patients, tests, vendors, staff] = await Promise.all([
    getPatients(),
    getLaboratoryTestsForDropdown(),
    getLabVendorsForDropdown(),
    getStaffForRecordedBy(),
  ]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/test-reports">{t("backToTestReports")}</Link>
          </Button>
        </div>
        <h1 className="dashboard-page-title font-heading">{t("newTestReport")}</h1>
        <p className="dashboard-page-description text-muted-foreground">
          {t("createNewReportDescription")}
        </p>
      </div>
      <Card className="rounded-[var(--radius)] border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-base">
            {t("addTestReportCardTitle")}
          </CardTitle>
          <CardDescription>
            {t("addTestReportCardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TestReportForm
            options={{
              patients,
              tests,
              vendors,
              staff,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
