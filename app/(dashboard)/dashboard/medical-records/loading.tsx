import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { FileText, Activity, CalendarCheck, Paperclip } from "lucide-react";

export default async function MedicalRecordsLoading() {
  const t = await getTranslations("medicalRecords");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("pageDescription")}
      buttonLabel={t("add")}
      statCards={[
        { label: t("totalRecords"), icon: FileText },
        { label: t("activeCases"), icon: Activity },
        { label: t("completedVisits"), icon: CalendarCheck },
        { label: t("totalAttachments"), icon: Paperclip },
      ]}
      tableHeaders={[
        t("tablePatient"),
        t("tableTotalRecords"),
        t("tableActiveCases"),
        t("tableCompletedVisits"),
        t("tableLastActivity"),
        t("actions"),
      ]}
      tableRows={6}
    />
  );
}
