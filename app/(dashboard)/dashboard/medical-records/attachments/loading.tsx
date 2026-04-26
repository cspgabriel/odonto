import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { Paperclip, FileText, User } from "lucide-react";

export default async function AttachmentsLoading() {
  const t = await getTranslations("medicalRecords");
  return (
    <PageSkeleton
      pageTitle={t("attachmentsTitle")}
      pageDescription={t("attachmentsDescription")}
      buttonLabel={t("addAttachment")}
      statCards={[
        { label: t("totalAttachments"), icon: Paperclip },
        { label: t("thisMonth"), icon: FileText },
        { label: t("tablePatient"), icon: User },
      ]}
      tableHeaders={[
        t("tablePatient"),
        t("tableContent"),
        t("tableDate"),
        t("actions"),
      ]}
      tableRows={6}
    />
  );
}
