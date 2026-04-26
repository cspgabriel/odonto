import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { Calendar, CheckCircle, Clock } from "lucide-react";

export default async function AppointmentsLoading() {
  const t = await getTranslations("appointments");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("description")}
      buttonLabel={t("bookAppointment")}
      statCards={[
        { label: t("total"), icon: Calendar, variant: "simple" },
        { label: t("completed"), icon: CheckCircle, variant: "simple" },
        { label: t("pending"), icon: Clock, variant: "simple" },
      ]}
      tableHeaders={[
        t("tableDate"),
        t("tablePatient"),
        t("tableDoctor"),
        t("tableStatus"),
        t("actions"),
      ]}
      tableRows={6}
    />
  );
}
