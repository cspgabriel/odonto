import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { Users, Stethoscope, ClipboardList, DollarSign } from "lucide-react";

export default async function StaffLoading() {
  const t = await getTranslations("staff");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("pageDescription")}
      buttonLabel={t("addStaff")}
      statCards={[
        { label: t("statTotal"), icon: Users },
        { label: t("statDoctors"), icon: Stethoscope },
        { label: t("statNurses"), icon: ClipboardList },
        { label: t("statSalaryBudget"), icon: DollarSign },
      ]}
      tableHeaders={[
        t("tableStaffMember"),
        t("tableContact"),
        t("tableRole"),
        t("tableDepartment"),
        t("tableSalary"),
        t("tableWorkingDays"),
        t("tableJoinedDate"),
        t("tableActions"),
      ]}
      tableRows={6}
    />
  );
}
