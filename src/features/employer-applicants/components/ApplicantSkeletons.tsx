import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";

export function ApplicantTableSkeleton() {
  return (
    <div className="space-y-3">
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

export function ApplicantCardSkeleton() {
  return (
    <div className="grid gap-3">
      <SkeletonCard />
      <SkeletonCard />
      <SkeletonCard />
    </div>
  );
}

export function CandidateProfileSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-8 w-56" />
      <SkeletonCard className="h-36" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <SkeletonCard className="h-40" />
          <SkeletonCard className="h-56" />
          <SkeletonCard className="h-40" />
        </div>
        <div className="space-y-4">
          <SkeletonCard className="h-48" />
          <SkeletonCard className="h-40" />
          <SkeletonCard className="h-36" />
        </div>
      </div>
    </div>
  );
}

export function ApplicationDetailsSkeleton() {
  return <SkeletonCard className="h-48" />;
}
