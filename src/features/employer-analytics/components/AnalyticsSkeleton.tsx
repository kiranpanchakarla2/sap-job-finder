import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";

export function AnalyticsSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-live="polite">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-20 w-full rounded-[var(--radius-card)]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <SkeletonCard className="h-64" />
        <SkeletonCard className="h-64" />
      </div>
      <SkeletonCard className="h-56" />
    </div>
  );
}
