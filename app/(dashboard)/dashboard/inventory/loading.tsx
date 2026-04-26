import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { Package, AlertTriangle, PackageX, DollarSign } from "lucide-react";

export default async function InventoryLoading() {
  const t = await getTranslations("inventory");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("pageDescription")}
      buttonLabel={t("addItem")}
      statCards={[
        { label: t("statTotal"), icon: Package },
        { label: t("statLowStock"), icon: AlertTriangle },
        { label: t("statOutOfStock"), icon: PackageX },
        { label: t("statTotalValue"), icon: DollarSign },
      ]}
      tableHeaders={[
        t("tableName"),
        t("tableCategory"),
        t("tableQuantity"),
        t("tableTotalValue"),
        t("tableStatus"),
        t("tableExpiry"),
        t("tableActions"),
      ]}
      tableRows={6}
    />
  );
}
