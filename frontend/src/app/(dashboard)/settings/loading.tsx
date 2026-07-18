import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-pulse">
      <div>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </div>
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
