import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { Stethoscope, Activity, Building2 } from "lucide-react";

export default async function ServicesLoading() {
  const t = await getTranslations("services");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("pageDescription")}
      buttonLabel={t("addService")}
      statCards={[
        { label: t("statTotal"), icon: Stethoscope },
        { label: t("statActive"), icon: Activity },
        { label: t("statDepartments"), icon: Building2 },
      ]}
      tableHeaders={[
        t("tableName"),
        t("tableDescription"),
        t("tablePrice"),
        t("tableDuration"),
        t("tableDepartment"),
        t("tableActions"),
      ]}
      tableRows={6}
    />
  );
}
