import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  invoices,
  invoiceItems,
  appointments,
  patients,
  users,
  services,
  departments,
} from "@/lib/db/schema";
import { eq, and, or, ilike, sql, count, desc, lt, gte, lte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, DollarSign, CreditCard, AlertCircle, CheckCircle } from "lucide-react";
import { InvoiceList, type InvoiceRow } from "./invoice-list";
import { InvoiceSearch } from "./invoice-search";
import { AddInvoiceButton } from "./add-invoice-button";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { startOfMonth, endOfMonth, startOfDay } from "date-fns";
import InvoicesLoading from "./loading";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function InvoicesStatsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} className="border-border/50 py-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <Skeleton className="h-3 w-24" />
            <div className="rounded-lg bg-muted p-1">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
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

export const metadata = {
  title: "Invoices | CareNova",
  robots: { index: false, follow: false },
};

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string; pageSize?: string; patientId?: string; appointmentId?: string }>;
}) {
  const canView = await checkPermission("billing.view");
  if (!canView) redirect("/dashboard?error=no_permission");

  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  const [canCreate, canEdit, canDelete, canExport] = await Promise.all([
    checkPermission("billing.create"),
    checkPermission("billing.edit"),
    checkPermission("billing.delete"),
    checkPermission("billing.export"),
  ]);
  const params = await searchParams;
  return (
    <Suspense fallback={<InvoicesLoading />}>
      <InvoicesContent searchParams={params} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} canExport={canExport} />
    </Suspense>
  );
}

