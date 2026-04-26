import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText } from "lucide-react";

export default function InvoicesLoading() {
  return (
    <div className="flex flex-col gap-3 w-full pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pt-4">
        <div>
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-border/50 py-0">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-4 pt-4">
              <Skeleton className="h-3 w-24" />
              <div className="rounded-lg bg-muted p-1">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 shadow-sm bg-white dark:bg-[#0B0B1E]">
        <div className="p-4 border-b border-slate-200/60 dark:border-slate-800/60">
          <Skeleton className="h-10 w-full max-w-md" />
        </div>
        <div className="border-t border-slate-200/60 dark:border-slate-800/60">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-none border-b border-slate-200/60 dark:border-slate-800/60 last:border-b-0" />
          ))}
        </div>
      </div>
    </div>
  );
}
