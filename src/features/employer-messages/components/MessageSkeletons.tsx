import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";

export function ConversationSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <SkeletonCard className="h-20" />
      <SkeletonCard className="h-20" />
      <SkeletonCard className="h-20" />
    </div>
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <Skeleton className="h-16 w-full" />
      <div className="flex-1 space-y-3">
        <Skeleton className="ml-auto h-14 w-2/3" />
        <Skeleton className="h-14 w-2/3" />
        <Skeleton className="ml-auto h-14 w-1/2" />
        <Skeleton className="h-14 w-3/5" />
      </div>
      <Skeleton className="h-14 w-full" />
    </div>
  );
}
