import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getAuthUser } from "@/lib/auth";
import { getCurrentUserPermissions } from "@/lib/auth/require-permission";
import { getCachedClinic, getCachedEnsureAppUser } from "@/lib/cache";
import { requestLog } from "@/lib/debug";
import { DashboardDbError } from "@/components/dashboard/dashboard-db-error";
import { AppSidebar } from "@/app/(dashboard)/dashboard/_components/app-sidebar";
import { PermissionErrorToast } from "@/components/dashboard/permission-error-toast";
import { DashboardHeader } from "@/app/(dashboard)/dashboard/_components/dashboard-header";
import { FullProfileSheetProvider } from "@/app/(dashboard)/dashboard/patients/full-profile-sheet-context";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { LocaleDirFont } from "@/app/(dashboard)/dashboard/_components/locale-dir-font";

function isConnectionError(message: string): boolean {
  return (
    message.includes("Cannot reach server") ||
    message.includes("DATABASE_URL") ||
    message.includes("Database connection") ||
    message.includes("Database tables") ||
    message.includes("password") ||
    message.includes("does not exist") ||
    message.includes("npm run db:push")
  );
}

function isStatementTimeout(message: string): boolean {
  return (
    message.includes("statement timeout") ||
    message.includes("query timed out") ||
    message.includes("Try again; if it keeps happening")
  );
}

