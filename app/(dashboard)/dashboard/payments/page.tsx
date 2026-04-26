import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser } from "@/lib/cache";
import { db } from "@/lib/db";
import { payments, patients, invoices } from "@/lib/db/schema";
import { eq, and, or, ilike, sql, count, desc, asc, gte, lte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, DollarSign, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { PaymentList } from "./payment-list";
import { PaymentSearch } from "./payment-search";
import { AddPaymentButton } from "./add-payment-button";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { startOfMonth, endOfMonth } from "date-fns";
import PaymentsLoading from "./loading";

function PaymentsStatsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
      {[CreditCard, DollarSign, TrendingUp, CheckCircle, XCircle].map((Icon, i) => (
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

async function PaymentsStatsCards({
  totalPayments,
  totalRevenue,
  monthRevenue,
  successfulCount,
  failedCount,
}: {
  totalPayments: number;
  totalRevenue: number;
  monthRevenue: number;
  successfulCount: number;
  failedCount: number;
}) {
  const t = await getTranslations("payments");
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("statTotalPayments")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{totalPayments}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("statAllRecords")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("statTotalRevenue")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalRevenue)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t("statPaidInvoices")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("statThisMonth")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(monthRevenue)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{t("statCurrentMonth")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("statSuccessful")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <CheckCircle className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{successfulCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("statCompleted")}</p>
        </CardContent>
      </Card>
      <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
          <CardTitle className="text-xs font-medium text-muted-foreground">{t("statFailed")}</CardTitle>
          <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
            <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <p className="text-2xl font-bold font-heading tabular-nums text-foreground">{failedCount}</p>
          <p className="text-xs text-muted-foreground mt-1">{t("statCancelledFailed")}</p>
        </CardContent>
      </Card>
    </div>
  );
}

export const metadata = {
  title: "Payments | CareNova",
  robots: { index: false, follow: false },
};

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

interface PaymentsPageSearchParams {
  q?: string;
  page?: string;
  pageSize?: string;
  status?: string;
  method?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<PaymentsPageSearchParams>;
}) {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "receptionist") redirect("/dashboard");

  const [canCreate, canEdit, canDelete] = await Promise.all([
    checkPermission("billing.create"),
    checkPermission("billing.edit"),
    checkPermission("billing.delete"),
  ]);
  const params = await searchParams;
  return (
    <Suspense fallback={<PaymentsLoading />}>
      <PaymentsContent searchParams={params} user={user} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
    </Suspense>
  );
}

/** Transaction ID: use stored value or derive from id. */
function resolveTransactionId(transactionId: string | null, id: string): string {
  if (transactionId?.trim()) return transactionId.trim();
  return id.replace(/-/g, "").slice(-12).toUpperCase();
}

async function PaymentsContent({
  searchParams,
  user,
  canCreate,
  canEdit,
  canDelete,
}: {
  searchParams: PaymentsPageSearchParams;
  user: { id: string; role: string };
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const { q, page: pageParam, pageSize: pageSizeParam, status: statusFilter, method: methodFilter, sortBy = "createdAt", sortOrder } = searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSizeParam ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;
  const orderDir = sortOrder === "asc" ? asc : desc;
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const statusCondition =
    statusFilter === "completed"
      ? eq(payments.status, "completed")
      : statusFilter === "pending"
        ? eq(payments.status, "pending")
        : statusFilter === "failed"
          ? eq(payments.status, "failed")
          : undefined;

  const methodCondition =
    methodFilter && methodFilter !== "all"
      ? eq(payments.paymentMethod, methodFilter)
      : undefined;

  const searchCondition = search
    ? or(
        ilike(patients.fullName, `%${search}%`),
        ilike(invoices.invoiceNumber ?? "", `%${search}%`),
        ilike(payments.transactionId ?? "", `%${search}%`),
        ilike(payments.description, `%${search}%`)
      )
    : undefined;

  const whereClause =
    [statusCondition, methodCondition, searchCondition].filter(Boolean).length > 0
      ? and(
          ...([statusCondition, methodCondition, searchCondition].filter(Boolean) as NonNullable<typeof statusCondition>[])
        )
      : undefined;

  const baseQuery = db
    .select({
      id: payments.id,
      patientId: payments.patientId,
      invoiceId: payments.invoiceId,
      amount: payments.amount,
      paymentMethod: payments.paymentMethod,
      transactionId: payments.transactionId,
      description: payments.description,
      status: payments.status,
      createdAt: payments.createdAt,
      patientName: patients.fullName,
      invoiceNumber: invoices.invoiceNumber,
    })
    .from(payments)
    .leftJoin(patients, eq(payments.patientId, patients.id))
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id));

  const [countResult, listRows, totalPaymentsResult, totalRevenueResult, monthRevenueResult, successfulResult, failedResult] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(payments)
        .leftJoin(patients, eq(payments.patientId, patients.id))
        .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
        .where(whereClause),
      baseQuery
        .where(whereClause)
        .orderBy(
          sortBy === "createdAt" ? orderDir(payments.createdAt) :
          sortBy === "amount" ? orderDir(payments.amount) :
          sortBy === "status" ? orderDir(payments.status) :
          orderDir(payments.createdAt)
        )
        .limit(pageSize)
        .offset(offset),
      db.select({ value: count() }).from(payments),
      db.select({ total: sql<string>`coalesce(sum(${payments.amount})::text, '0')` }).from(payments),
      db
        .select({ total: sql<string>`coalesce(sum(${payments.amount})::text, '0')` })
        .from(payments)
        .where(
          and(
            eq(payments.status, "completed"),
            gte(payments.createdAt, monthStart),
            lte(payments.createdAt, monthEnd)
          )
        ),
      db.select({ value: count() }).from(payments).where(eq(payments.status, "completed")),
      db.select({ value: count() }).from(payments).where(eq(payments.status, "failed")),
    ]);

  const totalCountFinal = Number(countResult[0]?.value ?? 0);
  const totalPayments = Number(totalPaymentsResult[0]?.value ?? 0);
  const totalRevenue = parseFloat(totalRevenueResult[0]?.total ?? "0");
  const monthRevenue = parseFloat(monthRevenueResult[0]?.total ?? "0");
  const successfulCount = Number(successfulResult[0]?.value ?? 0);
  const failedCount = Number(failedResult[0]?.value ?? 0);

  const t = await getTranslations("payments");

  const list = listRows.map((r) => ({
    id: r.id,
    patientId: r.patientId,
    invoiceId: r.invoiceId,
    invoiceNumber: r.invoiceNumber,
    amount: r.amount,
    paymentMethod: r.paymentMethod,
    transactionId: resolveTransactionId(r.transactionId, r.id),
    rawTransactionId: r.transactionId,
    description: r.description,
    status: r.status,
    createdAt: r.createdAt,
    patientName: r.patientName,
  }));

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
          <AddPaymentButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md" />
        )}
      </div>

      <Suspense fallback={<PaymentsStatsSkeleton />}>
        <PaymentsStatsCards
          totalPayments={totalPayments}
          totalRevenue={totalRevenue}
          monthRevenue={monthRevenue}
          successfulCount={successfulCount}
          failedCount={failedCount}
        />
      </Suspense>

      <div className="space-y-4">
        <PaymentList
          payments={list}
          searchContent={<PaymentSearch defaultValue={search} pageSize={pageSize} />}
          canEdit={canEdit}
          canDelete={canDelete}
        >
          {totalCountFinal > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCountFinal}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/payments"
              />
            </div>
          )}
        </PaymentList>
      </div>
    </div>
  );
}
