import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser } from "@/lib/cache";
import { requestLog } from "@/lib/debug";
import { db } from "@/lib/db";
import { patients, users, departments } from "@/lib/db/schema";
import { ilike, or, gte, lte, and, sql, count, asc, desc, eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserPlus, Activity, Clock } from "lucide-react";
import { PatientList } from "./patient-list";
import { PatientSearch } from "./patient-search";
import { AddPatientButton } from "./add-patient-button";
import { SyncFullProfileFromUrl } from "./sync-full-profile-from-url";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { startOfMonth, endOfMonth, subMonths, differenceInYears } from "date-fns";
import PatientsLoading from "./loading";

function PatientsStatsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {[Users, UserPlus, Activity, Clock].map((Icon, i) => (
        <Card key={i} className="border-border/50 py-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <Skeleton className="h-3 w-24" />
            <div className="rounded-lg bg-muted p-1">
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function PatientsStatsCards({ totalCount }: { totalCount: number }) {
  const t = await getTranslations("patients");
  requestLog("patients.stats.start");
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const [
    newThisMonthList,
    newLastMonthList,
    totalLastMonthResult,
    activePatientsResult,
    allPatients,
  ] = await Promise.all([
    db.select({ id: patients.id }).from(patients).where(and(gte(patients.createdAt, monthStart), lte(patients.createdAt, monthEnd))),
    db.select({ id: patients.id }).from(patients).where(and(gte(patients.createdAt, lastMonthStart), lte(patients.createdAt, lastMonthEnd))),
    db.select({ value: count() }).from(patients).where(lte(patients.createdAt, lastMonthEnd)),
    db.select({ value: count() }).from(patients),
    db.select({ dateOfBirth: patients.dateOfBirth }).from(patients).where(sql`${patients.dateOfBirth} IS NOT NULL`),
  ]);
  requestLog("patients.stats.done");

  const newThisMonth = newThisMonthList.length;
  const newLastMonth = newLastMonthList.length;
  const totalLastMonth = Number(totalLastMonthResult[0]?.value ?? 0);
  const activePatients = Number(activePatientsResult[0]?.value ?? totalCount);
  const validAges = allPatients
    .map((p) => {
      if (!p.dateOfBirth) return null;
      const dob = new Date(p.dateOfBirth);
      if (isNaN(dob.getTime())) return null;
      return differenceInYears(now, dob);
    })
    .filter((age): age is number => age !== null && age > 0);
  const avgAge = validAges.length > 0 ? Math.round(validAges.reduce((sum, age) => sum + age, 0) / validAges.length) : 0;
  const totalGrowth = totalLastMonth > 0 ? Math.round(((totalCount - totalLastMonth) / totalLastMonth) * 100) : 100;
  const newGrowth = newLastMonth > 0 ? Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100) : 100;

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("totalPatients")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{totalCount}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">{t("vsLastMonth")}</p>
            <p className={`text-xs font-medium whitespace-nowrap ${totalGrowth >= 0 ? "text-primary" : "text-muted-foreground"}`}>
              {totalGrowth >= 0 ? "↑" : "↓"} {Math.abs(totalGrowth)}%
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("newThisMonth")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{newThisMonth}</p>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-muted-foreground">{t("vsLastMonthCount", { count: newLastMonth })}</p>
            <p className={`text-xs font-medium whitespace-nowrap ${newGrowth >= 0 ? "text-primary" : "text-muted-foreground"}`}>
              {newGrowth >= 0 ? "↑" : "↓"} {Math.abs(newGrowth)}%
            </p>
          </div>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("activePatients")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <Activity className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{activePatients}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("recentlyActive")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("avgAge")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{avgAge}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("yearsOld")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Patients | CareNova",
  robots: { index: false, follow: false },
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

interface PatientsPageSearchParams {
  q?: string;
  page?: string;
  pageSize?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  gender?: string;
  bg?: string;
  type?: "all" | "adults" | "pediatric" | "seniors";
  status?: "all" | "active" | "inactive";
  fullProfile?: string;
}

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: Promise<PatientsPageSearchParams>;
}) {
  requestLog("patients.page.start");
  const canView = await checkPermission("patients.view");
  if (!canView) redirect("/dashboard?error=no_permission");

  const user = await getCachedCurrentUser();
  requestLog("patients.page.getUser.done", user ? user.role : "null");
  if (!user) redirect("/login");

  const params = await searchParams;
  return (
    <Suspense fallback={<PatientsLoading />}>
      <PatientsContent searchParams={params} user={user} />
    </Suspense>
  );
}

async function PatientsContent({
  searchParams,
  user,
}: {
  searchParams: PatientsPageSearchParams;
  user: { id: string; role: string };
}) {
  requestLog("patients.content.start");
  try {
  const [canCreate, canEdit, canDelete, canExport] = await Promise.all([
    checkPermission("patients.create"),
    checkPermission("patients.edit"),
    checkPermission("patients.delete"),
    checkPermission("patients.export"),
  ]);

  const { q, page: pageParam, pageSize: pageSizeParam, sortBy = "createdAt", sortOrder, gender, bg, type, status } = searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSizeParam ?? "10") || 10));
  const sortOrderResolved =
    sortOrder === "desc" ? "desc" : sortOrder === "asc" ? "asc" : sortBy === "createdAt" ? "desc" : "asc";

  const typeCondition =
    type && type !== "all"
      ? type === "pediatric"
        ? sql`${patients.dateOfBirth} > (CURRENT_DATE - INTERVAL '18 years')`
        : type === "adults"
          ? and(
              sql`${patients.dateOfBirth} <= (CURRENT_DATE - INTERVAL '18 years')`,
              sql`${patients.dateOfBirth} >= (CURRENT_DATE - INTERVAL '60 years')`
            )
          : type === "seniors"
            ? sql`${patients.dateOfBirth} < (CURRENT_DATE - INTERVAL '60 years')`
            : undefined
      : undefined;

  const statusCondition =
    status && status !== "all"
      ? status === "active"
        ? sql`EXISTS (SELECT 1 FROM appointments WHERE appointments.patient_id = ${patients.id} AND appointments.start_time >= (NOW() - INTERVAL '12 months'))`
        : sql`NOT EXISTS (SELECT 1 FROM appointments WHERE appointments.patient_id = ${patients.id} AND appointments.start_time >= (NOW() - INTERVAL '12 months'))`
      : undefined;

  const whereClause = and(
    search
      ? or(
          ilike(patients.fullName, `%${search}%`),
          ilike(patients.phone, `%${search}%`)
        )
      : undefined,
    gender && gender !== "all" ? eq(patients.gender, gender) : undefined,
    bg && bg !== "all" ? eq(patients.bloodGroup, bg) : undefined,
    typeCondition,
    statusCondition
  );

  requestLog("patients.content.db.count.start");
  const [totalResult] = await db
    .select({ value: count() })
    .from(patients)
    .where(whereClause);
  requestLog("patients.content.db.count.done", String(totalResult?.value ?? 0));

  const totalCount = totalResult?.value ?? 0;
  const offset = (page - 1) * pageSize;

  requestLog("patients.content.db.list.start");
  const list = await db
    .select({
      id: patients.id,
      fullName: patients.fullName,
      dateOfBirth: patients.dateOfBirth,
      phone: patients.phone,
      email: patients.email,
      gender: patients.gender,
      bloodGroup: patients.bloodGroup,
      height: patients.height,
      weight: patients.weight,
      address: patients.address,
      medicalHistory: patients.medicalHistory,
      allergies: patients.allergies,
      emergencyContactName: patients.emergencyContactName,
      emergencyContactPhone: patients.emergencyContactPhone,
      emergencyContactRelation: patients.emergencyContactRelation,
      primaryDoctorId: patients.primaryDoctorId,
      departmentId: patients.departmentId,
      createdAt: patients.createdAt,
      updatedAt: patients.updatedAt,
      doctorName: users.fullName,
      departmentName: departments.name,
    })
    .from(patients)
    .leftJoin(users, eq(patients.primaryDoctorId, users.id))
    .leftJoin(departments, eq(patients.departmentId, departments.id))
    .where(whereClause)
    .orderBy(
      sortBy === "createdAt" ? (sortOrderResolved === "desc" ? desc(patients.createdAt) : asc(patients.createdAt)) :
      sortBy === "contact" ? (sortOrderResolved === "desc" ? desc(patients.phone) : asc(patients.phone)) :
      sortBy === "dob" ? (sortOrderResolved === "desc" ? desc(patients.dateOfBirth) : asc(patients.dateOfBirth)) :
      (sortOrderResolved === "desc" ? desc(patients.fullName) : asc(patients.fullName))
    )
    .limit(pageSize)
    .offset(offset);
  requestLog("patients.content.db.list.done", `${list.length} rows`);

  requestLog("patients.content.render.done", `total=${totalCount}`);
  const tPatients = await getTranslations("patients");
  return (
    <>
    <SyncFullProfileFromUrl fullProfileId={searchParams.fullProfile} />
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">{tPatients("title")}</h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {tPatients("descriptionExtended")}
            </p>
          </div>
          {canCreate && (
            <AddPatientButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md" />
          )}
        </div>

        {/* Stats load in separate Suspense so table and navigation aren't blocked by slow stats queries */}
        <Suspense fallback={<PatientsStatsSkeleton />}>
          <PatientsStatsCards totalCount={totalCount} />
        </Suspense>

      <div className="space-y-4">
        <PatientList
          patients={list}
          searchContent={<PatientSearch defaultValue={search} pageSize={pageSize} />}
          createAction={canCreate ? <AddPatientButton variant="outline" size="sm" /> : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
          canExport={canExport}
        >
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/patients"
              />
            </div>
          )}
        </PatientList>
      </div>
    </div>
    </>
  );
  } catch (err) {
    requestLog("patients.content.error", err instanceof Error ? err.message : String(err));
    throw err;
  }
}

