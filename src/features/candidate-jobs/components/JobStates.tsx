"use client";

export function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
      <div className="flex gap-4">
        <div className="h-12 w-12 rounded-xl bg-surface" />
        <div className="flex-1 space-y-3">
          <div className="h-4 w-2/3 rounded bg-surface" />
          <div className="h-3 w-1/3 rounded bg-surface" />
          <div className="h-3 w-full rounded bg-surface" />
          <div className="flex gap-2">
            <div className="h-6 w-16 rounded-full bg-surface" />
            <div className="h-6 w-16 rounded-full bg-surface" />
            <div className="h-6 w-16 rounded-full bg-surface" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function JobListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <JobCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function JobEmptyState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-16 text-center shadow-soft">
      <p className="text-base font-semibold text-text">{title}</p>
      <p className="mt-1 text-sm text-muted">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] bg-primary px-4 text-sm font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

export function JobErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <JobEmptyState
      title="We couldn't load jobs right now."
      description="Please try again."
      actionLabel={onRetry ? "Try again" : undefined}
      onAction={onRetry}
    />
  );
}
