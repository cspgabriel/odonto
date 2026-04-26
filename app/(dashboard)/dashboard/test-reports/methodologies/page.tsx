import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { testMethodologies, testCategories } from "@/lib/db/schema";
import { eq, ilike, or, and, count, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Activity, Folder, XCircle } from "lucide-react";
import { MethodologiesList } from "./methodologies-list";
import { AddMethodologyButton } from "./add-methodology-button";
import { MethodologiesSearch } from "./methodologies-search";
import { TablePagination } from "@/components/dashboard/table-pagination";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export default async function MethodologiesPage({
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
          ilike(testMethodologies.name, `%${search}%`),
          ilike(testMethodologies.code ?? "", `%${search}%`)
        )
      : undefined,
    status && status !== "all" ? eq(testMethodologies.isActive, status === "active" ? 1 : 0) : undefined
  );

  const [totalResult] = await db
    .select({ value: count() })
    .from(testMethodologies)
    .where(whereClause);

  const totalCount = totalResult?.value ?? 0;
  const offset = (page - 1) * pageSize;

  const list = await db
    .select({
      id: testMethodologies.id,
      name: testMethodologies.name,
      code: testMethodologies.code,
      categoryId: testMethodologies.categoryId,
      description: testMethodologies.description,
      principles: testMethodologies.principles,
      equipment: testMethodologies.equipment,
      applications: testMethodologies.applications,
      advantages: testMethodologies.advantages,
      limitations: testMethodologies.limitations,
      sampleVolume: testMethodologies.sampleVolume,
      isActive: testMethodologies.isActive,
      createdAt: testMethodologies.createdAt,
      updatedAt: testMethodologies.updatedAt,
      categoryName: testCategories.name,
    })
    .from(testMethodologies)
    .leftJoin(testCategories, eq(testMethodologies.categoryId, testCategories.id))
    .where(whereClause)
    .orderBy(desc(testMethodologies.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [activeCount, totalMethodologies, totalCategories, inactiveCount] = await Promise.all([
    db.select({ value: count() }).from(testMethodologies).where(eq(testMethodologies.isActive, 1)),
    db.select({ value: count() }).from(testMethodologies),
    db.select({ value: count() }).from(testCategories),
    db.select({ value: count() }).from(testMethodologies).where(eq(testMethodologies.isActive, 0)),
  ]);

  const activeTotal = activeCount[0]?.value ?? 0;
  const methodologiesTotal = totalMethodologies[0]?.value ?? 0;
  const categoriesTotal = totalCategories[0]?.value ?? 0;
  const inactiveTotal = inactiveCount[0]?.value ?? 0;

  const rows = list.map((r) => ({
    ...r,
    categoryName: r.categoryName ?? null,
  }));

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("methodologiesTitle")}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t("methodologiesPageDescription")}
          </p>
        </div>
        <AddMethodologyButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("methodologiesTotalMethodologies")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{methodologiesTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{activeTotal} {t("methodologiesActive")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("methodologiesActiveCard")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{activeTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("methodologiesCurrentlyActive")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("methodologiesCategories")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{categoriesTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("methodologiesLinkedCategories")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("methodologiesInactiveCard")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{inactiveTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("methodologiesInactiveSub")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <MethodologiesList
          methodologies={rows}
          createAction={<AddMethodologyButton variant="outline" size="sm" />}
          searchContent={
            <MethodologiesSearch
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
                basePath="/dashboard/test-reports/methodologies"
              />
            </div>
          )}
        </MethodologiesList>
      </div>
    </div>
  );
}
