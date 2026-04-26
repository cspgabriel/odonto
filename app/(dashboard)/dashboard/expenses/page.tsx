import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { checkPermission } from "@/lib/auth/require-permission";
import { getCachedCurrentUser } from "@/lib/cache";
import { db } from "@/lib/db";
import { expenses, departments, users, labVendors, inventory } from "@/lib/db/schema";
import { eq, and, or, ilike, sql, count, desc, gte, lte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet, Calendar, Clock, CheckCircle } from "lucide-react";
import { ExpenseList, type ExpenseRow } from "./expense-list";
import { ExpenseSearch } from "./expense-search";
import { AddExpenseButton } from "./add-expense-button";
import { TablePagination } from "@/components/dashboard/table-pagination";
import { startOfMonth, endOfMonth } from "date-fns";

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 100;

function ExpensesStatsSkeleton() {
  return (
    <div className="grid gap-3 md:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-border/50 py-0">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <Skeleton className="h-3 w-24" />
            <div className="rounded-lg bg-muted p-1">
              <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
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
  title: "Expenses | CareNova",
  robots: { index: false, follow: false },
};

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; category?: string; page?: string; pageSize?: string }>;
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
    <Suspense fallback={<ExpensesStatsSkeleton />}>
      <ExpensesContent searchParams={params} canCreate={canCreate} canEdit={canEdit} canDelete={canDelete} />
    </Suspense>
  );
}

