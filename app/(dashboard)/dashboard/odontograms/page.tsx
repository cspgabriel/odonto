import React from "react";
import { getTranslations } from "next-intl/server";
import { getOdontograms } from "@/lib/actions/odontogram-actions";
import { format } from "date-fns";
import { OdontogramClient } from "./odontogram-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, Stethoscope, DollarSign } from "lucide-react";
import { NewOdontogramButton } from "./new-odontogram-button";
import { db } from "@/lib/db";
import { odontograms, patients, users } from "@/lib/db/schema";
import { ilike, or, and, count, asc, desc, eq } from "drizzle-orm";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { OdontogramSearch } from "./odontogram-search";
import { getCurrentUser } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/require-permission";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Odontograms | CareNova",
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export default async function OdontogramsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string; sortBy?: string; sortOrder?: string; status?: string }>;
}) {
  const canView = await checkPermission("odontogram.view");
  if (!canView) redirect("/dashboard?error=no_permission");

  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { q, page: pageParam, pageSize: pageSizeParam, sortBy, sortOrder, status } = await searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(pageSizeParam ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );

  // Build where only when we have filters; otherwise show all odontograms
  const conditions: Parameters<typeof and>[0][] = [];
  if (search) conditions.push(or(ilike(patients.fullName, `%${search}%`)));
  if (status && status !== "all") conditions.push(eq(odontograms.status, status));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const countQuery = db
    .select({ value: count() })
    .from(odontograms)
    .leftJoin(patients, eq(odontograms.patientId, patients.id));
  const [totalResult] = whereClause
    ? await countQuery.where(whereClause)
    : await countQuery;

  const totalCount = totalResult?.value ?? 0;
  const offset = (page - 1) * pageSize;

  const dataQuery = db
    .select({
      id: odontograms.id,
      patientId: odontograms.patientId,
      doctorId: odontograms.doctorId,
      status: odontograms.status,
      version: odontograms.version,
      examinedAt: odontograms.examinedAt,
      toothData: odontograms.toothData,
      diagnosis: odontograms.diagnosis,
      notes: odontograms.notes,
      treatments: odontograms.treatments,
      patientName: patients.fullName,
      doctorName: users.fullName,
      createdAt: odontograms.createdAt,
    })
    .from(odontograms)
    .leftJoin(patients, eq(odontograms.patientId, patients.id))
    .leftJoin(users, eq(odontograms.doctorId, users.id));
  const data = await (whereClause ? dataQuery.where(whereClause) : dataQuery)
    .orderBy(
      sortBy === "patientName" ? (sortOrder === "desc" ? desc(patients.fullName) : asc(patients.fullName)) :
      sortBy === "doctorName" ? (sortOrder === "desc" ? desc(users.fullName) : asc(users.fullName)) :
      sortBy === "examinedAt" ? (sortOrder === "desc" ? desc(odontograms.examinedAt) : asc(odontograms.examinedAt)) :
      desc(odontograms.createdAt)
    )
    .limit(pageSize)
    .offset(offset);

  // Aggregate treatment stats from all odontograms for dashboard cards (cancelled excluded from completion %)
  const allTreatmentsRows = await db.select({ treatments: odontograms.treatments }).from(odontograms);
  let activeTotal = 0;
  let completedTreatments = 0;
  let activeTreatmentsCount = 0;
  for (const row of allTreatmentsRows) {
    const treatments = Array.isArray(row.treatments) ? row.treatments : [];
    for (const t of treatments) {
      const status = (t as { status?: string })?.status;
      if (status === "cancelled") continue;
      activeTotal += 1;
      if (status === "completed") completedTreatments += 1;
      if (status === "in_progress") activeTreatmentsCount += 1;
    }
  }
  const completionRatePct = activeTotal === 0 ? 0 : Math.round((completedTreatments / activeTotal) * 100);

  const t = await getTranslations("odontograms");

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
        <NewOdontogramButton />
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer text-left shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("statTotalPatients")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-black font-heading tabular-nums text-foreground">
              {totalCount}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {t("statWithRecords")}
            </p>
          </CardContent>
        </Card>

        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer text-left shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("statCompletionRate")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-black font-heading tabular-nums text-foreground">
              {completionRatePct}%
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {t("statTreatmentCompletion")}
            </p>
          </CardContent>
        </Card>

        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer text-left shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("statActiveTreatments")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-black font-heading tabular-nums text-foreground">
              {activeTreatmentsCount}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {t("statInProgress")}
            </p>
          </CardContent>
        </Card>

        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer text-left shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("statTotalRevenue")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-black font-heading tabular-nums text-foreground">
              $12,450
            </p>
            <p className="text-xs font-semibold text-primary mt-1">
              {t("statRevenueGrowth")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <OdontogramClient 
          initialData={data} 
          searchContent={<OdontogramSearch defaultValue={search} pageSize={pageSize} />}
        >
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/odontograms"
              />
            </div>
          )}
        </OdontogramClient>
      </div>
    </div>
  );
}
