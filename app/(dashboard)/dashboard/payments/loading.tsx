import { getTranslations } from "next-intl/server";
import { PageSkeleton } from "@/components/dashboard/page-skeleton";
import { CreditCard, DollarSign, Receipt } from "lucide-react";

export default async function PaymentsLoading() {
  const t = await getTranslations("payments");
  return (
    <PageSkeleton
      pageTitle={t("title")}
      pageDescription={t("pageDescription")}
      buttonLabel={t("addPayment")}
      statCards={[
        { label: t("statTotalPayments"), icon: CreditCard },
        { label: t("statTotalRevenue"), icon: DollarSign },
        { label: t("statThisMonth"), icon: Receipt },
      ]}
      tableHeaders={[
        t("tablePayment"),
        t("tableInvoice"),
        t("tablePatient"),
        t("tableAmount"),
        t("tableMethod"),
        t("tableStatus"),
        t("tableDate"),
        t("tableActions"),
      ]}
      tableRows={6}
    />
  );
}
