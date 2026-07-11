import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] animate-pulse">
      <div className="hidden md:flex w-[72px] lg:w-[280px] flex-col border-r bg-card p-4 gap-4">
        <Skeleton className="h-8 w-20" />
        <div className="space-y-2 flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full" />
      </div>
      <div className="flex-1 flex flex-col">
        <div className="flex items-center gap-4 border-b p-4">
          <Skeleton className="h-8 w-8 md:hidden" />
          <Skeleton className="h-9 flex-1 max-w-md" />
          <div className="flex items-center gap-2">
            <Skeleton variant="circle" className="h-9 w-9" />
            <Skeleton variant="circle" className="h-9 w-9" />
            <Skeleton variant="circle" className="h-9 w-9" />
          </div>
        </div>
        <div className="flex-1 p-4 lg:p-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-96" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
