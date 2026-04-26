import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  laboratoryTests,
  testCategories,
  sampleTypes,
  testMethodologies,
  turnaroundTimes,
} from "@/lib/db/schema";
import { eq, ilike, or, and, count, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FlaskConical, Folder, Droplets, Settings, Activity } from "lucide-react";
import { TestsList } from "./tests-list";
import { AddTestButton } from "./add-test-button";
import { TestsSearch } from "./tests-search";
import { TablePagination } from "@/components/dashboard/table-pagination";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export default async function TestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("testReports");

  const { q, page: pageParam, pageSize: pageSizeParam, status } = await searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(pageSizeParam ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );

  const whereClause = and(
    search ? or(ilike(laboratoryTests.name, `%${search}%`)) : undefined,
    status && status !== "all" ? eq(laboratoryTests.isActive, status === "active" ? 1 : 0) : undefined
  );

  const [totalResult] = await db
    .select({ value: count() })
    .from(laboratoryTests)
    .where(whereClause);

  const totalCount = totalResult?.value ?? 0;
  const offset = (page - 1) * pageSize;

  const list = await db
    .select({
      id: laboratoryTests.id,
      name: laboratoryTests.name,
      testCode: laboratoryTests.testCode,
      description: laboratoryTests.description,
      categoryId: laboratoryTests.categoryId,
      sampleTypeId: laboratoryTests.sampleTypeId,
      methodologyId: laboratoryTests.methodologyId,
      turnaroundTimeId: laboratoryTests.turnaroundTimeId,
      normalRange: laboratoryTests.normalRange,
      units: laboratoryTests.units,
      price: laboratoryTests.price,
      isActive: laboratoryTests.isActive,
      createdAt: laboratoryTests.createdAt,
      updatedAt: laboratoryTests.updatedAt,
      categoryName: testCategories.name,
      sampleTypeName: sampleTypes.name,
      methodologyName: testMethodologies.name,
      turnaroundTimeName: turnaroundTimes.name,
    })
    .from(laboratoryTests)
    .leftJoin(testCategories, eq(laboratoryTests.categoryId, testCategories.id))
    .leftJoin(sampleTypes, eq(laboratoryTests.sampleTypeId, sampleTypes.id))
    .leftJoin(testMethodologies, eq(laboratoryTests.methodologyId, testMethodologies.id))
    .leftJoin(turnaroundTimes, eq(laboratoryTests.turnaroundTimeId, turnaroundTimes.id))
    .where(whereClause)
    .orderBy(desc(laboratoryTests.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [activeCount, totalTests, categoriesCount, sampleTypesCount, methodologiesCount] = await Promise.all([
    db.select({ value: count() }).from(laboratoryTests).where(eq(laboratoryTests.isActive, 1)),
    db.select({ value: count() }).from(laboratoryTests),
    db.select({ value: count() }).from(testCategories),
    db.select({ value: count() }).from(sampleTypes),
    db.select({ value: count() }).from(testMethodologies),
  ]);

  const activeTotal = activeCount[0]?.value ?? 0;
  const totalTestsVal = totalTests[0]?.value ?? 0;
  const categoriesTotal = categoriesCount[0]?.value ?? 0;
  const sampleTypesTotal = sampleTypesCount[0]?.value ?? 0;
  const methodologiesTotal = methodologiesCount[0]?.value ?? 0;

  const rows = list.map((r) => ({
    ...r,
    categoryName: r.categoryName ?? null,
    sampleTypeName: r.sampleTypeName ?? null,
    methodologyName: r.methodologyName ?? null,
    turnaroundTimeName: r.turnaroundTimeName ?? null,
  }));

  const labOptions = {
    categories: await db.select({ id: testCategories.id, name: testCategories.name }).from(testCategories).orderBy(testCategories.name),
    sampleTypes: await db.select({ id: sampleTypes.id, name: sampleTypes.name }).from(sampleTypes).orderBy(sampleTypes.name),
    methodologies: await db.select({ id: testMethodologies.id, name: testMethodologies.name }).from(testMethodologies).orderBy(testMethodologies.name),
    turnaroundTimes: await db.select({ id: turnaroundTimes.id, name: turnaroundTimes.name }).from(turnaroundTimes).orderBy(turnaroundTimes.name),
  };

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("testsTitle")}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t("testsPageDescription")}
          </p>
        </div>
        <AddTestButton labOptions={labOptions} className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("testsTotalTests")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{totalTestsVal}</p>
            <p className="text-xs text-muted-foreground mt-1">{activeTotal} {t("testsActive")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("testsCategories")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{categoriesTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("testsTestCategories")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("testsSampleTypes")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{sampleTypesTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("testsAvailableSampleTypes")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("testsMethodologies")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{methodologiesTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("testsTestMethodologies")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <TestsList
          tests={rows}
          createAction={<AddTestButton variant="outline" size="sm" labOptions={labOptions} />}
          searchContent={
            <TestsSearch
              defaultValue={search}
              pageSize={pageSize}
              status={status ?? "all"}
            />
          }
          labOptions={labOptions}
        >
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/test-reports/tests"
              />
            </div>
          )}
        </TestsList>
      </div>
    </div>
  );
}
