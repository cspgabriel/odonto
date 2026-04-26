import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { departments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateServiceForm } from "./create-service-form";

export default async function NewServicePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  const t = await getTranslations("services");
  const departmentsList = await db
    .select({ id: departments.id, name: departments.name })
    .from(departments)
    .where(eq(departments.isActive, 1))
    .orderBy(departments.name);

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title font-heading">{t("newServicePageTitle")}</h1>
        <p className="dashboard-page-description text-muted-foreground">
          {t("newServicePageDescription")}
        </p>
      </div>

      <Card className="rounded-[var(--radius)] border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading">{t("serviceInformation")}</CardTitle>
          <CardDescription>{t("serviceInformationDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateServiceForm departments={departmentsList} />
        </CardContent>
      </Card>
    </div>
  );
}
