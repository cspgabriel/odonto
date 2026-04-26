import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { FlaskConical, Boxes } from "lucide-react";

export default async function LabVendorsLoading() {
  const t = await getTranslations("labVendors");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("pageDescription")}
      buttonLabel={t("addVendor")}
      statCards={[
        { label: t("statTotal"), icon: FlaskConical },
        { label: t("statActive"), icon: Boxes },
      ]}
      tableHeaders={[
        t("tableVendorName"),
        t("tableContactPerson"),
        t("tableEmail"),
        t("tablePhone"),
        t("tableActions"),
      ]}
      tableRows={6}
    />
  );
}
