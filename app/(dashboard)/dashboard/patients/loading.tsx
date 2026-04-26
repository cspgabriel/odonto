import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { Users, UserPlus, Activity, Clock } from "lucide-react";

export default async function PatientsLoading() {
  const t = await getTranslations("patients");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("descriptionExtended")}
      buttonLabel={t("addPatient")}
      statCards={[
        { label: t("totalPatients"), icon: Users },
        { label: t("newThisMonth"), icon: UserPlus },
        { label: t("activePatients"), icon: Activity },
        { label: t("avgAge"), icon: Clock },
      ]}
      tableHeaders={[
        t("tablePatient"),
        t("tableContact"),
        t("tableAge"),
        t("tableBlood"),
        t("tableLastVisit"),
        t("tableActions"),
      ]}
      tableRows={6}
    />
  );
}
