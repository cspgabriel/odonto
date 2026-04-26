import { redirect } from "next/navigation";

/** Invoice edit is done from the list sidebar only. Direct links to /invoices/[id] go to the list. */
export default async function InvoiceIdPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await params;
  redirect("/dashboard/invoices");
}
