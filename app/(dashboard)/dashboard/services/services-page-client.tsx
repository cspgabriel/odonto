"use client";

import { useState } from "react";
import { useTranslations } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServicesList } from "./services-list";
import { AddServiceDialog } from "./add-service-dialog";
import { ServiceSearch } from "./service-search";
import { Stethoscope, Activity, Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { TablePagination } from "@/components/dashboard/table-pagination";

/** List item shape from services page query (subset of full service row) */
export type ServiceListItem = {
  id: string;
  name: string;
  description: string | null;
  price: string;
  duration: number;
  departmentId: string | null;
  status: string;
  category: string | null;
  departmentName: string | null;
};

interface SearchParams {
  q?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  department?: string;
  status?: string;
}

interface ServicesPageClientProps {
  list: ServiceListItem[];
  departments: { id: string; name: string }[];
  stats: {
    totalServices: number;
    activeServices: number;
    activeDepartments: number;
  };
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  searchParams?: SearchParams;
}

export function ServicesPageClient({
  list,
  departments,
  stats,
  canCreate = false,
  canEdit = false,
  canDelete = false,
  searchParams,
}: ServicesPageClientProps) {
  const t = useTranslations("services");
  const [dialogOpen, setDialogOpen] = useState(false);
  const page = searchParams?.page ?? 1;
  const pageSize = searchParams?.pageSize ?? 10;
  const totalCount = stats.totalServices;

  return (
    <>
      <div className="flex flex-col gap-4 pt-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
              {t("title")}
            </h1>
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {t("pageDescription")}
            </p>
          </div>
          {canCreate && (
            <Button
              className="shrink-0 h-9 px-4 text-sm font-semibold"
              onClick={() => setDialogOpen(true)}
            >
              {t("addService")}
            </Button>
          )}
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {t("statTotal")}
              </CardTitle>
              <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
                <Stethoscope className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
                {stats.totalServices}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("statTotalLabel")}</p>
            </CardContent>
          </Card>
          <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {t("statActive")}
              </CardTitle>
              <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
                <Activity className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
                {stats.activeServices}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("statActiveLabel")}</p>
            </CardContent>
          </Card>
          <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {t("statDepartments")}
              </CardTitle>
              <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
                {stats.activeDepartments}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{t("statDeptLabel")}</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {list.length === 0 ? (
            <EmptyState
              icon={<Stethoscope className="h-6 w-6" />}
              title={t("emptyTitle")}
              description={t("emptyDescription")}
              action={canCreate ? <Button onClick={() => setDialogOpen(true)}>{t("addService")}</Button> : undefined}
            />
          ) : (
            <ServicesList
              services={list}
              departments={departments}
              canCreate={canCreate}
              canEdit={canEdit}
              canDelete={canDelete}
              searchContent={
                <ServiceSearch
                  defaultValue={searchParams?.q ?? ""}
                  pageSize={pageSize}
                  departments={departments}
                  action={
                    canCreate ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDialogOpen(true)}
                      >
                        {t("addService")}
                      </Button>
                    ) : undefined
                  }
                />
              }
            >
              {totalCount > 0 && (
                <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
                  <TablePagination
                    totalCount={totalCount}
                    currentPage={page}
                    pageSize={pageSize}
                    basePath="/dashboard/services"
                  />
                </div>
              )}
            </ServicesList>
          )}
        </div>
      </div>

      {canCreate && (
        <AddServiceDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          departments={departments}
        />
      )}
    </>
  );
}
