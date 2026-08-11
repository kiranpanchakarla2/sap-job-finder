import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";

export function SubscriptionSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <SkeletonCard className="h-48" />
      <div className="grid gap-4 lg:grid-cols-3">
        <SkeletonCard className="h-80" />
        <SkeletonCard className="h-80" />
        <SkeletonCard className="h-80" />
      </div>
      <SkeletonCard className="h-64" />
    </div>
  );
}
