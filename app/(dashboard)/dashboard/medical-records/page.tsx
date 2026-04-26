import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser } from "@/lib/cache";
import {
  getMedicalRecordsOverviewStats,
  getMedicalRecordsOverviewList,
} from "@/lib/actions/medical-records-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Activity, CalendarCheck, Paperclip } from "lucide-react";
import { MedicalRecordsOverviewTable } from "./_components/overview-table";
import { MedicalRecordsSearch } from "./_components/medical-records-search";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { MedicalRecordsAddMenu } from "./_components/medical-records-add-menu";
import MedicalRecordsLoading from "./loading";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export const metadata = {
  title: "Medical Records | CareNova",
  description: "Medical records overview: vitals, notes, diagnoses, attachments.",
};

function MedicalRecordsStatsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-border/50 py-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-8 rounded-lg" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <Skeleton className="h-9 w-20" />
            <Skeleton className="h-3 w-40 mt-1" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

async function MedicalRecordsStatsCards() {
  const t = await getTranslations("medicalRecords");
  const stats = await getMedicalRecordsOverviewStats();
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer text-left shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("totalRecords")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <FileText className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-3xl font-black font-heading tabular-nums text-foreground">{stats.totalRecords}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">{t("totalRecordsSub")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer text-left shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("activeCases")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-3xl font-black font-heading tabular-nums text-foreground">{stats.activeCases}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">{t("activeCasesSub")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer text-left shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("completedVisits")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-3xl font-black font-heading tabular-nums text-foreground">{stats.completedVisits}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">{t("completedVisitsSub")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer text-left shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("totalAttachments")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <Paperclip className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-3xl font-black font-heading tabular-nums text-foreground">{stats.totalAttachments}</p>
          <p className="text-xs font-semibold text-muted-foreground mt-1">{t("totalAttachmentsSub")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function MedicalRecordsOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string; sortBy?: string; sortOrder?: string; status?: string; patientId?: string }>;
}) {
  const canView = await checkPermission("medical_records.view");
  if (!canView) redirect("/dashboard?error=no_permission");

  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  const canCreate = await checkPermission("medical_records.create");
  return (
    <Suspense fallback={<MedicalRecordsLoading />}>
      <MedicalRecordsOverviewContent searchParams={await searchParams} canCreate={canCreate} />
    </Suspense>
  );
}

async function MedicalRecordsOverviewContent({
  searchParams,
  canCreate,
}: {
  searchParams: { q?: string; page?: string; pageSize?: string; sortBy?: string; sortOrder?: string; status?: string; patientId?: string };
  canCreate: boolean;
}) {
  const t = await getTranslations("medicalRecords");
  const {
    q,
    page: pageParam,
    pageSize: pageSizeParam,
    sortBy = "lastActivityAt",
    sortOrder = "desc",
    status = "all",
  } = searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(pageSizeParam ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );

  const { list, totalCount } = await getMedicalRecordsOverviewList({
    patientId: searchParams.patientId || undefined,
    q: (q ?? "").trim() || undefined,
    status: status === "all" ? undefined : (status as "active" | "completed"),
    page,
    pageSize,
    sortBy,
    sortOrder: sortOrder as "asc" | "desc",
  });

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
          <MedicalRecordsAddMenu className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-md" />
        )}
      </div>

      <Suspense fallback={<MedicalRecordsStatsSkeleton />}>
        <MedicalRecordsStatsCards />
      </Suspense>

      <div className="space-y-4">
        <MedicalRecordsOverviewTable
          list={list}
          searchContent={
            <MedicalRecordsSearch
              defaultValue={(searchParams as { q?: string }).q ?? ""}
              pageSize={pageSize}
              basePath="/dashboard/medical-records"
              showStatusFilter
              statusFilterValue={status}
            />
          }
        >
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/medical-records"
              />
            </div>
          )}
        </MedicalRecordsOverviewTable>
      </div>
    </div>
  );
}
