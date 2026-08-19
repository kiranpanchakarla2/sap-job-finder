"use client";

/**
 * DashboardSkeleton Component
 * Full skeleton placeholder for the initial dashboard render.
 */

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <div className="h-8 w-48 rounded bg-surface/80" />
          <div className="h-4 w-72 rounded bg-surface/50" />
        </div>
        <div className="flex gap-3">
          <div className="h-9 w-32 rounded bg-surface/60" />
          <div className="h-9 w-24 rounded bg-surface/60" />
        </div>
      </div>

      {/* Users KPIs Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-32 rounded bg-surface/50" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-[var(--radius-card)] border border-border bg-card p-5"
            />
          ))}
        </div>
      </div>

      {/* Subscriptions KPIs Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-44 rounded bg-surface/50" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-[var(--radius-card)] border border-border bg-card p-5"
            />
          ))}
        </div>
      </div>

      {/* Payments KPIs Skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-40 rounded bg-surface/50" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 rounded-[var(--radius-card)] border border-border bg-card p-5"
            />
          ))}
        </div>
      </div>

      {/* Pending Payments Table Skeleton */}
      <div className="h-56 rounded-[var(--radius-card)] border border-border bg-card p-5" />

      {/* 2-Column Grid Skeletons */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-[var(--radius-card)] border border-border bg-card p-5" />
        <div className="h-72 rounded-[var(--radius-card)] border border-border bg-card p-5" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-[var(--radius-card)] border border-border bg-card p-5" />
        <div className="h-72 rounded-[var(--radius-card)] border border-border bg-card p-5" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-44 rounded-[var(--radius-card)] border border-border bg-card p-5" />
        <div className="h-44 rounded-[var(--radius-card)] border border-border bg-card p-5" />
      </div>
    </div>
  );
}
