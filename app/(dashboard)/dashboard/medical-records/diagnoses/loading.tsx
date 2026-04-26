import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { Tag, Activity, Calendar } from "lucide-react";

export default async function DiagnosesLoading() {
  const t = await getTranslations("medicalRecords");
  return (
    <PageSkeleton
      pageTitle={t("diagnosesTitle")}
      pageDescription={t("diagnosesDescription")}
      buttonLabel={t("addDiagnosis")}
      statCards={[
        { label: t("totalDiagnoses"), icon: Tag },
        { label: t("activeCases"), icon: Activity },
        { label: t("thisMonth"), icon: Calendar },
      ]}
      tableHeaders={[
        t("tablePatient"),
        t("tableContent"),
        t("tableDate"),
        t("statusFilter"),
        t("actions"),
      ]}
      tableRows={6}
    />
  );
}
