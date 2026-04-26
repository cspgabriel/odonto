import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { sampleTypes, testCategories } from "@/lib/db/schema";
import { eq, ilike, or, and, count, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, Activity, TestTube, Beaker } from "lucide-react";
import { SampleTypesList } from "./sample-types-list";
import { AddSampleTypeButton } from "./add-sample-type-button";
import { SampleTypesSearch } from "./sample-types-search";
import { TablePagination } from "@/components/dashboard/table-pagination";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export default async function SampleTypesPage({
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
          ilike(sampleTypes.name, `%${search}%`),
          ilike(sampleTypes.category ?? "", `%${search}%`),
          ilike(sampleTypes.code ?? "", `%${search}%`)
        )
      : undefined,
    status && status !== "all" ? eq(sampleTypes.isActive, status === "active" ? 1 : 0) : undefined
  );

  const [totalResult] = await db
    .select({ value: count() })
    .from(sampleTypes)
    .where(whereClause);

  const totalCount = totalResult?.value ?? 0;
  const offset = (page - 1) * pageSize;

  const list = await db
    .select({
      id: sampleTypes.id,
      name: sampleTypes.name,
      code: sampleTypes.code,
      categoryId: sampleTypes.categoryId,
      category: sampleTypes.category,
      description: sampleTypes.description,
      collectionMethod: sampleTypes.collectionMethod,
      volumeRequired: sampleTypes.volumeRequired,
      containerType: sampleTypes.containerType,
      preservativeAnticoagulant: sampleTypes.preservativeAnticoagulant,
      specialCollectionInstructions: sampleTypes.specialCollectionInstructions,
      storageTemperature: sampleTypes.storageTemperature,
      storageTimeStability: sampleTypes.storageTimeStability,
      processingTime: sampleTypes.processingTime,
      transportConditions: sampleTypes.transportConditions,
      handlingRequirements: sampleTypes.handlingRequirements,
      rejectionCriteria: sampleTypes.rejectionCriteria,
      safetyPrecautions: sampleTypes.safetyPrecautions,
      commonTests: sampleTypes.commonTests,
      collection: sampleTypes.collection,
      storage: sampleTypes.storage,
      isActive: sampleTypes.isActive,
      createdAt: sampleTypes.createdAt,
      updatedAt: sampleTypes.updatedAt,
      categoryName: testCategories.name,
    })
    .from(sampleTypes)
    .leftJoin(testCategories, eq(sampleTypes.categoryId, testCategories.id))
    .where(whereClause)
    .orderBy(desc(sampleTypes.createdAt))
    .limit(pageSize)
    .offset(offset);

  const rows = list.map((r) => ({ ...r, categoryName: r.categoryName ?? null }));

  const [activeCount, totalTypes, bloodCount, otherCount] = await Promise.all([
    db.select({ value: count() }).from(sampleTypes).where(eq(sampleTypes.isActive, 1)),
    db.select({ value: count() }).from(sampleTypes),
    db.select({ value: count() }).from(sampleTypes).where(ilike(sampleTypes.category ?? "", "%blood%")),
    db.select({ value: count() }).from(sampleTypes).where(ilike(sampleTypes.category ?? "", "%other%")),
  ]);

  const activeTotal = activeCount[0]?.value ?? 0;
  const totalTypesVal = totalTypes[0]?.value ?? 0;
  const bloodTotal = bloodCount[0]?.value ?? 0;
  const otherTotal = otherCount[0]?.value ?? 0;

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("sampleTypesTitle")}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t("sampleTypesPageDescription")}
          </p>
        </div>
        <AddSampleTypeButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("sampleTypesTotalSampleTypes")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Droplets className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{totalTypesVal}</p>
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
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("sampleTypesBloodSamples")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <TestTube className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{bloodTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("sampleTypesBloodCategory")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("sampleTypesOtherTypes")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Beaker className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{otherTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("sampleTypesOtherCategories")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <SampleTypesList
          sampleTypes={rows}
          createAction={<AddSampleTypeButton variant="outline" size="sm" />}
          searchContent={
            <SampleTypesSearch
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
                basePath="/dashboard/test-reports/sample-types"
              />
            </div>
          )}
        </SampleTypesList>
      </div>
    </div>
  );
}
