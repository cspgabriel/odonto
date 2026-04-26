import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

export default function VisitTimelineLoading() {
  return (
    <div className="flex flex-col w-full max-w-full min-w-0 h-[calc(100dvh-5rem)] overflow-hidden">
      <div className="shrink-0 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4 pb-3">
        <div className="min-w-0">
          <h1 className="text-3xl font-black tracking-tight font-heading text-slate-900 dark:text-white">
            Visit Timeline
          </h1>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Appointments with duration. Drag bars to edit date; scroll horizontally for more months.
          </p>
        </div>
        <Button disabled className="shrink-0 h-9 px-4 opacity-60 cursor-not-allowed">
          Add appointment
        </Button>
      </div>

      <Card className="flex-1 min-h-0 overflow-hidden flex flex-col p-0 gap-0 rounded-xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm w-full max-w-full min-w-0">
        <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden">
          <div className="flex flex-col w-[300px] shrink-0 border-r border-slate-200/60 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-900/30">
            <div className="flex items-end justify-between gap-2.5 p-2.5 border-b border-slate-200/60 dark:border-slate-800/60">
              <Skeleton className="h-4 w-24 rounded" />
              <Skeleton className="h-4 w-16 rounded" />
            </div>
            <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5">
                  <Skeleton className="h-2 w-2 rounded-full shrink-0" />
                  <Skeleton className="h-4 flex-1 rounded" />
                  <Skeleton className="h-4 w-16 rounded shrink-0" />
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex gap-2 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-8 flex-1 rounded" />
              ))}
            </div>
            <div className="flex gap-1 p-2 min-h-[200px]">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex flex-col gap-1 flex-1 min-w-0">
                  <Skeleton className="h-6 w-full rounded" />
                  <Skeleton className="h-6 w-3/4 rounded" />
                  <Skeleton className="h-6 w-1/2 rounded" />
                  <Skeleton className="h-6 w-full rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
