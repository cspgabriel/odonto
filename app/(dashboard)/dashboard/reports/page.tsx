/**
 * REPORTS PAGE
 * NOT ARRANGED IN THIS VERSION (MVP)
 * This feature is planned for a future release.
 */

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";

export default async function ReportsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("reports");

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title font-heading text-slate-400">{t("title")}</h1>
        <p className="dashboard-page-description text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <Card className="flex flex-col gap-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 py-12 shadow-sm bg-slate-50/50 dark:bg-slate-900/50 items-center justify-center text-center">
        <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mb-2">
          <BarChart3 className="h-8 w-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold font-heading text-slate-900 dark:text-white mb-2">{t("cardTitle")}</h2>
          <p className="text-slate-500 max-w-sm mx-auto">
            {t("cardDescription")}
          </p>
        </div>
      </Card>
    </div>
  );
}

