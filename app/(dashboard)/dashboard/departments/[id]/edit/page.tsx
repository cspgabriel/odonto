import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { getDepartmentById, getDepartmentFinancialSummary } from "@/lib/actions/department-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UpdateDepartmentForm } from "./update-department-form";
import { RevenueValue } from "@/app/(dashboard)/dashboard/_components/revenue-value";

export default async function EditDepartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") redirect("/dashboard/departments");

  const t = await getTranslations("departments");
  const { id } = await params;
  const [deptResult, financialResult] = await Promise.all([
    getDepartmentById(id),
    getDepartmentFinancialSummary(id),
  ]);
  if (!deptResult.success || !deptResult.data) notFound();
  const department = deptResult.data;
  const financial = financialResult.success ? financialResult.data : null;
  const revenue = financial ? parseFloat(financial.revenue) : 0;
  const expensesVal = financial ? parseFloat(financial.expenses) : 0;
  const netVal = financial ? parseFloat(financial.net) : 0;
  const invoiceCount = financial?.invoiceCount ?? 0;
  const expenseCount = financial?.expenseCount ?? 0;

  return (
    <div className="dashboard-page max-w-lg space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/dashboard/departments">{t("backToDepartments")}</Link>
      </Button>
      <Card className="py-0">
        <CardHeader className="pt-4 pb-2">
          <CardTitle className="font-heading">{t("editDepartmentPageTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <UpdateDepartmentForm department={department} />
        </CardContent>
      </Card>
      {financial && (
        <Card className="border-border/50 py-0">
          <CardHeader className="pt-4 pb-2">
            <CardTitle className="font-heading text-base">{t("financialOverview")}</CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-slate-200/60 dark:border-slate-800/60 p-3">
                <p className="text-xs font-medium text-muted-foreground">{t("revenue")}</p>
                <p className="text-xl font-bold font-heading tabular-nums mt-1">
                  <RevenueValue value={revenue} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("invoiceCount", { count: invoiceCount })}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200/60 dark:border-slate-800/60 p-3">
                <p className="text-xs font-medium text-muted-foreground">{t("expenses")}</p>
                <p className="text-xl font-bold font-heading tabular-nums mt-1">
                  <RevenueValue value={expensesVal} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("expenseCount", { count: expenseCount })}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200/60 dark:border-slate-800/60 p-3">
                <p className="text-xs font-medium text-muted-foreground">{t("net")}</p>
                <p className={`text-xl font-bold font-heading tabular-nums mt-1 ${netVal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  <RevenueValue value={netVal} />
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {netVal >= 0 ? t("profit") : t("loss")}
                </p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/invoices">{t("viewInvoices")}</Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/dashboard/expenses">{t("viewExpenses")}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
