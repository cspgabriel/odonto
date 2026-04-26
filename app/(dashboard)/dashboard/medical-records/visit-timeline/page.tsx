import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { checkPermission } from "@/lib/auth/require-permission";
import { getTimelineEvents } from "@/lib/actions/medical-records-actions";
import { Card } from "@/components/ui/card";
import { VisitTimelineGantt } from "../_components/visit-timeline-gantt";
import VisitTimelineLoading from "./loading";
import { VisitTimelineHeader } from "../_components/visit-timeline-header";

const GANTT_PAGE_SIZE = 300;

export const metadata = {
  title: "Visit Timeline | Medical Records | CareNova",
  description: "Chronological view of visits, vitals, notes, diagnoses and attachments.",
};

export default async function VisitTimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ sortOrder?: string; patientId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [canEdit, canAdd] = await Promise.all([
    checkPermission("medical_records.edit"),
    checkPermission("medical_records.create"),
  ]);

  return (
    <Suspense fallback={<VisitTimelineLoading />}>
      <VisitTimelineContent
        searchParams={await searchParams}
        canEdit={canEdit}
        canAdd={canAdd}
      />
    </Suspense>
  );
}

async function VisitTimelineContent({
  searchParams,
  canEdit,
  canAdd,
}: {
  searchParams: { sortOrder?: string; patientId?: string };
  canEdit: boolean;
  canAdd: boolean;
}) {
  const { sortOrder = "desc", patientId } = searchParams;

  const { list } = await getTimelineEvents({
    patientId: patientId ?? undefined,
    page: 1,
    pageSize: GANTT_PAGE_SIZE,
    sortOrder: sortOrder as "asc" | "desc",
    onlyVisits: true,
  });

  return (
    <div className="flex h-[calc(100dvh-5rem)] min-h-0 min-w-0 w-full max-w-full flex-col overflow-hidden">
      <VisitTimelineHeader canAdd={canAdd} />
      <Card className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden p-0 gap-0 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm">
        <VisitTimelineGantt events={list} canEdit={canEdit} canAdd={canAdd} />
      </Card>
    </div>
  );
}
