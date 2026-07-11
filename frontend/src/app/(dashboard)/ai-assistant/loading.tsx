import { Skeleton } from "@/components/ui/skeleton";

export default function AiAssistantLoading() {
  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden animate-pulse">
      <div className="w-72 border-l flex flex-col bg-muted/20">
        <div className="flex items-center justify-between border-b p-3">
          <Skeleton className="h-5 w-16" />
          <Skeleton variant="circle" className="h-8 w-8" />
        </div>
        <div className="flex-1 p-2 space-y-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <Skeleton variant="circle" className="h-8 w-8" />
            <div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12 mt-1" />
            </div>
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <div className="flex-1 mx-auto max-w-3xl w-full py-4 space-y-4 px-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <div className={`space-y-2 ${i % 2 === 0 ? '' : 'items-end'}`}>
                <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-64' : 'w-48'}`} />
                <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-48' : 'w-32'}`} />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-4">
          <div className="mx-auto max-w-4xl">
            <Skeleton className="h-12 w-full rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
