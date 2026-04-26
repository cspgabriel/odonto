import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCachedCurrentUser } from "@/lib/cache";
import { getLabVendorsPageData } from "@/lib/actions/lab-vendor-actions";
import { requestLog } from "@/lib/debug";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LabVendorsList } from "./lab-vendors-list";
import { LabVendorSearch } from "./lab-vendor-search";
import { AddLabVendorButton } from "./add-lab-vendor-button";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { Boxes, Users, Clock, FlaskConical } from "lucide-react";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

export default async function LabVendorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string; pageSize?: string; status?: string }>;
}) {
  requestLog("lab-vendors.page", "start");
  const user = await getCachedCurrentUser();
  requestLog("lab-vendors.page", `user=${user?.id ?? "null"} role=${user?.role ?? "n/a"}`);
  if (!user) {
    requestLog("lab-vendors.redirect", "login (no user)");
    redirect("/login");
  }
  if (user.role !== "admin") {
    requestLog("lab-vendors.redirect", `dashboard (role=${user.role}, not admin)`);
    redirect("/dashboard");
  }

  const { q, page: pageParam, pageSize: pageSizeParam, status: statusParam } = await searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSizeParam ?? "10") || 10));
  const statusFilter = statusParam ?? "all";

  requestLog("lab-vendors.page", "calling getLabVendorsPageData");
  const result = await getLabVendorsPageData({
    search,
    page,
    pageSize,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });
  requestLog("lab-vendors.page", `getLabVendorsPageData success=${result.success} hasData=${result.success && !!result.data} error=${result.success ? "n/a" : result.error ?? "unknown"}`);

  if (!result.success || !result.data) {
    requestLog("lab-vendors.redirect", `dashboard (data load failed: ${(result as { error?: string }).error ?? "no data"})`);
    redirect("/dashboard");
  }

  const { vendors, totalCount, totalVendors, activeVendors, pendingVendors, totalTests } = result.data;
  requestLog("lab-vendors.page", `render ok: ${vendors.length} vendors`);

  const t = await getTranslations("labVendors");

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
        <AddLabVendorButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90">
          + {t("addVendor")}
        </AddLabVendorButton>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("statTotal")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{totalVendors}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("statAllVendors")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("statActive")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{activeVendors}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("statActiveSub")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("statPending")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{pendingVendors}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("statAwaitingApproval")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("statTotalTests")}</CardTitle>
            <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
              <FlaskConical className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{totalTests}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("statAcrossAllVendors")}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <LabVendorsList
          vendors={vendors}
          searchContent={
            <LabVendorSearch
              defaultValue={search}
              pageSize={pageSize}
              statusFilter={statusFilter}
            />
          }
          createAction={<AddLabVendorButton variant="outline" size="sm" />}
        >
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/lab-vendors"
              />
            </div>
          )}
        </LabVendorsList>
      </div>
    </div>
  );
}