async function InvoicesContent({
  searchParams,
  canCreate,
  canEdit,
  canDelete,
  canExport,
}: {
  searchParams: { q?: string; status?: string; page?: string; pageSize?: string; patientId?: string; appointmentId?: string };
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExport: boolean;
}) {
  const { q, status: statusFilter, page: pageParam, pageSize: pageSizeParam, patientId: patientIdParam, appointmentId: appointmentIdParam } = searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSizeParam ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;
  const todayStart = startOfDay(new Date());
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());

  const baseInvoice = db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      issuedAt: invoices.issuedAt,
      dueAt: invoices.dueAt,
      patientId: patients.id,
      patientName: patients.fullName,
      patientEmail: patients.email,
      patientPhone: patients.phone,
      doctorName: users.fullName,
      serviceName: services.name,
      serviceCategory: services.category,
      departmentName: departments.name,
    })
    .from(invoices)
    .leftJoin(appointments, eq(invoices.appointmentId, appointments.id))
    .leftJoin(patients, sql`${patients.id} = coalesce(${invoices.patientId}, ${appointments.patientId})`)
    .leftJoin(users, eq(invoices.doctorId, users.id))
    .leftJoin(services, eq(invoices.serviceId, services.id))
    .leftJoin(departments, eq(services.departmentId, departments.id));

  const statusCondition =
    statusFilter === "paid"
      ? eq(invoices.status, "paid")
      : statusFilter === "unpaid"
        ? eq(invoices.status, "unpaid")
        : statusFilter === "overdue"
          ? and(eq(invoices.status, "unpaid"), lt(invoices.dueAt, todayStart))
          : statusFilter === "cancelled"
            ? eq(invoices.status, "cancelled")
            : undefined;

  const searchCondition = search
    ? or(
        ilike(patients.fullName, `%${search}%`),
        ilike(invoices.invoiceNumber ?? "", `%${search}%`)
      )
    : undefined;

  const patientCondition = patientIdParam
    ? or(eq(invoices.patientId, patientIdParam), eq(appointments.patientId, patientIdParam))
    : undefined;
  const appointmentCondition = appointmentIdParam
    ? eq(invoices.appointmentId, appointmentIdParam)
    : undefined;

  const whereClause = [statusCondition, searchCondition, patientCondition, appointmentCondition].filter(Boolean).length
    ? and(...[statusCondition, searchCondition, patientCondition, appointmentCondition].filter(Boolean))
    : undefined;

  const [totalResult, listRows, itemCountRows, totalInvoicesResult, totalRevenueResult, monthlyRevenueResult, paidCountResult, overdueCountResult] =
    await Promise.all([
      db
        .select({ value: count() })
        .from(invoices)
        .leftJoin(appointments, eq(invoices.appointmentId, appointments.id))
        .leftJoin(patients, sql`${patients.id} = coalesce(${invoices.patientId}, ${appointments.patientId})`)
        .where(whereClause),
      baseInvoice
        .where(whereClause)
        .orderBy(desc(invoices.issuedAt))
        .limit(pageSize)
        .offset(offset),
      db
        .select({ invoiceId: invoiceItems.invoiceId, cnt: count() })
        .from(invoiceItems)
        .groupBy(invoiceItems.invoiceId),
      db.select({ value: count() }).from(invoices),
      db
        .select({ total: sql<string>`coalesce(sum(${invoices.totalAmount})::text, '0')` })
        .from(invoices)
        .where(eq(invoices.status, "paid")),
      db
        .select({ total: sql<string>`coalesce(sum(${invoices.totalAmount})::text, '0')` })
        .from(invoices)
        .where(
          and(
            eq(invoices.status, "paid"),
            gte(invoices.issuedAt, thisMonthStart),
            lte(invoices.issuedAt, thisMonthEnd)
          )
        ),
      db.select({ value: count() }).from(invoices).where(eq(invoices.status, "paid")),
      db
        .select({ value: count() })
        .from(invoices)
        .where(and(eq(invoices.status, "unpaid"), lt(invoices.dueAt, todayStart))),
    ]);

  const totalCount = Number(totalResult[0]?.value ?? 0);
  const totalInvoices = Number(totalInvoicesResult[0]?.value ?? 0);
  const totalRevenue = parseFloat(totalRevenueResult[0]?.total ?? "0");
  const monthlyRevenue = parseFloat(monthlyRevenueResult[0]?.total ?? "0");
  const paidCount = Number(paidCountResult[0]?.value ?? 0);
  const overdueCount = Number(overdueCountResult[0]?.value ?? 0);

  const countMap = new Map<string, number>();
  for (const r of itemCountRows) {
    if (r.invoiceId) countMap.set(r.invoiceId, Number(r.cnt ?? 0));
  }

  const list: InvoiceRow[] = listRows.map((r) => ({
    id: r.id,
    invoiceNumber: r.invoiceNumber,
    totalAmount: String(r.totalAmount),
    status: r.status,
    issuedAt: r.issuedAt,
    dueAt: r.dueAt,
    patientId: r.patientId ?? null,
    patientName: r.patientName,
    patientEmail: r.patientEmail,
    patientPhone: r.patientPhone,
    doctorName: r.doctorName,
    serviceName: r.serviceName,
    departmentName: r.departmentName,
    itemCount: countMap.get(r.id) ?? 0,
  }));

  const t = await getTranslations("invoices");

  const stats = [
    { title: t("statTotal"), value: String(totalInvoices), desc: t("statAllInvoices"), icon: FileText },
    { title: t("statTotalRevenue"), value: totalRevenue, desc: t("statAllTimeEarnings"), icon: DollarSign, isCurrency: true },
    { title: t("statMonthlyRevenue"), value: monthlyRevenue, desc: t("statThisMonth"), icon: CreditCard, isCurrency: true },
    { title: t("statPaid"), value: String(paidCount), desc: t("statCompletedPayments"), icon: CheckCircle },
    { title: t("statOverdue"), value: String(overdueCount), desc: t("statNeedsAttention"), icon: AlertCircle },
  ];

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
          <AddInvoiceButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md" />
        )}
      </div>

      <Suspense fallback={<InvoicesStatsSkeleton />}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card
                key={s.title}
                className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer"
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {s.title}
                  </CardTitle>
                  <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
                    {s.isCurrency && typeof s.value === "number"
                      ? `$${s.value.toFixed(2)}`
                      : s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Suspense>

      <div className="space-y-4">
        <InvoiceList
          list={list}
          searchContent={<InvoiceSearch defaultValue={search} pageSize={pageSize} canExport={canExport} />}
          createAction={canCreate ? <AddInvoiceButton variant="outline" size="sm" /> : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        >
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination
                totalCount={totalCount}
                currentPage={page}
                pageSize={pageSize}
                basePath="/dashboard/invoices"
              />
            </div>
          )}
        </InvoiceList>
      </div>
    </div>
  );
}
