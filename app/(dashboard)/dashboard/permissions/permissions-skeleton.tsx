import { Skeleton } from "@/components/ui/skeleton";

export function PermissionsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
      <div className="space-y-2 rounded-xl border bg-card p-4">
        <Skeleton className="mb-3 h-5 w-24" />
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-11 w-full rounded-lg" />
        ))}
      </div>

      <div className="space-y-4 rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1 rounded-lg" />
          <Skeleton className="h-9 w-48 rounded-lg" />
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Array.from({ length: 16 }).map((_, i) => (
            <Skeleton key={i} className="h-[58px] rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
