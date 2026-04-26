import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { getVitalsList, getVitalsStats } from "@/lib/actions/medical-records-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { VitalsTable } from "../_components/vitals-table";
import { MedicalRecordsSearch } from "../_components/medical-records-search";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { AddVitalsButton } from "../_components/add-vitals-button";
import VitalsLoading from "./loading";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export const metadata = {
  title: "Vitals | Medical Records | CareNova",
  description: "Blood pressure, heart rate, temperature, weight, height, BMI.",
};

export default async function VitalsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string; sortBy?: string; sortOrder?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <Suspense fallback={<VitalsLoading />}>
      <VitalsContent searchParams={await searchParams} />
    </Suspense>
  );
}

async function VitalsContent({
  searchParams,
}: {
  searchParams: { q?: string; page?: string; pageSize?: string; sortBy?: string; sortOrder?: string };
}) {
  const { q, page: pageParam, pageSize: pageSizeParam, sortBy = "recordedAt", sortOrder = "desc" } = searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(pageSizeParam ?? String(DEFAULT_PAGE_SIZE), 10) || DEFAULT_PAGE_SIZE)
  );

  const t = await getTranslations("medicalRecords");
  const [stats, { list, totalCount }] = await Promise.all([
    getVitalsStats(),
    getVitalsList({
      q: (q ?? "").trim() || undefined,
      page,
      pageSize,
      sortBy,
      sortOrder: sortOrder as "asc" | "desc",
    }),
  ]);

  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            {t("vitalsTitle")}
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
            {t("vitalsDescription")}
          </p>
        </div>
        <AddVitalsButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm rounded-md" />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer text-left shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("totalVitals")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-black font-heading tabular-nums text-foreground">
              {stats.total}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {t("recordedEntries")}
            </p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer text-left shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {t("thisMonth")}
            </CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-3xl font-black font-heading tabular-nums text-foreground">
              {stats.thisMonth}
            </p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">
              {t("recordedThisMonth")}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <VitalsTable
          list={list}
          searchContent={
            <MedicalRecordsSearch
              defaultValue={q ?? ""}
              pageSize={pageSize}
              basePath="/dashboard/medical-records/vitals"
              placeholder={t("searchByPatientOrPhone")}
            />
          }
        >
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/medical-records/vitals"
              />
            </div>
          )}
        </VitalsTable>
      </div>
    </div>
  );
}
