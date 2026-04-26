import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default async function ComingSoonPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const t = await getTranslations("comingSoon");

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title font-heading">{t("title")}</h1>
        <p className="dashboard-page-description text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <Card className="flex flex-col gap-6 rounded-[var(--radius)] border py-6 shadow-sm">
        <CardHeader className="px-6">
          <CardTitle className="flex items-center gap-2 font-heading text-base">
            <Construction className="h-5 w-5" />
            {t("cardTitle")}
          </CardTitle>
          <CardDescription>
            {t("cardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6">
          <p className="text-sm text-muted-foreground">
            {t("cardContent")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