async function ExpensesContent({
  searchParams,
  canCreate,
  canEdit,
  canDelete,
}: {
  searchParams: { q?: string; status?: string; category?: string; page?: string; pageSize?: string };
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const { q, status: statusFilter, category: categoryFilter, page: pageParam, pageSize: pageSizeParam } = searchParams;
  const search = (q ?? "").trim();
  const page = Math.max(1, Number(pageParam ?? "1") || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSizeParam ?? String(DEFAULT_PAGE_SIZE)) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());

  const statusCondition =
    statusFilter === "paid"
      ? eq(expenses.status, "paid")
      : statusFilter === "pending"
        ? eq(expenses.status, "pending")
        : statusFilter === "cancelled"
          ? eq(expenses.status, "cancelled")
          : undefined;

  const categoryCondition = categoryFilter && categoryFilter !== "all"
    ? eq(expenses.category, categoryFilter)
    : undefined;

  const searchCondition = search
    ? or(
        ilike(expenses.title, `%${search}%`),
        ilike(expenses.vendor ?? "", `%${search}%`),
        ilike(expenses.description ?? "", `%${search}%`)
      )
    : undefined;

  const whereClause = [statusCondition, categoryCondition, searchCondition].filter(Boolean).length
    ? and(...[statusCondition, categoryCondition, searchCondition].filter(Boolean))
    : undefined;

  const baseExpenseSelect = db
    .select({
      id: expenses.id,
      title: expenses.title,
      description: expenses.description,
      amount: expenses.amount,
      category: expenses.category,
      paymentMethod: expenses.paymentMethod,
      status: expenses.status,
      date: expenses.date,
      vendor: expenses.vendor,
      departmentName: departments.name,
      submittedByName: users.fullName,
      vendorName: labVendors.name,
      inventoryName: inventory.name,
    })
    .from(expenses)
    .leftJoin(departments, eq(expenses.departmentId, departments.id))
    .leftJoin(users, eq(expenses.submittedBy, users.id))
    .leftJoin(labVendors, eq(expenses.vendorId, labVendors.id))
    .leftJoin(inventory, eq(expenses.inventoryItemId, inventory.id));

  const [
    totalResult,
    listRows,
    totalExpensesResult,
    totalAmountResult,
    monthlyAmountResult,
    monthlyCountResult,
    pendingAmountResult,
    pendingCountResult,
    paidAmountResult,
    paidCountResult,
  ] = await Promise.all([
    db.select({ value: count() }).from(expenses).where(whereClause),
    baseExpenseSelect.where(whereClause).orderBy(desc(expenses.date)).limit(pageSize).offset(offset),
    db.select({ value: count() }).from(expenses),
    db.select({ total: sql<string>`coalesce(sum(${expenses.amount})::text, '0')` }).from(expenses),
    db.select({ total: sql<string>`coalesce(sum(${expenses.amount})::text, '0')` }).from(expenses).where(and(gte(expenses.date, thisMonthStart), lte(expenses.date, thisMonthEnd))),
    db.select({ value: count() }).from(expenses).where(and(gte(expenses.date, thisMonthStart), lte(expenses.date, thisMonthEnd))),
    db.select({ total: sql<string>`coalesce(sum(${expenses.amount})::text, '0')` }).from(expenses).where(eq(expenses.status, "pending")),
    db.select({ value: count() }).from(expenses).where(eq(expenses.status, "pending")),
    db.select({ total: sql<string>`coalesce(sum(${expenses.amount})::text, '0')` }).from(expenses).where(eq(expenses.status, "paid")),
    db.select({ value: count() }).from(expenses).where(eq(expenses.status, "paid")),
  ]);

  const totalCount = Number(totalResult[0]?.value ?? 0);
  const totalExpenses = Number(totalExpensesResult[0]?.value ?? 0);
  const totalAmount = parseFloat(totalAmountResult[0]?.total ?? "0");
  const monthlyAmount = parseFloat(monthlyAmountResult[0]?.total ?? "0");
  const monthlyCount = Number(monthlyCountResult[0]?.value ?? 0);
  const pendingAmount = parseFloat(pendingAmountResult[0]?.total ?? "0");
  const pendingCount = Number(pendingCountResult[0]?.value ?? 0);
  const paidAmount = parseFloat(paidAmountResult[0]?.total ?? "0");
  const paidCount = Number(paidCountResult[0]?.value ?? 0);

  const list: ExpenseRow[] = listRows.map((r) => ({
    id: r.id,
    title: r.title,
    description: r.description,
    amount: String(r.amount),
    category: r.category,
    paymentMethod: r.paymentMethod,
    status: r.status,
    date: r.date,
    vendor: r.vendor,
    departmentName: r.departmentName,
    submittedByName: r.submittedByName,
    vendorName: r.vendorName,
    inventoryName: r.inventoryName,
  }));

  const t = await getTranslations("expenses");

  const stats = [
    { title: t("statTotalExpenses"), value: totalAmount, desc: t("statExpensesRecorded", { count: totalExpenses }), icon: Wallet, isCurrency: true },
    { title: t("statThisMonth"), value: monthlyAmount, desc: t("statExpensesThisMonth", { count: monthlyCount }), icon: Calendar, isCurrency: true },
    { title: t("statPending"), value: pendingAmount, desc: t("statPendingExpenses", { count: pendingCount }), icon: Clock, isCurrency: true },
    { title: t("statPaid"), value: paidAmount, desc: t("statPaidExpenses", { count: paidCount }), icon: CheckCircle, isCurrency: true },
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
          <AddExpenseButton className="shrink-0 h-9 px-4 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-all rounded-md" />
        )}
      </div>

      <Suspense fallback={<ExpensesStatsSkeleton />}>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{s.title}</CardTitle>
                  <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-2xl font-bold font-heading tabular-nums text-foreground">
                    {s.isCurrency && typeof s.value === "number" ? `$${s.value.toFixed(2)}` : s.value}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </Suspense>

      <div className="space-y-4">
        <ExpenseList list={list} searchContent={<ExpenseSearch defaultValue={search} pageSize={pageSize} />} canEdit={canEdit} canDelete={canDelete} createAction={canCreate ? <AddExpenseButton variant="outline" size="sm" /> : undefined}>
          {totalCount > 0 && (
            <div className="border-t border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 px-4 py-3">
              <TablePagination totalCount={totalCount} currentPage={page} pageSize={pageSize} basePath="/dashboard/expenses" />
            </div>
          )}
        </ExpenseList>
      </div>
    </div>
  );
}
