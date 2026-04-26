import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function CalendarLoading() {
  return (
    <div className="dashboard-page">
      <div className="dashboard-page-header">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Card className="flex flex-col gap-6 rounded-2xl border border-slate-200/60 dark:border-slate-800/60 py-12 shadow-sm bg-slate-50/50 dark:bg-slate-900/50 items-center justify-center">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2 text-center">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-4 w-72 mx-auto" />
        </div>
      </Card>
    </div>
  );
}
