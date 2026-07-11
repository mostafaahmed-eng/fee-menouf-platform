import { DashboardSkeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background p-4 lg:p-6">
      <div className="mx-auto max-w-7xl">
        <DashboardSkeleton />
      </div>
    </div>
  );
}
