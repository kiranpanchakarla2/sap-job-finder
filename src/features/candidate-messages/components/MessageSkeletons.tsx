export function ConversationListSkeleton() {
  return (
    <div className="space-y-3 p-3" aria-label="Loading conversations">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="flex animate-pulse items-start gap-3 rounded-2xl border border-border/40 p-3.5"
        >
          <div className="h-11 w-11 shrink-0 rounded-xl bg-surface" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 rounded bg-surface" />
              <div className="h-3 w-12 rounded bg-surface" />
            </div>
            <div className="h-3 w-36 rounded bg-surface" />
            <div className="h-3 w-48 rounded bg-surface" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageThreadSkeleton() {
  return (
    <div className="flex h-full flex-col animate-pulse" aria-label="Loading message thread">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between border-b border-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-surface" />
          <div className="space-y-1.5">
            <div className="h-4 w-32 rounded bg-surface" />
            <div className="h-3 w-44 rounded bg-surface" />
          </div>
        </div>
        <div className="h-8 w-24 rounded-xl bg-surface" />
      </div>

      {/* Messages Skeleton */}
      <div className="flex-1 space-y-4 p-6">
        <div className="flex justify-start">
          <div className="h-16 w-2/3 rounded-2xl bg-surface" />
        </div>
        <div className="flex justify-end">
          <div className="h-12 w-1/2 rounded-2xl bg-surface" />
        </div>
        <div className="flex justify-start">
          <div className="h-20 w-3/4 rounded-2xl bg-surface" />
        </div>
        <div className="flex justify-end">
          <div className="h-14 w-2/3 rounded-2xl bg-surface" />
        </div>
      </div>

      {/* Composer Skeleton */}
      <div className="border-t border-border p-4">
        <div className="h-12 w-full rounded-xl bg-surface" />
      </div>
    </div>
  );
}
