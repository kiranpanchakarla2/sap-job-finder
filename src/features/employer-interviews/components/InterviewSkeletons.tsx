import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";

export function InterviewListSkeleton() {
  return (
    <div className="space-y-3">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <Skeleton className="h-10 w-full max-w-xl" />
      <Skeleton className="hidden h-12 w-full md:block" />
      <div className="grid gap-3 md:hidden">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonCard className="hidden h-64 md:block" />
    </div>
  );
}

export function InterviewDetailsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-8 w-56" />
      <SkeletonCard className="h-40" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-56" />
        </div>
        <div className="space-y-4">
          <SkeletonCard className="h-44" />
          <SkeletonCard className="h-40" />
        </div>
      </div>
    </div>
  );
}
