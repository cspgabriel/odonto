import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCachedCurrentUser } from "@/lib/cache";
import { db } from "@/lib/db";
import {
  departments,
  services,
  staff,
  inventory,
  labVendors,
} from "@/lib/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Stethoscope,
  Users,
  Package,
  FlaskConical,
  ArrowRight,
  AlertTriangle,
  LayoutGrid,
  Shield,
} from "lucide-react";

export const metadata = {
  title: "Operations Overview | CareNova",
  robots: { index: false, follow: false },
};

export default async function OperationsPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");
  if (!["admin", "doctor", "nurse", "receptionist"].includes(user.role))
    redirect("/dashboard");
  const t = await getTranslations("operations");

  const [
    deptCounts,
    servicesCounts,
    staffCounts,
    inventoryStats,
    labVendorCount,
    salaryTotal,
    budgetTotal,
  ] = await Promise.all([
    Promise.all([
      db.select({ value: count() }).from(departments),
      db.select({ value: count() }).from(departments).where(eq(departments.status, "active")),
    ]),
    Promise.all([
      db.select({ value: count() }).from(services),
      db.select({ value: count() }).from(services).where(eq(services.status, "active")),
    ]),
    Promise.all([
      db.select({ value: count() }).from(staff),
      db.select({ value: count() }).from(staff).where(eq(staff.status, "active")),
    ]),
    Promise.all([
      db.select({ value: count() }).from(inventory),
      db
        .select({
          totalValue: sql<string>`coalesce(sum(${inventory.quantity} * coalesce(${inventory.price}, 0)), 0)::text`,
        })
        .from(inventory),
      db
        .select({ value: count() })
        .from(inventory)
        .where(
          sql`${inventory.quantity} > 0 AND ${inventory.quantity} <= coalesce(${inventory.minStock}, 0)`
        ),
    ]),
    db.select({ value: count() }).from(labVendors).where(eq(labVendors.status, "active")),
    db
      .select({
        total: sql<string>`coalesce(sum(${staff.salary})::text, '0')`,
      })
      .from(staff),
    db
      .select({
        total: sql<string>`coalesce(sum(${departments.annualBudget}), 0)::text`,
      })
      .from(departments),
  ]);

  const totalDepts = Number(deptCounts[0]?.[0]?.value ?? 0);
  const activeDepts = Number(deptCounts[1]?.[0]?.value ?? 0);
  const totalServices = Number(servicesCounts[0]?.[0]?.value ?? 0);
  const activeServices = Number(servicesCounts[1]?.[0]?.value ?? 0);
  const totalStaff = Number(staffCounts[0]?.[0]?.value ?? 0);
  const activeStaff = Number(staffCounts[1]?.[0]?.value ?? 0);
  const totalInventory = Number(inventoryStats[0]?.[0]?.value ?? 0);
  const inventoryValue = parseFloat(inventoryStats[1]?.[0]?.totalValue ?? "0");
  const lowStockCount = Number(inventoryStats[2]?.[0]?.value ?? 0);
  const totalLabVendors = Number(labVendorCount[0]?.value ?? 0);
  const totalSalary = parseFloat(salaryTotal[0]?.total ?? "0");
  const totalBudget = parseFloat(budgetTotal[0]?.total ?? "0");

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(n);

  const sections = [
    {
      title: t("departments"),
      href: "/dashboard/departments",
      icon: Building2,
      stats: [
        { label: t("statTotal"), value: totalDepts },
        { label: t("statActive"), value: activeDepts },
        { label: t("statAnnualBudget"), value: formatCurrency(totalBudget) },
      ],
      roles: ["admin", "doctor", "nurse", "receptionist"],
    },
    {
      title: t("services"),
      href: "/dashboard/services",
      icon: Stethoscope,
      stats: [
        { label: t("statTotal"), value: totalServices },
        { label: t("statActive"), value: activeServices },
      ],
      roles: ["admin", "doctor", "nurse", "receptionist"],
    },
    {
      title: t("staff"),
      href: "/dashboard/staff",
      icon: Users,
      stats: [
        { label: t("statTotal"), value: totalStaff },
        { label: t("statActive"), value: activeStaff },
        { label: t("statSalaryBudget"), value: formatCurrency(totalSalary) },
      ],
      roles: ["admin"],
    },
    {
      title: t("inventory"),
      href: "/dashboard/inventory",
      icon: Package,
      stats: [
        { label: t("statItems"), value: totalInventory },
        { label: t("statTotalValue"), value: formatCurrency(inventoryValue) },
        { label: t("statLowStock"), value: lowStockCount, alert: lowStockCount > 0 },
      ],
      roles: ["admin", "doctor", "nurse"],
    },
    {
      title: t("labVendors"),
      href: "/dashboard/lab-vendors",
      icon: FlaskConical,
      stats: [{ label: t("statActiveVendors"), value: totalLabVendors }],
      roles: ["admin"],
    },
  ].filter((s) => s.roles.includes(user.role));

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      <div className="pt-4">
        <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
          {t("title")}
        </h1>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card
              key={section.href}
              className="group relative overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20"
            >
              <Link href={section.href} className="block">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {section.title}
                  </CardTitle>
                  <div className="rounded-lg bg-muted p-2 group-hover:bg-primary/10 transition-colors">
                    <Icon className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {section.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">{stat.label}</span>
                        <span
                          className={`font-semibold tabular-nums ${
                            stat.alert ? "text-amber-600 dark:text-amber-500" : ""
                          }`}
                        >
                          {typeof stat.value === "number" && stat.alert ? (
                            <span className="flex items-center gap-1">
                              <AlertTriangle className="h-3.5 w-3.5" />
                              {stat.value}
                            </span>
                          ) : (
                            stat.value
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-1 text-xs font-medium text-primary">
                    <span>{t("manage")}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>

      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            {t("summaryTitle")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("totalBudgetDepartments")}</p>
              <p className="text-lg font-bold tabular-nums">{formatCurrency(totalBudget)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("salaryStaff")}</p>
              <p className="text-lg font-bold tabular-nums">{formatCurrency(totalSalary)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("inventoryValue")}</p>
              <p className="text-lg font-bold tabular-nums">
                {formatCurrency(inventoryValue)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("lowStockAlerts")}</p>
              <p
                className={`text-lg font-bold tabular-nums ${
                  lowStockCount > 0 ? "text-amber-600 dark:text-amber-500" : ""
                }`}
              >
                {lowStockCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {user.role === "admin" && (
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/permissions">
              <Shield className="mr-2 h-3.5 w-3.5" />
              {t("permissions")}
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}
