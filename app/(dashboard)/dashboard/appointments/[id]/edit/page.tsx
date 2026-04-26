import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/require-permission";

export default async function EditAppointmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const canEdit = await checkPermission("appointments.edit");
  if (!canEdit) redirect("/dashboard/appointments");

  const { id } = await params;
  redirect(`/dashboard/appointments?edit=${id}`);
}
