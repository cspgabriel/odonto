import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { Activity, Heart } from "lucide-react";

export default async function VitalsLoading() {
  const t = await getTranslations("medicalRecords");
  return (
    <PageSkeleton
      pageTitle={t("vitalsTitle")}
      pageDescription={t("vitalsDescription")}
      buttonLabel={t("recordVitals")}
      statCards={[
        { label: t("totalVitals"), icon: Activity },
        { label: t("thisMonth"), icon: Heart },
      ]}
      tableHeaders={[
        t("tablePatient"),
        t("tableRecorded"),
        t("tableBP"),
        t("tableHR"),
        t("tableTemp"),
        t("tableWeight"),
        t("actions"),
      ]}
      tableRows={6}
    />
  );
}
