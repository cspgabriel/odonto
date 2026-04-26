import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { FileText, FlaskConical, Calendar } from "lucide-react";

export default async function TestReportsLoading() {
  const t = await getTranslations("testReports");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("pageDescription")}
      buttonLabel={t("addTestReport")}
      statCards={[
        { label: t("totalReports"), icon: FileText },
        { label: t("pending"), icon: FlaskConical },
        { label: t("completedReports"), icon: Calendar },
      ]}
      tableHeaders={[
        t("patient"),
        t("test"),
        t("testDate"),
        t("status"),
        t("actions"),
      ]}
      tableRows={6}
    />
  );
}
