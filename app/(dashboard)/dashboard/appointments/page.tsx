import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser } from "@/lib/cache";
import type { UserRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { appointments, patients, users, services, invoices } from "@/lib/db/schema";
import { eq, or, ilike, and, count, desc, asc, gte, lte } from "drizzle-orm";
import { getDepartments } from "@/lib/actions/department-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, CheckCircle, Clock } from "lucide-react";
import AppointmentsLoading from "./loading";
import { AppointmentList } from "./appointment-list";
import { BookAppointmentButton } from "./book-appointment-button";
import { AppointmentSearch } from "./appointment-search";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata = {
  title: "Appointments | CareNova",
  robots: { index: false, follow: false },
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;
const VALID_STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;

function AppointmentsStatsSkeleton() {
  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="border-border/50 py-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent className="space-y-1 px-4 pb-4">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20 mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function AppointmentsStatsCards({ totalCount }: { totalCount: number }) {
  const t = await getTranslations("appointments");
  const [completedCountResult] = await db
    .select({ value: count(appointments.id) })
    .from(appointments)
    .where(eq(appointments.status, "completed"));
  const completedCount = completedCountResult?.value ?? 0;
  const pendingCount = totalCount - completedCount;

  return (
    <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("total")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1 px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{totalCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("title")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("completed")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1 px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{completedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("completed")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("pending")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="space-y-1 px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("waitingPending")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{
    doctorId?: string;
    patientId?: string;
    departmentId?: string;
    q?: string;
    status?: string;
    date?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortOrder?: string;
    edit?: string;
  }>;
}) {
  const canView = await checkPermission("appointments.view");
  if (!canView) redirect("/dashboard?error=no_permission");

  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  const [canCreate, canEdit, canDelete, canExport, canViewBilling] = await Promise.all([
    checkPermission("appointments.create"),
    checkPermission("appointments.edit"),
    checkPermission("appointments.delete"),
    checkPermission("appointments.export"),
    checkPermission("billing.view"),
  ]);
  const params = await searchParams;
  return (
    <Suspense fallback={<AppointmentsLoading />}>
      <AppointmentsContent
        searchParams={params}
        user={user}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
        canExport={canExport}
        canViewBilling={canViewBilling}
      />
    </Suspense>
  );
}

async function AppointmentsContent({
  searchParams,
  user,
  canCreate,
  canEdit,
  canDelete,
  canExport,
  canViewBilling,
}: {
  searchParams: {
    doctorId?: string;
    patientId?: string;
    departmentId?: string;
    q?: string;
    status?: string;
    date?: string;
    page?: string;
    pageSize?: string;
    sortBy?: string;
    sortOrder?: string;
    edit?: string;
  };
  user: { id: string; role: UserRole };
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
  canViewBilling: boolean;
}) {
  const { doctorId, patientId, departmentId, q, status: statusParam, page: pageParam, pageSize: pageSizeParam } =
    searchParams;
  const search = (q ?? "").trim();
  const status =
    statusParam && VALID_STATUSES.includes(statusParam as (typeof VALID_STATUSES)[number])
      ? (statusParam as (typeof VALID_STATUSES)[number])
      : undefined;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(pageSizeParam ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );

  const { sortBy = "createdAt", sortOrder = "desc", date: dateFilter } = searchParams;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000 - 1);
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
  const endOfTomorrow = new Date(startOfTomorrow.getTime() + 24 * 60 * 60 * 1000 - 1);
  const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);

  let dateCondition = undefined;
  if (dateFilter === "today") {
    dateCondition = and(gte(appointments.startTime, startOfToday), lte(appointments.startTime, endOfToday));
  } else if (dateFilter === "tomorrow") {
    dateCondition = and(gte(appointments.startTime, startOfTomorrow), lte(appointments.startTime, endOfTomorrow));
  } else if (dateFilter === "this_week") {
    dateCondition = and(gte(appointments.startTime, startOfToday), lte(appointments.startTime, endOfWeek));
  }

  const departmentCondition = departmentId
    ? or(
        eq(users.departmentId, departmentId),
        eq(services.departmentId, departmentId)
      )
    : undefined;

  const baseConditions = [
    doctorId ? eq(appointments.doctorId, doctorId) : undefined,
    patientId ? eq(appointments.patientId, patientId) : undefined,
    status ? eq(appointments.status, status) : undefined,
    dateCondition,
    departmentCondition,
  ].filter(Boolean);

  const searchCondition = search
    ? or(
        ilike(patients.fullName, `%${search}%`),
        ilike(users.fullName, `%${search}%`)
      )
    : undefined;

  const whereClause =
    baseConditions.length > 0
      ? searchCondition
        ? and(...baseConditions, searchCondition)
        : and(...baseConditions)
      : searchCondition ?? undefined;

  const [totalResult] = await db
    .select({ value: count(appointments.id) })
    .from(appointments)
    .leftJoin(patients, eq(appointments.patientId, patients.id))
    .leftJoin(users, eq(appointments.doctorId, users.id))
    .leftJoin(services, eq(appointments.serviceId, services.id))
    .where(whereClause);

  const totalCount = totalResult?.value ?? 0;
  const offset = (page - 1) * pageSize;

  const [list, doctors, departments] = await Promise.all([
    db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        patientId: appointments.patientId,
        doctorId: appointments.doctorId,
        serviceId: appointments.serviceId,
        patient: { fullName: patients.fullName },
        doctor: { fullName: users.fullName, specialization: users.specialization },
        serviceName: services.name,
        serviceDuration: services.duration,
        invoiceId: invoices.id,
      })
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(users, eq(appointments.doctorId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .leftJoin(invoices, eq(appointments.id, invoices.appointmentId))
      .where(whereClause)
      .orderBy(
        sortBy === "createdAt" ? (sortOrder === "asc" ? asc(appointments.createdAt) : desc(appointments.createdAt)) :
        sortBy === "patient" ? (sortOrder === "asc" ? asc(patients.fullName) : desc(patients.fullName)) :
        sortBy === "doctor" ? (sortOrder === "asc" ? asc(users.fullName) : desc(users.fullName)) :
        sortBy === "status" ? (sortOrder === "asc" ? asc(appointments.status) : desc(appointments.status)) :
        (sortOrder === "asc" ? asc(appointments.startTime) : desc(appointments.startTime))
      )
      .limit(pageSize)
      .offset(offset),
    db.select({ id: users.id, fullName: users.fullName }).from(users).where(eq(users.role, "doctor")),
    getDepartments().then((r) => (r.success && r.data ? r.data : [])),
  ]);

  const tPage = await getTranslations("appointments");

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">{tPage("title")}</h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            {tPage("description")}
          </p>
        </div>
        {canCreate && (
          <BookAppointmentButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md" />
        )}
      </div>
      <Suspense fallback={<AppointmentsStatsSkeleton />}>
        <AppointmentsStatsCards totalCount={totalCount} />
      </Suspense>

      <div className="space-y-4">
        <AppointmentList
          appointments={list}
          doctors={doctors}
          currentDoctorId={doctorId}
          currentUserId={user.id}
          initialEditId={searchParams.edit}
          canEdit={canEdit}
          canDelete={canDelete}
          canViewBilling={canViewBilling}
          canExport={canExport}
          searchContent={
            <AppointmentSearch
              defaultValue={search}
              doctorId={doctorId}
              patientId={patientId}
              departmentId={departmentId}
              status={status}
              page={page}
              pageSize={pageSize}
              doctors={doctors}
              departments={departments}
            />
          }
        >
          <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-[#0B0B1E] px-4 py-3">
            <TablePagination
              totalCount={totalCount}
              currentPage={page}
              pageSize={pageSize}
              basePath="/dashboard/appointments"
            />
          </div>
        </AppointmentList>
      </div>
    </div>
  );
}
