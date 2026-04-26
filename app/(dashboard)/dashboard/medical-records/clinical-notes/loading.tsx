import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { FileText, User } from "lucide-react";

export default async function ClinicalNotesLoading() {
  const t = await getTranslations("medicalRecords");
  return (
    <PageSkeleton
      pageTitle={t("clinicalNotesTitle")}
      pageDescription={t("clinicalNotesDescription")}
      buttonLabel={t("addClinicalNote")}
      statCards={[
        { label: t("totalNotes"), icon: FileText },
        { label: t("thisMonth"), icon: User },
      ]}
      tableHeaders={[
        t("tablePatient"),
        t("tableAuthor"),
        t("tableContent"),
        t("tableDate"),
        t("actions"),
      ]}
      tableRows={6}
    />
  );
}
