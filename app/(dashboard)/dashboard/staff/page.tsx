import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser } from "@/lib/cache";
import { getDepartments } from "@/lib/actions/department-actions";
import { getStaffPageData } from "@/lib/actions/staff-actions";
import { getPendingStaff } from "@/lib/actions/auth-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffList } from "./staff-list";
import { StaffSearch } from "./staff-search";
import { AddStaffButton } from "./add-staff-button";
import { PendingStaffCard } from "./pending-staff-card";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { Users, Stethoscope, ClipboardList, DollarSign } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string }>;
}) {
  const canView = await checkPermission("staff.view");
  if (!canView) redirect("/dashboard?error=no_permission");

  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  const [canCreate, canEdit, canDelete] = await Promise.all([
    checkPermission("staff.create"),
    checkPermission("staff.edit"),
    checkPermission("staff.delete"),
  ]);
  const { q, page: pageParam, pageSize: pageSizeParam } = await searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSizeParam ?? "10") || 10));

  const [result, pendingResult] = await Promise.all([
    getStaffPageData({ search, page, pageSize }),
    getPendingStaff(),
  ]);
  if (!result.success || !result.data) {
    redirect("/dashboard");
  }

  const { staff: staffWithDept, totalCount, totalStaff, doctorsCount, nursesCount, salaryBudget } = result.data;
  const pendingStaff = pendingResult.success ? pendingResult.data : [];

  const t = await getTranslations("staff");
  const deptResult = await getDepartments();
  const departmentsList =
    deptResult.success && deptResult.data
      ? deptResult.data.map((d) => ({ id: d.id, name: d.name }))
      : [];

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
          <AddStaffButton
            className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md"
            departments={departmentsList}
          />
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statTotal")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{totalStaff}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("statAllStaff")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statDoctors")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{doctorsCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("statPhysicians")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statNurses")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{nursesCount}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("statNursingStaff")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              {t("statSalaryBudget")}
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
              }).format(Number(salaryBudget))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t("statMonthly")}</p>
          </CardContent>
        </Card>
      </div>

      {pendingStaff.length > 0 && (
        <div className="space-y-2">
          <PendingStaffCard pending={pendingStaff} />
        </div>
      )}

      <div className="space-y-4">
        <StaffList
          staff={staffWithDept}
          searchContent={<StaffSearch defaultValue={search} pageSize={pageSize} />}
          createAction={canCreate ? <AddStaffButton variant="outline" size="sm" departments={departmentsList} /> : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
          departments={departmentsList}
        >
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/staff"
              />
            </div>
          )}
        </StaffList>
      </div>
    </div>
  );
}
