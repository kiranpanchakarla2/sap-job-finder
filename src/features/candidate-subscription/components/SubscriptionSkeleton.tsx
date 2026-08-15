"use client";

import { Skeleton } from "@/components/dashboard/shared/Skeleton";

export function SubscriptionSkeleton() {
  return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Loading subscription details">
      <div>
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="mt-2 h-4 w-72 rounded-md" />
      </div>

      {/* Current plan skeleton */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-8 w-56 rounded-lg" />
            <Skeleton className="h-4 w-80 rounded-md" />
          </div>
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      </div>

      {/* Usage card skeleton */}
      <div className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft space-y-4">
        <Skeleton className="h-6 w-36 rounded-md" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
      </div>

      {/* Plan cards skeleton */}
      <div>
        <Skeleton className="mb-4 h-6 w-32 rounded-md" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Skeleton className="h-96 rounded-[var(--radius-card)]" />
          <Skeleton className="h-96 rounded-[var(--radius-card)]" />
          <Skeleton className="h-96 rounded-[var(--radius-card)]" />
        </div>
      </div>
    </div>
  );
}