/** Force dynamic rendering for all dashboard routes (auth + cookies). Prevents build-time static generation errors. */
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const layoutT0 = Date.now();
  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+0ms | layout.start`);
  }

  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? headersList.get("x-url") ?? "dashboard";
  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - layoutT0}ms | layout.headers.done | pathname=${pathname}`);
  }
  requestLog("layout.start", pathname);

  let authUser = null;
  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - layoutT0}ms | layout.getAuthUser.start`);
  }
  try {
    authUser = await Promise.race([
      getAuthUser(),
      new Promise<null>((_, reject) =>
        setTimeout(() => reject(new Error("Auth timeout after 8s")), 8000)
      ),
    ]);
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - layoutT0}ms | layout.getAuthUser.done | ${authUser?.id ? "ok" : "null"}`);
    }
    requestLog("layout.getAuthUser.done", authUser?.id ? "ok" : "null");
  } catch (err) {
    requestLog("layout.getAuthUser.error", err instanceof Error ? err.message : String(err));
    const message = err instanceof Error ? err.message : String(err);
    const causeMessage =
      err instanceof Error && err.cause instanceof Error ? (err.cause as Error).message : "";
    const isNetwork =
      message.includes("fetch failed") ||
      message.includes("ENOTFOUND") ||
      message.includes("getaddrinfo") ||
      causeMessage.includes("ENOTFOUND") ||
      causeMessage.includes("getaddrinfo");
    if (isNetwork) {
      const t = await getTranslations("errors");
      return (
        <DashboardDbError
          title={t("connectionProblem")}
          message={t("authConnection")}
          showEnvHint={false}
          tryAgainLabel={t("tryAgain")}
          signOutLabel={t("signOut")}
        />
      );
    }
    console.error("[Layout] getAuthUser failed:", err);
    redirect("/login");
  }
  if (!authUser) {
    requestLog("layout.redirect", "login (no authUser)");
    redirect("/login");
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - layoutT0}ms | layout.ensureAppUser.start`);
  }
  requestLog("layout.ensureAppUser.start");
  let appUserResult: Awaited<ReturnType<typeof getCachedEnsureAppUser>>;
  try {
    appUserResult = await Promise.race([
      getCachedEnsureAppUser(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("DB timeout after 8s")), 8000)
      ),
    ]);
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - layoutT0}ms | layout.ensureAppUser.error | ${err instanceof Error ? err.message : String(err)}`);
    }
    console.error("[Layout] ensureAppUser failed:", err);
    const t = await getTranslations("errors");
    return (
      <DashboardDbError
        message={t("databaseUnavailable")}
        showRetry
        envHint={t("envHint")}
        tryAgainLabel={t("tryAgain")}
        signOutLabel={t("signOut")}
      />
    );
  }

  let clinic: Awaited<ReturnType<typeof getCachedClinic>> | { type: "general" } = { type: "general" };
  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - layoutT0}ms | layout.getCachedClinic.start`);
  }
  try {
    clinic = await getCachedClinic();
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - layoutT0}ms | layout.getCachedClinic.done`);
    }
  } catch {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Dashboard:trace] T+${Date.now() - layoutT0}ms | layout.getCachedClinic.error | fallback to general`);
    }
    clinic = { type: "general" };
  }

  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - layoutT0}ms | layout.ensureAppUser.done | ${appUserResult.success ? "ok" : appUserResult.error}`);
  }
  requestLog("layout.ensureAppUser.done", appUserResult.success ? "ok" : appUserResult.error);
  if (!appUserResult.success) {
    const err = appUserResult.error;
    if (isConnectionError(err)) {
      const t = await getTranslations("errors");
      const isNetworkMessage = err.includes("Cannot reach server");
      return (
        <DashboardDbError
          message={err}
          title={isNetworkMessage ? t("connectionProblem") : undefined}
          showEnvHint={!isNetworkMessage}
          envHint={t("envHint")}
          tryAgainLabel={t("tryAgain")}
          signOutLabel={t("signOut")}
        />
      );
    }
    if (isStatementTimeout(err)) {
      const t = await getTranslations("errors");
      return (
        <DashboardDbError
          message={err}
          title={t("databaseSlow")}
          showEnvHint={false}
          showRetry
          tryAgainLabel={t("tryAgain")}
          signOutLabel={t("signOut")}
        />
      );
    }
    if (appUserResult.error === "EMAIL_ALREADY_REGISTERED") {
      requestLog("layout.redirect", "login (email already registered)");
      redirect("/login?error=email_already_registered");
    }
    requestLog("layout.redirect", "login (ensureAppUser failed)");
    redirect("/login");
  }

  // Use user from ensureAppUser — avoids second DB round-trip (getCachedCurrentUser)
  const appUser = appUserResult.user;
  const isPendingApproval =
    appUser.role !== "admin" &&
    (appUser.approvedAt === null || appUser.approvedAt === undefined);
  if (isPendingApproval && !pathname?.includes("pending-approval")) {
    requestLog("layout.redirect", "login (pending approval)");
    redirect("/login?pending=1");
  }
  const avatarUrl =
    (authUser.user_metadata?.avatar_url as string)?.trim() ||
    (authUser.user_metadata?.image as string)?.trim() ||
    null;
  const displayUser = {
    name: appUser.fullName ?? authUser.email?.split("@")[0] ?? "User",
    email: appUser.email ?? authUser.email ?? "",
    avatar: avatarUrl || null,
    role: appUserResult.role,
  };

  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - layoutT0}ms | layout.cookies.start`);
  }
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value === "true";
  if (process.env.NODE_ENV === "development") {
    console.log(`[Dashboard:trace] T+${Date.now() - layoutT0}ms | layout.cookies.done | layout.done`);
  }
  const { can } = await getCurrentUserPermissions();
  const canEditPatient = can("patients.edit");
  const canViewMedicalHistory = can("medical_records.view");
  const permissions = {
    appointments: can("appointments.view"),
    patients: can("patients.view"),
    billing: can("billing.view"),
    inventory: can("inventory.view"),
    staff: can("staff.view"),
    medicalRecords: can("medical_records.view"),
    prescriptions: can("prescriptions.view"),
    testReports: can("test_reports.view"),
    services: can("services.view"),
    departments: can("departments.view"),
    settings: can("settings.view"),
    odontogram: can("odontogram.view"),
  };

  requestLog("layout.done", pathname);
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <LocaleDirFont />
      <AppSidebar role={appUserResult.role} clinicType={clinic.type} permissions={permissions} />
      <SidebarInset
        className="max-[113rem]:peer-data-[variant=inset]:!mr-2 min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:!mr-auto"
      >
        <DashboardHeader user={displayUser} clinicType={clinic.type} />
        <div className="bg-background h-full min-w-0 overflow-x-hidden px-4 py-3">
          <Suspense fallback={null}>
            <PermissionErrorToast />
          </Suspense>
          <FullProfileSheetProvider userRole={appUserResult.role} canEditPatient={canEditPatient} canViewMedicalHistory={canViewMedicalHistory}>
            {children}
          </FullProfileSheetProvider>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
