import { redirect } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { payroll, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PayrollList } from "./payroll-list";
import { Wallet, DollarSign } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { startOfMonth, endOfMonth } from "date-fns";
import { and, gte, lte, sql } from "drizzle-orm";

export default async function PayrollPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin" && user.role !== "receptionist") {
    redirect("/dashboard");
  }
  const t = await getTranslations("payroll");

  const list = await db
    .select({
      id: payroll.id,
      staffId: payroll.staffId,
      periodStart: payroll.periodStart,
      periodEnd: payroll.periodEnd,
      baseSalary: payroll.baseSalary,
      bonuses: payroll.bonuses,
      deductions: payroll.deductions,
      netAmount: payroll.netAmount,
      status: payroll.status,
      paidAt: payroll.paidAt,
      staffName: users.fullName,
    })
    .from(payroll)
    .innerJoin(users, eq(payroll.staffId, users.id))
    .orderBy(payroll.periodStart);

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const monthlyPayroll = await db
    .select({
      total: sql<number>`COALESCE(SUM(${payroll.netAmount}::numeric), 0)`,
    })
    .from(payroll)
    .where(
      and(
        eq(payroll.status, "paid"),
        gte(payroll.paidAt || payroll.createdAt, monthStart),
        lte(payroll.paidAt || payroll.createdAt, monthEnd)
      )
    );

  const monthlyTotal = Number(monthlyPayroll[0]?.total || 0);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="dashboard-page-title font-heading">{t("title")}</h1>
            <p className="dashboard-page-description text-muted-foreground">
              {t("pageDescription")}
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/dashboard/payroll/new">{t("addEntry")}</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="card-hover py-3 px-4 gap-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalEntries")}
            </CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-semibold font-heading">{list.length}</p>
          </CardContent>
        </Card>
        <Card className="card-hover py-3 px-4 gap-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0 pb-1">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("paidThisMonth")}
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
          </CardHeader>
          <CardContent className="p-0">
            <p className="text-2xl font-semibold font-heading">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format(monthlyTotal)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="font-heading text-base font-semibold">{t("payrollRecords")}</h2>
          <p className="text-xs text-muted-foreground shrink-0">
            {t("entriesCount", { count: list.length })}
          </p>
        </div>
        {list.length === 0 ? (
          <EmptyState
            icon={<Wallet className="h-6 w-6" />}
            title={t("emptyTitle")}
            description={t("emptyDescription")}
            action={
              <Button asChild>
                <Link href="/dashboard/payroll/new">{t("addEntry")}</Link>
              </Button>
            }
          />
        ) : (
          <PayrollList payroll={list} />
        )}
      </div>
    </div>
  );
}
