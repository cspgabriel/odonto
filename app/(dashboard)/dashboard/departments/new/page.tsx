import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateDepartmentForm } from "./create-department-form";

export default async function NewDepartmentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "admin") {
    redirect("/dashboard");
  }
  const t = await getTranslations("departments");

  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <h1 className="dashboard-page-title font-heading">{t("newDepartment")}</h1>
        <p className="dashboard-page-description text-muted-foreground">
          {t("newDepartmentDescription")}
        </p>
      </div>

      <Card className="rounded-[var(--radius)] border shadow-sm">
        <CardHeader>
          <CardTitle className="font-heading">{t("departmentInformation")}</CardTitle>
          <CardDescription>{t("departmentInformationDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateDepartmentForm />
        </CardContent>
      </Card>
    </div>
  );
}
