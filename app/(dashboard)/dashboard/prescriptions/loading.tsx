import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { FileText, Stethoscope, Calendar } from "lucide-react";

export default async function PrescriptionsLoading() {
  const t = await getTranslations("prescriptions");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("pageDescription")}
      buttonLabel={t("addPrescription")}
      statCards={[
        { label: t("statTotal"), icon: FileText },
        { label: t("statLast7Days"), icon: Stethoscope },
        { label: t("statPending"), icon: Calendar },
      ]}
      tableHeaders={[
        t("tablePatient"),
        t("tableDoctor"),
        t("tableDate"),
        t("tableStatus"),
        t("tableActions"),
      ]}
      tableRows={6}
    />
  );
}
