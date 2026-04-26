import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { Shield, Users, Settings } from "lucide-react";

export default async function PermissionsLoading() {
  const t = await getTranslations("permissions");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("pageDescription")}
      buttonLabel={t("saveChanges")}
      statCards={[
        { label: t("roles"), icon: Shield },
        { label: t("permissionsLabel"), icon: Settings },
        { label: t("selectRoleDescription"), icon: Users },
      ]}
      tableHeaders={[
        t("roles"),
        t("permissionsLabel"),
        t("selectedCount"),
        t("saveChanges"),
      ]}
      tableRows={6}
    />
  );
}
