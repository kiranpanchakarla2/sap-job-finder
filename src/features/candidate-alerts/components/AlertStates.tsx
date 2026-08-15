"use client";

import { Bell, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AlertListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="h-5 w-48 animate-pulse rounded bg-surface" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-surface" />
          </div>
          <div className="mt-3 flex gap-2">
            <div className="h-4 w-20 animate-pulse rounded bg-surface" />
            <div className="h-4 w-24 animate-pulse rounded bg-surface" />
          </div>
          <div className="mt-4 flex gap-1.5">
            <div className="h-5 w-16 animate-pulse rounded-full bg-surface" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-surface" />
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-border/60 pt-3">
            <div className="h-4 w-24 animate-pulse rounded bg-surface" />
            <div className="h-8 w-20 animate-pulse rounded bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AlertEmptyState({
  onCreateAlert,
}: {
  onCreateAlert: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-16 text-center shadow-soft">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Bell size={26} aria-hidden="true" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-text">No job alerts yet</h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted">
        Create an alert and we&apos;ll help you discover matching SAP opportunities as soon as they are posted.
      </p>
      <button
        type="button"
        onClick={onCreateAlert}
        className="theme-btn-primary mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-button)] px-5 text-sm font-semibold text-button-fg shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        <Plus size={16} aria-hidden="true" />
        Create Job Alert
      </button>
    </div>
  );
}
