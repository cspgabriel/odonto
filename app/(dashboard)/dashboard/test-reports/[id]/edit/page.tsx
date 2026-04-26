import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import {
  getTestReportById,
  getLabVendorsForDropdown,
  getLaboratoryTestsForDropdown,
  getStaffForRecordedBy,
} from "@/lib/actions/lab-test-actions";
import { getPatients } from "@/lib/actions/patient-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TestReportForm, type TestReportInitial } from "../../new/test-report-form";

export default async function EditTestReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const result = await getTestReportById(id);
  if (!result.success) notFound();

  const report = result.data;
  const [patients, tests, vendors, staff] = await Promise.all([
    getPatients(),
    getLaboratoryTestsForDropdown(),
    getLabVendorsForDropdown(),
    getStaffForRecordedBy(),
  ]);

  const initial: TestReportInitial = {
    id: report.id,
    patientId: report.patientId,
    testId: report.testId,
    labVendorId: report.labVendorId,
    reportDate: report.reportDate,
    doctorId: report.doctorId,
    results: report.results,
    referenceValues: report.referenceValues,
    clinicalInterpretation: report.clinicalInterpretation,
    abnormalFindings: report.abnormalFindings,
    recommendations: report.recommendations,
    notes: report.notes,
    attachments: report.attachments ?? [],
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/test-reports">← Test Reports</Link>
          </Button>
        </div>
        <h1 className="dashboard-page-title font-heading">Edit Test Report</h1>
        <p className="dashboard-page-description text-muted-foreground">
          Update test report details and results.
        </p>
      </div>
      <Card className="rounded-[var(--radius)] border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading text-base">Update Test Report</CardTitle>
          <CardDescription>
            Change patient, test, or results and save.
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
            reportId={id}
            initial={initial}
          />
        </CardContent>
      </Card>
    </div>
  );
}
