import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { getCachedCurrentUser } from "@/lib/cache";
import { getAuthUser, type UserRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  patients,
  appointments,
  invoices,
  users,
  inventory,
  expenses,
} from "@/lib/db/schema";
import { sql, eq, and, gte, lt, lte, desc, asc } from "drizzle-orm";
import { FullProfileButton } from "@/components/dashboard/full-profile-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
} from "date-fns";
import {
  formatTimeWithLocale,
  formatMonthWithLocale,
} from "@/lib/preferences/format";
import {
  DEFAULT_LOCALE,
  VALID_LOCALES,
  type LocaleCode,
} from "@/lib/preferences/constants";
import {
  Calendar,
  Users,
  DollarSign,
  ArrowRight,
  FileText,
  ClipboardList,
  Stethoscope,
  AlertTriangle,
  Wallet,
} from "lucide-react";
import { RevenueChart } from "./_components/revenue-chart";
import { RevenueValue } from "./_components/revenue-value";
import { AppointmentStatusChart } from "./_components/appointment-status-chart";
import { ActivityChart } from "./_components/activity-chart";
import { OverdueWarningBanner } from "./_components/overdue-warning-banner";
import { getTranslations } from "next-intl/server";

export const metadata = {
  title: "Dashboard | CareNova",
  robots: { index: false, follow: false },
};

/** Always fetch fresh data so the dashboard reflects current state. */
export const dynamic = "force-dynamic";
export const revalidate = 0;

type DashboardUser = {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
};

const fallbackRoles: UserRole[] = ["admin", "doctor", "receptionist", "nurse"];

function getFallbackRole(authUser: Awaited<ReturnType<typeof getAuthUser>>): UserRole {
  const role =
    authUser?.user_metadata?.role ??
    authUser?.app_metadata?.role ??
    authUser?.user_metadata?.user_role ??
    authUser?.app_metadata?.user_role;

  return typeof role === "string" && fallbackRoles.includes(role as UserRole)
    ? (role as UserRole)
    : "admin";
}

function getFallbackDashboardUser(authUser: NonNullable<Awaited<ReturnType<typeof getAuthUser>>>): DashboardUser {
  const fullName =
    typeof authUser.user_metadata?.full_name === "string"
      ? authUser.user_metadata.full_name
      : typeof authUser.user_metadata?.name === "string"
        ? authUser.user_metadata.name
        : authUser.email?.split("@")[0] ?? "User";

  return {
    id: authUser.id,
    fullName,
    email: authUser.email ?? "",
    role: getFallbackRole(authUser),
  };
}

export default async function DashboardPage() {
  const pageT0 = Date.now();
  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+0ms | page.start`);
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - pageT0}ms | page.getCachedCurrentUser.start`);
  }
  let user: DashboardUser | null = null;
  try {
    user = await Promise.race([
      getCachedCurrentUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Current user timeout after 8s")), 8000)
      ),
    ]);
  } catch (error) {
    console.error("[Dashboard] Current user load failed:", error);
  }

  if (!user) {
    const authUser = await getAuthUser().catch(() => null);
    if (authUser?.id) {
      user = getFallbackDashboardUser(authUser);
    }
  }
  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - pageT0}ms | page.getCachedCurrentUser.done | ${user ? `role=${user.role}` : "null"}`);
  }
  if (!user) redirect("/login");

  let loadError: string | null = null;
  let dashboardContent: ReactNode = null;

  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - pageT0}ms | page.loadDashboardContent.start`);
  }
  try {
    dashboardContent = await Promise.race([
      loadDashboardContent(user, pageT0),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("Dashboard data timeout after 90s")),
          90000
        )
      ),
    ]);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Unknown error";
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - pageT0}ms | page.loadDashboardContent.error | ${loadError}`);
    }
    console.error("[Dashboard] Data load failed:", loadError);
  }

  if (loadError || !dashboardContent) {
    const t = await getTranslations("errors");
    return (
      <div className="space-y-6 p-4 md:p-6">
        <Card className="border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <AlertTriangle className="h-5 w-5" />
              Dashboard em modo limitado
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-amber-900/80 dark:text-amber-100/80">
            <p>{t("loadError")}</p>
            <p className="font-mono text-xs">{loadError ?? t("unknown")}</p>
          </CardContent>
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "Pacientes", href: "/dashboard/patients", icon: Users },
            { title: "Agendamentos", href: "/dashboard/appointments", icon: Calendar },
            { title: "Financeiro", href: "/dashboard/invoices", icon: DollarSign },
            { title: "Configurações", href: "/dashboard/settings", icon: ClipboardList },
          ].map((item) => (
            <Card key={item.href} className="transition hover:border-primary/50 hover:shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <item.icon className="h-5 w-5 text-primary" />
                  {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full justify-between">
                  <Link href={item.href}>
                    Abrir módulo
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - pageT0}ms | page.render.done`);
  }
  return dashboardContent;
}

