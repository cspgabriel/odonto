import { redirect } from "next/navigation";

/** Patient detail is shown in the Full Profile bottom sheet on the patients list page. */
export default async function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/dashboard/patients?fullProfile=${encodeURIComponent(id)}`);
}
