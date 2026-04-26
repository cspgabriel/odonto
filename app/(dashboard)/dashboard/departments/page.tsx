import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser } from "@/lib/cache";
import { requestLog } from "@/lib/debug";
import { db } from "@/lib/db";
import { departments, services, staff } from "@/lib/db/schema";
import { and, count, desc, eq, ilike, inArray, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, DollarSign, Users } from "lucide-react";
import { DepartmentList } from "./department-list";
import { DepartmentSearch } from "./department-search";
import { AddDepartmentButton } from "./add-department-button";
import { TablePagination } from "@/components/dashboard/table-pagination";
import DepartmentsLoading from "./loading";

export const metadata = {
  title: "Departments | CareNova",
  robots: { index: false, follow: false },
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

interface DepartmentsPageSearchParams {
  q?: string;
  status?: string;
  page?: string;
  pageSize?: string;
}

export default async function DepartmentsPage({
  searchParams,
}: {
  searchParams: Promise<DepartmentsPageSearchParams>;
}) {
  requestLog("departments.page.start");
  const canView = await checkPermission("departments.view");
  if (!canView) redirect("/dashboard?error=no_permission");

  const user = await getCachedCurrentUser();
  requestLog("departments.page.getUser.done", user ? user.role : "null");
  if (!user) redirect("/login");

  const params = await searchParams;
  return (
    <Suspense fallback={<DepartmentsLoading />}>
      <DepartmentsContent searchParams={params} />
    </Suspense>
  );
}

async function DepartmentsContent({
  searchParams,
}: {
  searchParams: DepartmentsPageSearchParams;
}) {
  const t = await getTranslations("departments");
  const q = (searchParams.q ?? "").trim();
  const status = searchParams.status ?? "all";
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.pageSize ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE)
  );

  const whereClause = and(
    q ? ilike(departments.name, `%${q}%`) : undefined,
    status !== "all" ? eq(departments.status, status) : undefined
  );

  const [countResult, listResult] = await Promise.all([
    db
      .select({ value: count() })
      .from(departments)
      .where(whereClause),
    db
      .select()
      .from(departments)
      .where(whereClause)
      .orderBy(desc(departments.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
  ]);

  const totalCount = Number(countResult[0]?.value ?? 0);
  const list = listResult;

  const departmentIds = list.map((d) => d.id);

  const [staffCountRows, serviceCountRows, totalDeptResult, activeDeptResult, totalBudgetResult, totalStaffResult] =
    await Promise.all([
      departmentIds.length > 0
        ? db
            .select({ departmentId: staff.departmentId, value: count() })
            .from(staff)
            .where(inArray(staff.departmentId, departmentIds))
            .groupBy(staff.departmentId)
        : Promise.resolve([]),
      departmentIds.length > 0
        ? db
            .select({ departmentId: services.departmentId, value: count() })
            .from(services)
            .where(inArray(services.departmentId, departmentIds))
            .groupBy(services.departmentId)
        : Promise.resolve([]),
      db.select({ value: count() }).from(departments),
      db.select({ value: count() }).from(departments).where(eq(departments.status, "active")),
      db
        .select({
          total: sql<string>`coalesce(sum(${departments.annualBudget}), 0)::text`,
        })
        .from(departments),
      db.select({ value: count() }).from(staff),
    ]);

  const staffCountMap = new Map(
    staffCountRows.map((r) => [r.departmentId, Number(r.value ?? 0)])
  );
  const serviceCountMap = new Map(
    serviceCountRows.map((r) => [r.departmentId, Number(r.value ?? 0)])
  );

  const listWithCounts = list.map((d) => ({
    ...d,
    staffCount: staffCountMap.get(d.id) ?? 0,
    servicesCount: serviceCountMap.get(d.id) ?? 0,
  }));

  const totalDepartments = Number(totalDeptResult[0]?.value ?? 0);
  const activeDepartments = Number(activeDeptResult[0]?.value ?? 0);
  const totalBudget = parseFloat(totalBudgetResult[0]?.total ?? "0");
  const totalStaff = Number(totalStaffResult[0]?.value ?? 0);
  requestLog("departments.content.done", `list=${list.length} total=${totalCount}`);

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
        <AddDepartmentButton
          className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md"
          staffCount={totalStaff}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statTotal")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
              {totalDepartments}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">{t("statTotalLabel")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statActive")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
              {activeDepartments}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">{t("statActiveLabel")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statStaff")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
              {totalStaff}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">{t("statStaffLabel")}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statBudget")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              }).format(totalBudget)}
            </p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-muted-foreground">{t("statBudgetLabel")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <DepartmentList
          departments={listWithCounts}
          searchContent={
            <DepartmentSearch defaultValue={q} statusValue={status} pageSize={pageSize} />
          }
          createAction={<AddDepartmentButton variant="outline" size="sm" staffCount={totalStaff} />}
        >
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/departments"
              />
            </div>
          )}
        </DepartmentList>
      </div>
    </div>
  );
}
