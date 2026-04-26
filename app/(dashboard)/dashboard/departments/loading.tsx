import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { Building2, Stethoscope, Users } from "lucide-react";

export default async function DepartmentsLoading() {
  const t = await getTranslations("departments");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("pageDescription")}
      buttonLabel={t("addDepartment")}
      statCards={[
        { label: t("statTotal"), icon: Building2 },
        { label: t("statActive"), icon: Building2 },
        { label: t("statStaff"), icon: Stethoscope },
        { label: t("statBudget"), icon: Users },
      ]}
      tableHeaders={[
        t("tableName"),
        t("tableDepartmentHead"),
        t("tableStaff"),
        t("tableServices"),
        t("tableStatus"),
        t("tableCreated"),
        t("tableActions"),
      ]}
      tableRows={6}
    />
  );
}
