import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";
import { getCachedCurrentUser } from "@/lib/cache";
import { getAllRolePermissionCounts } from "@/lib/actions/permission-actions";
import { PermissionsClient } from "./permissions-client";
import { PermissionsSkeleton } from "./permissions-skeleton";

export const metadata = {
  title: "Permissions | CareNova",
  robots: { index: false, follow: false },
};

export default async function PermissionsPage() {
  const user = await getCachedCurrentUser();
  if (!user) redirect("/login");

  if (user.role !== "admin") redirect("/dashboard");

  const countsResult = await getAllRolePermissionCounts();
  const counts =
    countsResult.success && countsResult.data
      ? countsResult.data
      : {};

  const t = await getTranslations("permissions");

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
      </div>

      <div className="flex items-start gap-4 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/40 dark:bg-amber-900/20">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
          <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <div className="mb-1">
            <span className="inline-flex items-center rounded-full bg-amber-200 px-2.5 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-800 dark:text-amber-200">
              {t("administrator")}
            </span>
          </div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
            {t("fullSystemAccess")}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {t("adminDescription")}
          </p>
        </div>
      </div>

      <Suspense fallback={<PermissionsSkeleton />}>
        <PermissionsClient initialCounts={counts} />
      </Suspense>
    </div>
  );
}
