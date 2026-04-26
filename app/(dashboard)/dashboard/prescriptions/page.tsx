import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser } from "@/lib/cache";
import { db } from "@/lib/db";
import { prescriptions, patients, users } from "@/lib/db/schema";
import { eq, ilike, or, count, desc, asc, gte, and } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PrescriptionsList } from "./prescriptions-list";
import { PrescriptionsSearch } from "./prescriptions-search";
import { AddPrescriptionButton } from "./add-prescription-button";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { FileText, CheckCircle, Clock, Package } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function PrescriptionsStatsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-border/50 py-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <Skeleton className="h-4 w-32" />
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

async function PrescriptionsStatsCards({ totalCount }: { totalCount: number }) {
  const t = await getTranslations("prescriptions");
  const now = new Date();
  const d7 = new Date(now.getTime() - 7 * 864e5);
  const d60 = new Date(now.getTime() - 60 * 864e5);
  const [activeRes, dispensedRes] = await Promise.all([
    db.select({ value: count(prescriptions.id) }).from(prescriptions).where(gte(prescriptions.issuedAt, d7)),
    db.select({ value: count(prescriptions.id) }).from(prescriptions).where(gte(prescriptions.issuedAt, d60)),
  ]);
  const activeCount = activeRes[0]?.value ?? 0;
  const dispensedCount = Math.max(0, (dispensedRes[0]?.value ?? 0) - activeCount);
  const pendingCount = Math.max(0, totalCount - activeCount - dispensedCount);

  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("statTotal")}</CardTitle>
          <div className="rounded-lg bg-muted p-1"><FileText className="h-3.5 w-3.5 text-muted-foreground" /></div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{totalCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("statAllTime")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("statActive")}</CardTitle>
          <div className="rounded-lg bg-muted p-1"><CheckCircle className="h-3.5 w-3.5 text-emerald-500" /></div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{activeCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("statLast7Days")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("statPending")}</CardTitle>
          <div className="rounded-lg bg-muted p-1"><Clock className="h-3.5 w-3.5 text-amber-500" /></div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{pendingCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("statAwaitingPickup")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("statDispensed")}</CardTitle>
          <div className="rounded-lg bg-muted p-1"><Package className="h-3.5 w-3.5 text-blue-500" /></div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{dispensedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("statFilledPharmacy")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function PrescriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string; status?: string; medication?: string; doctorId?: string; patientId?: string;
    dateRange?: string; page?: string; pageSize?: string; sortBy?: string; sortOrder?: string;
  }>;
}) {
  const canView = await checkPermission("prescriptions.view");
  if (!canView) redirect("/dashboard?error=no_permission");

  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  const {
    q, status: statusParam, medication: medicationParam, doctorId: doctorIdParam, patientId: patientIdParam,
    dateRange, page: pageParam, pageSize: pageSizeParam, sortBy = "createdAt", sortOrder = "desc"
  } = await searchParams;

  const search = (q ?? "").trim();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(pageSizeParam ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  const [canCreate, canEdit, canDelete] = await Promise.all([
    checkPermission("prescriptions.create"),
    checkPermission("prescriptions.edit"),
    checkPermission("prescriptions.delete"),
  ]);

  // ── Fetch doctors and patients for forms ────────────────────────────────
  const [allDoctors, allPatients] = await Promise.all([
    db.select({ id: users.id, fullName: users.fullName }).from(users).where(eq(users.role, "doctor")).orderBy(users.fullName),
    db.select({ id: patients.id, fullName: patients.fullName }).from(patients).orderBy(patients.fullName),
  ]);

  const now = new Date();
  const totalResult = await db.select({ value: count(prescriptions.id) }).from(prescriptions);
  const totalCount = totalResult[0]?.value ?? 0;

  // ── Filters ─────────────────────────────────────────────────────────────
  const conditions = [];
  if (search) {
    conditions.push(or(
      ilike(patients.fullName, `%${search}%`),
      ilike(prescriptions.medication, `%${search}%`),
      ilike(users.fullName, `%${search}%`)
    ));
  }
  if (medicationParam) conditions.push(ilike(prescriptions.medication, `%${medicationParam}%`));
  if (doctorIdParam) conditions.push(eq(prescriptions.doctorId, doctorIdParam));
  if (patientIdParam) conditions.push(eq(prescriptions.patientId, patientIdParam));
  if (dateRange) {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
    conditions.push(gte(prescriptions.issuedAt, new Date(now.getTime() - days * 864e5)));
  }

  const whereClause = conditions.length > 0 ? and(...(conditions as any[])) : undefined;

  const orderCol =
    sortBy === "createdAt" ? (sortOrder === "desc" ? desc(prescriptions.createdAt) : asc(prescriptions.createdAt)) :
    sortBy === "patient" ? (sortOrder === "desc" ? desc(patients.fullName) : asc(patients.fullName)) :
    sortBy === "doctor"  ? (sortOrder === "desc" ? desc(users.fullName)    : asc(users.fullName))    :
                           (sortOrder === "desc" ? desc(prescriptions.issuedAt) : asc(prescriptions.issuedAt));

  const [countRes] = await db
    .select({ value: count(prescriptions.id) })
    .from(prescriptions)
    .innerJoin(patients, eq(prescriptions.patientId, patients.id))
    .innerJoin(users, eq(prescriptions.doctorId, users.id))
    .where(whereClause as any);

  const filteredTotal = countRes?.value ?? 0;

  const t = await getTranslations("prescriptions");
  const list = await db
    .select({
      id: prescriptions.id,
      patientId: prescriptions.patientId,
      doctorId: prescriptions.doctorId,
      appointmentId: prescriptions.appointmentId,
      medication: prescriptions.medication,
      dosage: prescriptions.dosage,
      instructions: prescriptions.instructions,
      frequency: prescriptions.frequency,
      duration: prescriptions.duration,
      drugInteractions: prescriptions.drugInteractions,
      pharmacyName: prescriptions.pharmacyName,
      pharmacyAddress: prescriptions.pharmacyAddress,
      issuedAt: prescriptions.issuedAt,
      updatedAt: prescriptions.updatedAt,
      patientName: patients.fullName,
      patientPhone: patients.phone,
      patientEmail: patients.email,
      patientDob: patients.dateOfBirth,
      patientGender: patients.gender,
      doctorName: users.fullName,
      doctorSpecialization: users.specialization,
    })
    .from(prescriptions)
    .innerJoin(patients, eq(prescriptions.patientId, patients.id))
    .innerJoin(users, eq(prescriptions.doctorId, users.id))
    .where(whereClause as any)
    .orderBy(orderCol)
    .limit(pageSize)
    .offset(offset);

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">{t("title")}</h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t("pageDescription")}
          </p>
        </div>
        {canCreate && (
          <AddPrescriptionButton
            doctors={allDoctors}
            patients={allPatients}
            className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md"
          />
        )}
      </div>

      <Suspense fallback={<PrescriptionsStatsSkeleton />}>
        <PrescriptionsStatsCards totalCount={totalCount} />
      </Suspense>

      {/* Table */}
      <div className="space-y-4 mt-3">
        <PrescriptionsList
          prescriptions={list}
          doctors={allDoctors}
          patients={allPatients}
          canCreate={canCreate}
          canEdit={canEdit}
          canDelete={canDelete}
          searchContent={
            <PrescriptionsSearch
              defaultValue={search}
              pageSize={pageSize}
              doctors={allDoctors}
            />
          }
        >
          {filteredTotal > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={filteredTotal}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/prescriptions"
              />
            </div>
          )}
        </PrescriptionsList>
      </div>
    </div>
  );
}
