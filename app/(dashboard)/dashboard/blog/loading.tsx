import { Skeleton } from "@/components/ui/skeleton";

export default function BlogLoading() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
      <div className="rounded-md border p-4 space-y-3">
        <div className="flex justify-between pb-2 border-b">
           <Skeleton className="h-6 w-1/3" />
           <Skeleton className="h-6 w-20" />
           <Skeleton className="h-6 w-24" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex justify-between items-center py-2">
             <div className="space-y-2 w-1/2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
             </div>
             <Skeleton className="h-6 w-16" />
             <Skeleton className="h-6 w-24" />
             <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
             </div>
          </div>
        ))}
      </div>
    </div>
  );
}