async function loadDashboardContent(
  user: DashboardUser,
  traceT0: number
) {
  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.cookies.start`);
  }
  const cookieStore = await cookies();
  const preferredLocale =
    cookieStore.get("preferred_locale")?.value ?? DEFAULT_LOCALE;
  const locale: LocaleCode = (VALID_LOCALES as readonly string[]).includes(
    preferredLocale
  )
    ? (preferredLocale as LocaleCode)
    : DEFAULT_LOCALE;

  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.cookies.done | locale=${locale}`);
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.getTranslations.start`);
  }
  const t = await getTranslations("dashboard");
  const tStatus = await getTranslations("status");
  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.getTranslations.done`);
  }

  const today = startOfDay(new Date());
  const todayEnd = endOfDay(new Date());

  // Role-specific dashboards (non-admin)
  if (user.role === "doctor") {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=doctor | Promise.all.start`);
    }
    const thisMonthStart = startOfMonth(new Date());
    const thisMonthEnd = endOfMonth(new Date());
    const [
      patientsCountResult,
      myAppointmentsTotalResult,
      todayAppointmentsResult,
      completedResult,
      newPatientsThisMonthResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(patients),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointments)
        .where(eq(appointments.doctorId, user.id)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointments)
        .where(
          and(
            eq(appointments.doctorId, user.id),
            gte(appointments.startTime, today),
            lt(appointments.startTime, todayEnd)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointments)
        .where(
          and(
            eq(appointments.doctorId, user.id),
            eq(appointments.status, "completed")
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(patients)
        .where(
          and(
            gte(patients.createdAt, thisMonthStart),
            lte(patients.createdAt, thisMonthEnd)
          )
        ),
    ]);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=doctor | Promise.all(5).done`);
    }
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=doctor | todaySchedule.query.start`);
    }
    const todaySchedule = await db
      .select({
        id: appointments.id,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        patientName: patients.fullName,
        patientId: patients.id,
      })
      .from(appointments)
      .innerJoin(patients, eq(appointments.patientId, patients.id))
      .where(
        and(
          eq(appointments.doctorId, user.id),
          gte(appointments.startTime, today),
          lt(appointments.startTime, todayEnd)
        )
      )
      .orderBy(appointments.startTime)
      .limit(10);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=doctor | todaySchedule.query.done | recentPatients.query.start`);
    }
    const [recentPatients, upcomingAppointments] = await Promise.all([
      db
        .select({ id: patients.id, fullName: patients.fullName })
        .from(patients)
        .orderBy(desc(patients.updatedAt))
        .limit(5),
      db
        .select({
          id: appointments.id,
          startTime: appointments.startTime,
          endTime: appointments.endTime,
          status: appointments.status,
          patientName: patients.fullName,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .where(
          and(
            eq(appointments.doctorId, user.id),
            gte(appointments.startTime, todayEnd)
          )
        )
        .orderBy(appointments.startTime)
        .limit(5),
    ]);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=doctor | recentPatients.query.done`);
    }

    const totalPatients = patientsCountResult[0]?.count ?? 0;
    const todayCount = todayAppointmentsResult[0]?.count ?? 0;
    const completedCount = completedResult[0]?.count ?? 0;
    const newPatientsCount = newPatientsThisMonthResult[0]?.count ?? 0;

    const tDoctor = await getTranslations("dashboard.doctor");
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=doctor | render.done`);
    }
    return (
      <div className="dashboard-page">
        <div className="dashboard-page-header">
          <h1 className="dashboard-page-title font-heading">{tDoctor("title")}</h1>
          <p className="dashboard-page-description text-muted-foreground">
            {tDoctor("description", { name: user.fullName })}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tDoctor("todayAppointments")}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-2xl font-semibold font-heading">{todayCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("admin.scheduledToday")}</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tDoctor("completed")}
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-2xl font-semibold font-heading">{completedCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{tDoctor("totalCompleted")}</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tDoctor("newPatients")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-2xl font-semibold font-heading">{newPatientsCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{tDoctor("thisMonth")}</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tDoctor("totalPatients")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-2xl font-semibold font-heading">{totalPatients}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("admin.activePatients")}</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-base font-semibold font-heading">
                {tDoctor("todaySchedule")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {todaySchedule.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">{tDoctor("noAppointmentsToday")}</p>
              ) : (
                <ul className="space-y-3">
                  {todaySchedule.map((apt) => (
                    <li
                      key={apt.id}
                      className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{apt.patientName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatTimeWithLocale(apt.startTime, locale)} –{" "}
                          {formatTimeWithLocale(apt.endTime, locale)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {tStatus(apt.status)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-base font-semibold font-heading">
                {tDoctor("recentPatients")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {recentPatients.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">{t("admin.noPatients")}</p>
              ) : (
                <ul className="space-y-2">
                  {recentPatients.map((p) => (
                    <li key={p.id}>
                      <FullProfileButton
                        patientId={p.id}
                        variant="ghost"
                        className="font-medium hover:underline p-0 h-auto"
                      >
                        {p.fullName}
                      </FullProfileButton>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-base font-semibold font-heading">
                {t("admin.upcomingAppointments")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {upcomingAppointments.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">{t("admin.noAppointments")}</p>
              ) : (
                <ul className="space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <li
                      key={apt.id}
                      className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{apt.patientName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatTimeWithLocale(apt.startTime, locale)} –{" "}
                          {formatTimeWithLocale(apt.endTime, locale)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {tStatus(apt.status)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (user.role === "receptionist") {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=receptionist | Promise.all.start`);
    }
    const [patientsCount, appointmentsTodayResult, unpaidCount, todayScheduleRec, recentPatientsRec, recentUnpaidInvoices] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(patients),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointments)
        .where(
          and(
            gte(appointments.startTime, today),
            lt(appointments.startTime, todayEnd)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(invoices)
        .where(eq(invoices.status, "unpaid")),
      db
        .select({
          id: appointments.id,
          startTime: appointments.startTime,
          endTime: appointments.endTime,
          status: appointments.status,
          patientName: patients.fullName,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .where(
          and(
            gte(appointments.startTime, today),
            lt(appointments.startTime, todayEnd)
          )
        )
        .orderBy(appointments.startTime)
        .limit(10),
      db
        .select({ id: patients.id, fullName: patients.fullName })
        .from(patients)
        .orderBy(desc(patients.updatedAt))
        .limit(5),
      db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          totalAmount: invoices.totalAmount,
        })
        .from(invoices)
        .where(eq(invoices.status, "unpaid"))
        .orderBy(desc(invoices.createdAt))
        .limit(5),
    ]);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=receptionist | Promise.all.done`);
    }
    const todayCount = appointmentsTodayResult[0]?.count ?? 0;
    const unpaid = unpaidCount[0]?.count ?? 0;
    const tReceptionist = await getTranslations("dashboard.receptionist");
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=receptionist | render.done`);
    }
    return (
      <div className="dashboard-page">
        <div className="dashboard-page-header">
          <h1 className="dashboard-page-title font-heading">{tReceptionist("title")}</h1>
          <p className="dashboard-page-description text-muted-foreground">
            {tReceptionist("description", { name: user.fullName })}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tReceptionist("todayAppointments")}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-2xl font-semibold font-heading">{todayCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("admin.scheduledToday")}</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tReceptionist("patients")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-2xl font-semibold font-heading">{patientsCount[0]?.count ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("admin.activePatients")}</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tReceptionist("billingQueue")}
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-2xl font-semibold font-heading">{unpaid}</p>
              <p className="text-xs text-muted-foreground mt-1">{tReceptionist("unpaid")}</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-base font-semibold font-heading">
                {tReceptionist("todayAppointments")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {todayScheduleRec.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">{t("admin.noAppointments")}</p>
              ) : (
                <ul className="space-y-3">
                  {todayScheduleRec.map((apt) => (
                    <li
                      key={apt.id}
                      className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{apt.patientName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatTimeWithLocale(apt.startTime, locale)} –{" "}
                          {formatTimeWithLocale(apt.endTime, locale)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {tStatus(apt.status)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-base font-semibold font-heading">
                {t("admin.recentPatients")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {recentPatientsRec.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">{t("admin.noPatients")}</p>
              ) : (
                <ul className="space-y-2">
                  {recentPatientsRec.map((p) => (
                    <li key={p.id}>
                      <FullProfileButton
                        patientId={p.id}
                        variant="ghost"
                        className="font-medium hover:underline p-0 h-auto"
                      >
                        {p.fullName}
                      </FullProfileButton>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-base font-semibold font-heading">
                {t("admin.recentUnpaidInvoices")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {recentUnpaidInvoices.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">{t("admin.noUnpaidInvoices")}</p>
              ) : (
                <ul className="space-y-2">
                  {recentUnpaidInvoices.map((inv) => (
                    <li key={inv.id} className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0">
                      <span className="font-medium truncate">{inv.invoiceNumber}</span>
                      <span className="text-sm tabular-nums"><RevenueValue value={Number(inv.totalAmount)} /></span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (user.role === "nurse") {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=nurse | Promise.all.start`);
    }
    const [
      patientsCount,
      appointmentsCount,
      lowStockCountResult,
      todayScheduleNurse,
      recentPatientsNurse,
      lowStockItems,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(patients),
      db.select({ count: sql<number>`count(*)::int` }).from(appointments),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(inventory)
        .where(
          and(
            eq(inventory.status, "active"),
            lte(inventory.quantity, inventory.minStock)
          )
        ),
      db
        .select({
          id: appointments.id,
          startTime: appointments.startTime,
          endTime: appointments.endTime,
          status: appointments.status,
          patientName: patients.fullName,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .where(
          and(
            gte(appointments.startTime, today),
            lt(appointments.startTime, todayEnd)
          )
        )
        .orderBy(appointments.startTime)
        .limit(10),
      db
        .select({ id: patients.id, fullName: patients.fullName })
        .from(patients)
        .orderBy(desc(patients.updatedAt))
        .limit(5),
      db
        .select({
          id: inventory.id,
          name: inventory.name,
          quantity: inventory.quantity,
          minStock: inventory.minStock,
          unit: inventory.unit,
        })
        .from(inventory)
        .where(
          and(
            eq(inventory.status, "active"),
            lte(inventory.quantity, inventory.minStock)
          )
        )
        .limit(5),
    ]);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=nurse | Promise.all.done`);
    }
    const lowStockCount = lowStockCountResult[0]?.count ?? 0;
    const tNurse = await getTranslations("dashboard.nurse");
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=nurse | render.done`);
    }
    return (
      <div className="dashboard-page">
        <div className="dashboard-page-header">
          <h1 className="dashboard-page-title font-heading">{tNurse("title")}</h1>
          <p className="dashboard-page-description text-muted-foreground">
            {tNurse("description", { name: user.fullName })}
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tNurse("patients")}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-2xl font-semibold font-heading">{patientsCount[0]?.count ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("admin.activePatients")}</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tNurse("appointments")}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-2xl font-semibold font-heading">{appointmentsCount[0]?.count ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("admin.scheduledToday")}</p>
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {tNurse("clinical")}
              </CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-sm text-muted-foreground mt-1">{tNurse("testResultsSoon")}</p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-base font-semibold font-heading">
                {t("admin.todayAppointments")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {todayScheduleNurse.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">{t("admin.noAppointments")}</p>
              ) : (
                <ul className="space-y-3">
                  {todayScheduleNurse.map((apt) => (
                    <li
                      key={apt.id}
                      className="flex items-center justify-between gap-2 border-b border-border py-2 last:border-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate">{apt.patientName}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {formatTimeWithLocale(apt.startTime, locale)} –{" "}
                          {formatTimeWithLocale(apt.endTime, locale)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0">
                        {tStatus(apt.status)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-base font-semibold font-heading">
                {t("admin.recentPatients")}
              </CardTitle>
            </CardHeader>
            <CardContent className="px-6">
              {recentPatientsNurse.length === 0 ? (
                <p className="py-4 text-sm text-muted-foreground">{t("admin.noPatients")}</p>
              ) : (
                <ul className="space-y-2">
                  {recentPatientsNurse.map((p) => (
                    <li key={p.id}>
                      <FullProfileButton
                        patientId={p.id}
                        variant="ghost"
                        className="font-medium hover:underline p-0 h-auto"
                      >
                        {p.fullName}
                      </FullProfileButton>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
          <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pb-2">
              <CardTitle className="text-base font-semibold font-heading">
                {t("admin.lowStock")}
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-6">
              <p className="text-2xl font-semibold font-heading">{lowStockCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("admin.needAttention")}</p>
              {lowStockItems.length > 0 ? (
                <ul className="mt-3 space-y-2 border-t border-border pt-3">
                  {lowStockItems.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{item.name}</span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {item.quantity} / {item.minStock} {item.unit}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </CardContent>
          </Card>
        </div>
        <Card className="rounded-[var(--radius)] border border-dashed py-6 shadow-sm">
          <CardHeader className="px-6">
            <CardTitle className="text-base font-semibold font-heading">{tNurse("patientCareTasks")}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{tNurse("inventoryAlerts")}</p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Admin: full dashboard (metrics, charts, recent lists)
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(lastMonthStart);
  const yesterday = startOfDay(subDays(new Date(), 1));
  const yesterdayEnd = endOfDay(yesterday);
  const twelveMonthsAgo = startOfMonth(subMonths(new Date(), 11));
  const endOfCurrentMonth = endOfMonth(new Date());
  const monthsToShow = 12;

  // Batch queries to avoid connection pool exhaustion (pool max 15, layout+page share connections).
  // Running 18 queries at once starves the pool; 2 batches of 9 keeps concurrency safe.
  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=admin | batch1(9).start`);
  }

  let totalPatientsResult: { count: number }[] | null = null;
  let appointmentsTodayResult: { count: number }[] | null = null;
  let monthlyRevenueResult: { total: string }[] | null = null;
  let statusRows: { status: string | null; count: number }[] = [];
  let allRevenueRows: { year_num: number; month_num: number; total: string }[] = [];
  let allActivityRows: { year_num: number; month_num: number; count: number }[] = [];
  let recentAppointments: {
    id: string;
    startTime: Date;
    status: string;
    patientName: string;
    doctorName: string;
  }[] = [];
  let recentPatients: {
    id: string;
    fullName: string;
    phone: string;
    createdAt: Date;
  }[] = [];
  let lastMonthRevenueResult: { total: string }[] | null = null;
  let appointmentsYesterdayResult: { count: number }[] | null = null;
  let newPatientsThisMonthResult: { count: number }[] | null = null;
  let newPatientsLastMonthResult: { count: number }[] | null = null;
  let lowStockResult: { count: number }[] | null = null;
  let expensesThisMonthResult: { total: string }[] | null = null;
  let outstandingInvoicesResult: { count: number; total: string }[] | null = null;
  let recentUnpaidInvoices: {
    id: string;
    invoiceNumber: string | null;
    patientName: string | null;
    totalAmount: string;
    dueAt: Date | null;
    status: string;
  }[] = [];
  let overdueCountResult: { count: number }[] | null = null;
  let allExpensesRows: { year_num: number; month_num: number; total: string }[] = [];

  try {
    // Batch 1: core metrics, charts, recent lists (9 queries)
    [
      totalPatientsResult,
      appointmentsTodayResult,
      monthlyRevenueResult,
      statusRows,
      allRevenueRows,
      allActivityRows,
      recentAppointments,
      recentPatients,
      lastMonthRevenueResult,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(patients),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointments)
        .where(
          and(
            gte(appointments.startTime, today),
            lt(appointments.startTime, todayEnd)
          )
        ),
      db
        .select({
          total: sql<string>`coalesce(sum(${invoices.totalAmount})::text, '0')`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.status, "paid"),
            gte(invoices.issuedAt, thisMonthStart),
            lte(invoices.issuedAt, thisMonthEnd)
          )
        ),
      db
        .select({
          status: appointments.status,
          count: sql<number>`count(*)::int`,
        })
        .from(appointments)
        .groupBy(appointments.status),
      db
        .select({
          year_num: sql<number>`extract(year from ${invoices.issuedAt})::int`,
          month_num: sql<number>`extract(month from ${invoices.issuedAt})::int`,
          total: sql<string>`coalesce(sum(${invoices.totalAmount})::text, '0')`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.status, "paid"),
            gte(invoices.issuedAt, twelveMonthsAgo),
            lte(invoices.issuedAt, endOfCurrentMonth)
          )
        )
        .groupBy(
          sql`extract(year from ${invoices.issuedAt})`,
          sql`extract(month from ${invoices.issuedAt})`
        ),
      db
        .select({
          year_num: sql<number>`extract(year from ${appointments.startTime})::int`,
          month_num: sql<number>`extract(month from ${appointments.startTime})::int`,
          count: sql<number>`count(*)::int`,
        })
        .from(appointments)
        .where(
          and(
            gte(appointments.startTime, twelveMonthsAgo),
            lte(appointments.startTime, endOfCurrentMonth)
          )
        )
        .groupBy(
          sql`extract(year from ${appointments.startTime})`,
          sql`extract(month from ${appointments.startTime})`
        ),
      db
        .select({
          id: appointments.id,
          startTime: appointments.startTime,
          status: appointments.status,
          patientName: patients.fullName,
          doctorName: users.fullName,
        })
        .from(appointments)
        .innerJoin(patients, eq(appointments.patientId, patients.id))
        .innerJoin(users, eq(appointments.doctorId, users.id))
        .orderBy(desc(appointments.startTime))
        .limit(5),
      db
        .select({
          id: patients.id,
          fullName: patients.fullName,
          phone: patients.phone,
          createdAt: patients.createdAt,
        })
        .from(patients)
        .orderBy(desc(patients.createdAt))
        .limit(5),
      db
        .select({
          total: sql<string>`coalesce(sum(${invoices.totalAmount})::text, '0')`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.status, "paid"),
            gte(invoices.issuedAt, lastMonthStart),
            lte(invoices.issuedAt, lastMonthEnd)
          )
        ),
    ]);

    // Batch 2: secondary metrics, lists, expenses (9 queries)
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=admin | batch1.done | batch2(9).start`);
    }
    [
      appointmentsYesterdayResult,
      newPatientsThisMonthResult,
      newPatientsLastMonthResult,
      lowStockResult,
      expensesThisMonthResult,
      outstandingInvoicesResult,
      recentUnpaidInvoices,
      overdueCountResult,
      allExpensesRows,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(appointments)
        .where(
          and(
            gte(appointments.startTime, yesterday),
            lt(appointments.startTime, yesterdayEnd)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(patients)
        .where(
          and(
            gte(patients.createdAt, thisMonthStart),
            lte(patients.createdAt, thisMonthEnd)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(patients)
        .where(
          and(
            gte(patients.createdAt, lastMonthStart),
            lt(patients.createdAt, thisMonthStart)
          )
        ),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(inventory)
        .where(
          and(
            eq(inventory.status, "active"),
            lte(inventory.quantity, inventory.minStock)
          )
        ),
      db
        .select({ total: sql<string>`coalesce(sum(${expenses.amount})::text, '0')` })
        .from(expenses)
        .where(
          and(
            gte(expenses.date, thisMonthStart),
            lte(expenses.date, thisMonthEnd)
          )
        ),
      db
        .select({
          count: sql<number>`count(*)::int`,
          total: sql<string>`coalesce(sum(${invoices.totalAmount})::text, '0')`,
        })
        .from(invoices)
        .where(eq(invoices.status, "unpaid")),
      db
        .select({
          id: invoices.id,
          invoiceNumber: invoices.invoiceNumber,
          patientName: patients.fullName,
          totalAmount: invoices.totalAmount,
          dueAt: invoices.dueAt,
          status: invoices.status,
        })
        .from(invoices)
        .leftJoin(patients, eq(invoices.patientId, patients.id))
        .where(eq(invoices.status, "unpaid"))
        .orderBy(asc(invoices.dueAt))
        .limit(5),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(invoices)
        .where(and(eq(invoices.status, "unpaid"), lt(invoices.dueAt, today))),
      db
        .select({
          year_num: sql<number>`extract(year from ${expenses.date})::int`,
          month_num: sql<number>`extract(month from ${expenses.date})::int`,
          total: sql<string>`coalesce(sum(${expenses.amount})::text, '0')`,
        })
        .from(expenses)
        .where(
          and(
            gte(expenses.date, twelveMonthsAgo),
            lte(expenses.date, endOfCurrentMonth)
          )
        )
        .groupBy(
          sql`extract(year from ${expenses.date})`,
          sql`extract(month from ${expenses.date})`
        ),
    ]);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=admin | batch2.done`);
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=admin | Promise.all.error | ${error instanceof Error ? error.message : String(error)}`);
    }
    const msg = error instanceof Error ? error.message : String(error);
    const isTimeout =
      msg.includes("statement timeout") ||
      msg.includes("57014") ||
      msg.includes("Query timeout");

    if (process.env.CARENOVA_DEBUG === "1") {
      console.error("[CareNova] Dashboard data fetch failed:", error);
    }

    const tErrors = await getTranslations("errors");
    return (
      <DashboardDbError
        message={
          isTimeout
            ? tErrors("dashboardSlowLoad")
            : tErrors("dashboardLoadFailed")
        }
        title={isTimeout ? tErrors("databaseSlow") : undefined}
        showEnvHint={!isTimeout}
        showRetry={isTimeout}
        envHint={!isTimeout ? tErrors("envHint") : undefined}
        tryAgainLabel={tErrors("tryAgain")}
        signOutLabel={tErrors("signOut")}
      />
    );
  }

  const statusChartData = statusRows.map((r) => ({
    name: tStatus((r.status ?? "pending") as "pending" | "confirmed" | "completed" | "cancelled"),
    value: r.count ?? 0,
    statusKey: r.status ?? "pending",
  }));

  // Build 12-month arrays from batched results (no DB calls)
  const revenueMap = new Map<string, number>();
  for (const row of allRevenueRows) {
    revenueMap.set(`${row.year_num}-${row.month_num}`, parseFloat(row.total));
  }
  const expensesMap = new Map<string, number>();
  for (const row of allExpensesRows) {
    expensesMap.set(`${row.year_num}-${row.month_num}`, parseFloat(row.total));
  }
  const activityMap = new Map<string, number>();
  for (const row of allActivityRows) {
    activityMap.set(`${row.year_num}-${row.month_num}`, row.count ?? 0);
  }

  const revenueByMonth: { month: string; revenue: number; expenses: number }[] = [];
  const activityByMonth: { month: string; appointments: number }[] = [];
  for (let i = monthsToShow - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(new Date(), i));
    const yearNum = monthStart.getFullYear();
    const monthNum = monthStart.getMonth() + 1;
    const key = `${yearNum}-${monthNum}`;
    const dbRevenue = revenueMap.get(key) ?? 0;
    const dbExpenses = expensesMap.get(key) ?? 0;
    const dbActivity = activityMap.get(key) ?? 0;
    revenueByMonth.push({
      month: formatMonthWithLocale(monthStart, locale),
      revenue: dbRevenue,
      expenses: dbExpenses,
    });
    activityByMonth.push({
      month: formatMonthWithLocale(monthStart, locale),
      appointments: dbActivity,
    });
  }

  const totalPatients = totalPatientsResult?.[0]?.count ?? 0;
  const appointmentsToday = appointmentsTodayResult?.[0]?.count ?? 0;
  const appointmentsYesterday = appointmentsYesterdayResult?.[0]?.count ?? 0;
  const monthlyRevenue = parseFloat(monthlyRevenueResult?.[0]?.total ?? "0");
  const expensesThisMonth = parseFloat(expensesThisMonthResult?.[0]?.total ?? "0");
  const netThisMonth = monthlyRevenue - expensesThisMonth;
  const outstandingCount = Number(outstandingInvoicesResult?.[0]?.count ?? 0);
  const overdueCount = Number(overdueCountResult?.[0]?.count ?? 0);
  const lastMonthRevenue = parseFloat(lastMonthRevenueResult?.[0]?.total ?? "0");
  const newPatientsThisMonth = newPatientsThisMonthResult?.[0]?.count ?? 0;
  const newPatientsLastMonth = newPatientsLastMonthResult?.[0]?.count ?? 0;

  // Calculate percentage changes
  const revenueChange = lastMonthRevenue > 0 
    ? ((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
    : (monthlyRevenue > 0 ? 100 : 0);
  const patientsChange = newPatientsLastMonth > 0
    ? ((newPatientsThisMonth - newPatientsLastMonth) / newPatientsLastMonth) * 100
    : (newPatientsThisMonth > 0 ? 100 : 0);
  const appointmentsChange = appointmentsYesterday > 0
    ? ((appointmentsToday - appointmentsYesterday) / appointmentsYesterday) * 100
    : (appointmentsToday > 0 ? 100 : 0);
  const lowStockChange = 0;

  const formatChange = (change: number, positive: boolean) => {
    if (change === 0 && !positive) return null;
    const sign = positive ? "↑" : "↓";
    const absChange = Math.abs(change).toFixed(1);
    return `${sign} ${absChange}%`;
  };

  const lowStockCount = lowStockResult?.[0]?.count ?? 0;

  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - traceT0}ms | loadDashboardContent.role=admin | render.done`);
  }

  const metricCards = [
    {
      title: t("admin.todayAppointments"),
      value: String(appointmentsToday),
      revenueValue: null as number | null,
      description: t("admin.scheduledToday"),
      icon: Calendar,
      change: formatChange(appointmentsChange, appointmentsChange >= 0),
      changePositive: appointmentsChange >= 0,
      changePercent: appointmentsChange,
    },
    {
      title: t("admin.totalPatients"),
      value: String(totalPatients),
      revenueValue: null as number | null,
      description: t("admin.activePatients"),
      icon: Users,
      change: formatChange(patientsChange, patientsChange >= 0),
      changePositive: patientsChange >= 0,
      changePercent: patientsChange,
    },
    {
      title: t("admin.monthlyRevenue"),
      value: "",
      revenueValue: monthlyRevenue,
      description: t("admin.thisMonth"),
      icon: DollarSign,
      change: formatChange(revenueChange, revenueChange >= 0),
      changePositive: revenueChange >= 0,
      changePercent: revenueChange,
    },
    {
      title: t("admin.lowStock"),
      value: String(lowStockCount),
      revenueValue: null as number | null,
      description: t("admin.needAttention"),
      icon: AlertTriangle,
      change: formatChange(lowStockChange, false),
      changePositive: false,
      changePercent: lowStockChange,
    },
  ];

  const statusBadgeVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
    pending: "secondary",
    confirmed: "default",
    completed: "outline",
    cancelled: "destructive",
  };

  return (
    <div className="dashboard-page">
      {/* Page header (Subrocket-style) */}
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title">{t("admin.title")}</h1>
        <p className="dashboard-page-description">
          {t("admin.description")}
        </p>
      </div>

      <OverdueWarningBanner overdueCount={overdueCount} />

      {/* Row 1: Metric cards (4 cards to match reference: Today, Patients, Revenue, Low Stock) */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.title} 
              className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <div className="rounded-lg bg-muted p-1 group-hover:bg-muted/80 transition-colors">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-2 px-4 pb-4">
                <div>
                  <p className="text-2xl font-bold font-heading tabular-nums">
                    {card.revenueValue != null ? (
                      <RevenueValue value={card.revenueValue} />
                    ) : (
                      card.value
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.description}
                  </p>
                </div>
                {card.changePercent !== null && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-end">
                      <p
                        className={`text-xs font-medium whitespace-nowrap ${
                          card.changePositive
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {card.change || "—"}
                      </p>
                    </div>
                    <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${
                      card.changePositive ? "bg-primary/10" : "bg-muted"
                    }`}>
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          card.changePositive 
                            ? "bg-gradient-to-r from-[#3337ff] via-[#587dff] to-[#72a5ff]" 
                            : "bg-gradient-to-r from-muted-foreground/50 to-muted-foreground/30"
                        }`}
                        style={{
                          width: `${Math.min(Math.abs(card.changePercent) / 2 + 25, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Financial Overview row */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("admin.revenueThisMonth")}</CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums">
              <RevenueValue value={monthlyRevenue} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t("admin.paidInvoices")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("admin.expensesThisMonth")}</CardTitle>
            <Wallet className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold font-heading tabular-nums">
              <RevenueValue value={expensesThisMonth} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">{t("admin.clinicExpenses")}</p>
          </CardContent>
        </Card>
        <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground">{t("admin.netThisMonth")}</CardTitle>
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className={`text-2xl font-bold font-heading tabular-nums ${netThisMonth >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
              <RevenueValue value={netThisMonth} />
            </p>
            <p className="text-xs text-muted-foreground mt-1">{netThisMonth >= 0 ? t("admin.profit") : t("admin.loss")}</p>
          </CardContent>
        </Card>
        <Link href="/dashboard/invoices?status=unpaid">
          <Card className="group relative transition-all duration-200 hover:-translate-y-0.5 border-border/50 py-0 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">{t("admin.outstandingInvoices")}</CardTitle>
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-2xl font-bold font-heading tabular-nums">{outstandingCount}</p>
              <p className="text-xs text-muted-foreground mt-1">{tStatus("unpaid")}</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Row 2: Charts */}
      <div className="grid gap-4 md:grid-cols-7">
        <div className="md:col-span-4">
          <RevenueChart
            data={revenueByMonth}
            title={t("admin.revenueOverview")}
            subtitle={t("admin.revenueOverviewSubtitle")}
            viewDetailsLabel={t("admin.viewDetails")}
          />
        </div>
        <div className="md:col-span-3">
          <AppointmentStatusChart
            data={statusChartData}
            title={t("admin.appointmentStatus")}
            subtitle={t("admin.appointmentStatusSubtitle")}
            noAppointmentsLabel={t("admin.noAppointments")}
          />
        </div>
      </div>

      {/* Row 2b: Activity (DAA) – appointments per month, 12 months */}
      <div className="grid gap-4 md:grid-cols-1">
        <ActivityChart
          data={activityByMonth}
          title={t("admin.activityAppointments")}
          subtitle={t("admin.activitySubtitle")}
        />
      </div>

      {/* Row 3: Recent lists (appointments, patients, unpaid invoices) */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Recent Appointments */}
        <Card className="group relative transition-all duration-200 border-border/50 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold font-heading">
              {t("admin.recentAppointments")}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="rounded-xl">
              <Link
                href="/dashboard/appointments"
                className="text-xs text-primary hover:underline flex items-center gap-1 transition-colors"
              >
                {t("admin.viewAll")}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-2">
                  <span className="text-xl">📅</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("admin.noAppointments")}
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {recentAppointments.map((apt) => (
                  <li
                    key={apt.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors group/item"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate text-sm">{apt.patientName}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        Dr. {apt.doctorName} • {formatTimeWithLocale(apt.startTime, locale)}
                      </p>
                    </div>
                    <Badge
                      variant={statusBadgeVariant[apt.status] ?? "secondary"}
                      className="shrink-0 rounded-lg"
                    >
                      {tStatus(apt.status as keyof typeof statusBadgeVariant)}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card className="group relative transition-all duration-200 border-border/50 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold font-heading">
              {t("admin.recentPatients")}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="rounded-xl">
              <Link
                href="/dashboard/patients"
                className="text-xs text-primary hover:underline flex items-center gap-1 transition-colors"
              >
                {t("admin.viewAll")}
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentPatients.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-2">
                  <span className="text-xl">👥</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {t("admin.noPatients")}
                </p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {recentPatients.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors group/item"
                  >
                    <FullProfileButton
                      patientId={p.id}
                      variant="ghost"
                      className="min-w-0 flex-1 hover:underline text-left p-0 h-auto flex flex-col items-start"
                    >
                      <p className="font-medium truncate text-sm">{p.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {p.phone}
                      </p>
                    </FullProfileButton>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover/item:text-foreground transition-colors" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Unpaid Invoices */}
        <Card className="group relative transition-all duration-200 border-border/50 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-semibold font-heading">
              {t("admin.recentUnpaidInvoices")}
            </CardTitle>
            <Button variant="ghost" size="sm" asChild className="rounded-xl">
              <Link
                href="/dashboard/invoices?status=unpaid"
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                {t("admin.viewAll")} <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentUnpaidInvoices.length === 0 ? (
              <p className="py-4 text-sm text-muted-foreground">{t("admin.noUnpaidInvoices")}</p>
            ) : (
              <ul className="space-y-2.5">
                {recentUnpaidInvoices.map((inv) => (
                  <li key={inv.id}>
                    <Link
                      href="/dashboard/invoices"
                      className="flex items-center justify-between gap-3 py-2.5 px-2 rounded-xl border border-border/50 hover:bg-muted/50 transition-colors group/item"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium truncate text-sm">{inv.invoiceNumber ?? inv.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground truncate">{inv.patientName ?? "—"}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-semibold">${parseFloat(inv.totalAmount).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">
                          {inv.dueAt ? new Date(inv.dueAt).toLocaleDateString() : "—"}
                        </p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground group-hover/item:text-foreground" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
