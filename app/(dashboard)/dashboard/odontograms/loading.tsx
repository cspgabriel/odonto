import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { ClipboardList, Users, FileText } from "lucide-react";

export default async function OdontogramsLoading() {
  const t = await getTranslations("odontograms");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("pageDescription")}
      buttonLabel={t("newOdontogram")}
      statCards={[
        { label: t("statTotalPatients"), icon: ClipboardList },
        { label: t("statWithRecords"), icon: Users },
        { label: t("statActiveTreatments"), icon: FileText },
      ]}
      tableHeaders={[
        t("tablePatient"),
        t("tableDateTime"),
        t("tableStatus"),
        t("tableActions"),
      ]}
      tableRows={6}
    />
  );
}
