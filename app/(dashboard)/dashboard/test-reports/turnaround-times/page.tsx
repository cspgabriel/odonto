import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { turnaroundTimes, testCategories } from "@/lib/db/schema";
import { eq, ilike, or, and, count, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Zap, Activity, Timer } from "lucide-react";
import { TurnaroundTimesList } from "./turnaround-times-list";
import { AddTurnaroundTimeButton } from "./add-turnaround-time-button";
import { TurnaroundTimesSearch } from "./turnaround-times-search";
import { TablePagination } from "@/components/dashboard/table-pagination";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export default async function TurnaroundTimesPage({
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
    search
      ? or(
          ilike(turnaroundTimes.name, `%${search}%`),
          ilike(turnaroundTimes.priority, `%${search}%`),
          ilike(turnaroundTimes.code ?? "", `%${search}%`)
        )
      : undefined,
    status && status !== "all" ? eq(turnaroundTimes.isActive, status === "active" ? 1 : 0) : undefined
  );

  const [totalResult] = await db
    .select({ value: count() })
    .from(turnaroundTimes)
    .where(whereClause);

  const totalCount = totalResult?.value ?? 0;
  const offset = (page - 1) * pageSize;

  const list = await db
    .select({
      id: turnaroundTimes.id,
      name: turnaroundTimes.name,
      code: turnaroundTimes.code,
      priority: turnaroundTimes.priority,
      duration: turnaroundTimes.duration,
      durationDisplay: turnaroundTimes.durationDisplay,
      durationMinutes: turnaroundTimes.durationMinutes,
      categoryId: turnaroundTimes.categoryId,
      description: turnaroundTimes.description,
      slaCommitment: turnaroundTimes.slaCommitment,
      reportingHours: turnaroundTimes.reportingHours,
      testExamples: turnaroundTimes.testExamples,
      businessRules: turnaroundTimes.businessRules,
      criticalNotes: turnaroundTimes.criticalNotes,
      escalationProcedure: turnaroundTimes.escalationProcedure,
      isActive: turnaroundTimes.isActive,
      createdAt: turnaroundTimes.createdAt,
      updatedAt: turnaroundTimes.updatedAt,
      categoryName: testCategories.name,
    })
    .from(turnaroundTimes)
    .leftJoin(testCategories, eq(turnaroundTimes.categoryId, testCategories.id))
    .where(whereClause)
    .orderBy(desc(turnaroundTimes.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [activeCount, totalTimes, statCount, activeTimesCount] = await Promise.all([
    db.select({ value: count() }).from(turnaroundTimes).where(eq(turnaroundTimes.isActive, 1)),
    db.select({ value: count() }).from(turnaroundTimes),
    db.select({ value: count() }).from(turnaroundTimes).where(ilike(turnaroundTimes.priority, "%stat%")),
    db.select({ value: count() }).from(turnaroundTimes).where(eq(turnaroundTimes.isActive, 1)),
  ]);

  const activeTotal = activeCount[0]?.value ?? 0;
  const totalTimesVal = totalTimes[0]?.value ?? 0;
  const statTotal = statCount[0]?.value ?? 0;

  const rows = list.map((r) => ({
    ...r,
    categoryName: r.categoryName ?? null,
  }));

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("turnaroundTimesTitle")}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t("turnaroundTimesPageDescription")}
          </p>
        </div>
        <AddTurnaroundTimeButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Total Times</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{totalTimesVal}</p>
            <p className="text-xs text-muted-foreground mt-1">{activeTotal} {t("methodologiesActive")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("turnaroundTimesStatTests")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Zap className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{statTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("turnaroundTimesStatPriority")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("turnaroundTimesAverageTime")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Timer className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">2 days</p>
            <p className="text-xs text-muted-foreground mt-1">Typical turnaround</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">Active Times</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{activeTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("methodologiesCurrentlyActive")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <TurnaroundTimesList
          times={rows}
          createAction={<AddTurnaroundTimeButton variant="outline" size="sm" />}
          searchContent={
            <TurnaroundTimesSearch
              defaultValue={search}
              pageSize={pageSize}
              status={status ?? "all"}
            />
          }
        >
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/test-reports/turnaround-times"
              />
            </div>
          )}
        </TurnaroundTimesList>
      </div>
    </div>
  );
}
