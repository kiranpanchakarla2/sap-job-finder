export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface ${className}`.trim()}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft ${className}`.trim()}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-4 h-8 w-16" />
      <Skeleton className="mt-3 h-3 w-32" />
    </div>
  );
}
