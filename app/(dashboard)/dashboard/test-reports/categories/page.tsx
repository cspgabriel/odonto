import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { testCategories } from "@/lib/db/schema";
import { eq, ilike, or, and, count, desc } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Folder, Layers, Building2, Activity } from "lucide-react";
import { CategoriesList } from "./categories-list";
import { AddCategoryButton } from "./add-category-button";
import { CategoriesSearch } from "./categories-search";
import { TablePagination } from "@/components/dashboard/table-pagination";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string; department?: string; status?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("testReports");

  const { q, page: pageParam, pageSize: pageSizeParam, department, status } = await searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(pageSizeParam ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );

  const whereClause = and(
    search ? or(ilike(testCategories.name, `%${search}%`)) : undefined,
    status && status !== "all" ? eq(testCategories.isActive, status === "active" ? 1 : 0) : undefined
  );

  const [totalResult] = await db
    .select({ value: count() })
    .from(testCategories)
    .where(whereClause);

  const totalCount = totalResult?.value ?? 0;
  const offset = (page - 1) * pageSize;

  const list = await db
    .select()
    .from(testCategories)
    .where(whereClause)
    .orderBy(desc(testCategories.createdAt))
    .limit(pageSize)
    .offset(offset);

  const [activeCount, totalResultAll] = await Promise.all([
    db.select({ value: count() }).from(testCategories).where(eq(testCategories.isActive, 1)),
    db.select({ value: count() }).from(testCategories),
  ]);

  const activeTotal = activeCount[0]?.value ?? 0;
  const categoriesTotal = totalResultAll[0]?.value ?? 0;

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("categoriesTitle")}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t("categoriesPageDescription")}
          </p>
        </div>
        <AddCategoryButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md" />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("categoriesTotalCategories")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Folder className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{categoriesTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{activeTotal} {t("categoriesActiveSub")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("categoriesActiveCategories")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Activity className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{activeTotal}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("categoriesCurrentlyActive")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("categoriesTotalTests")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">0</p>
            <p className="text-xs text-muted-foreground mt-1">{t("categoriesAcrossAll")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("categoriesDepartments")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">3</p>
            <p className="text-xs text-muted-foreground mt-1">{t("categoriesDifferentDepartments")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <CategoriesList
          categories={list}
          createAction={<AddCategoryButton variant="outline" size="sm" />}
          searchContent={
            <CategoriesSearch
              defaultValue={search}
              pageSize={pageSize}
              department={department ?? "all"}
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
                basePath="/dashboard/test-reports/categories"
              />
            </div>
          )}
        </CategoriesList>
      </div>
    </div>
  );
}
