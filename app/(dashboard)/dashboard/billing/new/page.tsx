import { redirect } from "next/navigation";

export default async function BillingNewPage({
  searchParams,
}: {
  searchParams: Promise<{ appointmentId?: string }>;
}) {
  const { appointmentId } = await searchParams;
  const q = appointmentId ? `?appointmentId=${appointmentId}` : "";
  redirect(`/dashboard/invoices/new${q}`);
}
