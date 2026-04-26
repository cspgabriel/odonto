import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser } from "@/lib/cache";
import { db } from "@/lib/db";
import { testReports, patients, users, labVendors } from "@/lib/db/schema";
import { eq, ilike, or, and, count, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TestReportsList } from "./test-reports-list";
import { TestReportsSearch } from "./test-reports-search";
import { AddTestReportButton } from "./add-test-report-button";
import {
  getLabVendorsForDropdown,
  getLaboratoryTestsForDropdown,
  getStaffForRecordedBy,
} from "@/lib/actions/lab-test-actions";
import { getPatients } from "@/lib/actions/patient-actions";
import { FileText, Clock, Inbox, Truck } from "lucide-react";
import { TablePagination } from "@/components/dashboard/table-pagination";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function TestReportsStatsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-border/50 py-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24 mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function TestReportsStatsCards({ totalCount }: { totalCount: number }) {
  const t = await getTranslations("testReports");
  const [verifiedRes, pendingRes, recordedRes, deliveredRes] = await Promise.all([
    db.select({ value: count(testReports.id) }).from(testReports).where(eq(testReports.status, "verified")),
    db.select({ value: count(testReports.id) }).from(testReports).where(eq(testReports.status, "pending")),
    db.select({ value: count(testReports.id) }).from(testReports).where(eq(testReports.status, "recorded")),
    db.select({ value: count(testReports.id) }).from(testReports).where(eq(testReports.status, "delivered")),
  ]);
  const verified = verifiedRes[0]?.value ?? 0;
  const pending = pendingRes[0]?.value ?? 0;
  const recorded = recordedRes[0]?.value ?? 0;
  const delivered = deliveredRes[0]?.value ?? 0;

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("totalReports")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{totalCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{verified} {t("verified")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("pending")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{pending}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("awaitingProcessing")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("recorded")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{recorded}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("beingProcessed")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("delivered")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <Truck className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{delivered}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("completedReports")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function TestReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; patientId?: string; page?: string; pageSize?: string }>;
}) {
  const canView = await checkPermission("test_reports.view");
  if (!canView) redirect("/dashboard?error=no_permission");

  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  const { q, status: statusFilter, patientId: patientIdParam, page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(pageSizeParam ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );
  const offset = (page - 1) * pageSize;

  const whereClause = and(
    search
      ? or(
          ilike(patients.fullName, `%${search}%`),
          ilike(testReports.testType, `%${search}%`)
        )
      : undefined,
    statusFilter && statusFilter !== "all" ? eq(testReports.status, statusFilter) : undefined,
    patientIdParam ? eq(testReports.patientId, patientIdParam) : undefined
  );

  const [totalResult, list] = await Promise.all([
    db.select({ value: count(testReports.id) }).from(testReports).innerJoin(patients, eq(testReports.patientId, patients.id)).where(whereClause),
    db
      .select({
        id: testReports.id,
        patientId: testReports.patientId,
        doctorId: testReports.doctorId,
        appointmentId: testReports.appointmentId,
        labVendorId: testReports.labVendorId,
        testType: testReports.testType,
        results: testReports.results,
        notes: testReports.notes,
        reportDate: testReports.reportDate,
        status: testReports.status,
        attachments: testReports.attachments,
        patientName: patients.fullName,
        doctorName: users.fullName,
        vendorName: labVendors.name,
      })
      .from(testReports)
      .innerJoin(patients, eq(testReports.patientId, patients.id))
      .innerJoin(users, eq(testReports.doctorId, users.id))
      .leftJoin(labVendors, eq(testReports.labVendorId, labVendors.id))
      .where(whereClause)
      .orderBy(desc(testReports.createdAt))
      .limit(pageSize)
      .offset(offset),
  ]);

  const totalCount = totalResult[0]?.value ?? 0;
  const canCreate = await checkPermission("test_reports.create");
  const t = await getTranslations("testReports");

  const [patientsList, testsList, vendorsList, staffList] = canCreate
    ? await Promise.all([
        getPatients(),
        getLaboratoryTestsForDropdown(),
        getLabVendorsForDropdown(),
        getStaffForRecordedBy(),
      ])
    : [[], [], [], []];

  const testReportOptions = { patients: patientsList, tests: testsList, vendors: vendorsList, staff: staffList };

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("title")}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t("pageDescription")}
          </p>
        </div>
        {canCreate && (
          <AddTestReportButton
            options={testReportOptions}
            className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90"
          >
            {t("recordReport")}
          </AddTestReportButton>
        )}
      </div>

      <Suspense fallback={<TestReportsStatsSkeleton />}>
        <TestReportsStatsCards totalCount={totalCount} />
      </Suspense>

      <div className="space-y-4">
        <TestReportsList
          testReports={list}
          searchContent={
            <TestReportsSearch
              defaultValue={search}
              pageSize={pageSize}
              status={statusFilter ?? "all"}
            />
          }
          createAction={
            canCreate ? (
              <AddTestReportButton options={testReportOptions} variant="outline" size="sm">
                {t("recordReport")}
              </AddTestReportButton>
            ) : undefined
          }
        >
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/test-reports"
              />
            </div>
          )}
        </TestReportsList>
      </div>
    </div>
  );
}
