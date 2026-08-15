"use client";

import { Skeleton } from "@/components/dashboard/shared/Skeleton";

export function NotificationItemSkeleton() {
  return (
    <div
      className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-4 sm:p-5 shadow-soft"
      aria-hidden="true"
    >
      <div className="flex items-start gap-3.5">
        <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-5 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

export function NotificationListSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading notifications" aria-busy="true">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-16" />
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <div className="space-y-2.5">
          <NotificationItemSkeleton />
          <NotificationItemSkeleton />
          <NotificationItemSkeleton />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-3 w-20" />
          <div className="h-px flex-1 bg-border/60" />
        </div>
        <div className="space-y-2.5">
          <NotificationItemSkeleton />
          <NotificationItemSkeleton />
        </div>
      </div>
    </div>
  );
}
