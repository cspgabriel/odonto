import { redirect } from "next/navigation";

export default async function BillingInvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/dashboard/invoices");
}
