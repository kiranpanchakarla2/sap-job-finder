import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";

export function TalentSearchSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="flex gap-4">
        <Skeleton className="hidden h-[32rem] w-[300px] shrink-0 rounded-[var(--radius-card)] lg:block" />
        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-6 w-48" />
          <SkeletonCard className="h-36" />
          <SkeletonCard className="h-36" />
          <SkeletonCard className="h-36" />
        </div>
      </div>
    </div>
  );
}

export function CandidateProfileSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4" aria-busy="true">
      <Skeleton className="h-4 w-48" />
      <SkeletonCard className="h-40" />
      <SkeletonCard className="h-56" />
      <SkeletonCard className="h-64" />
    </div>
  );
}
