"use client";

import type { FunnelStage } from "../types/analytics.types";

export function ApplicationFunnel({ stages }: { stages: FunnelStage[] }) {
  if (!stages.length) {
    return <p className="text-sm text-muted">No funnel data for this period.</p>;
  }

  const max = Math.max(...stages.map((stage) => stage.count), 1);

  return (
    <div>
      <p className="sr-only">
        Application funnel:
        {stages
          .map((stage) => ` ${stage.label} ${stage.count} (${stage.percentage}%)`)
          .join(",")}
        .
      </p>
      <ol className="space-y-3" aria-hidden="true">
        {stages.map((stage, index) => {
          const width = Math.max(12, (stage.count / max) * 100);
          return (
            <li key={stage.key}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-text">
                  <span className="mr-2 text-xs text-muted">{index + 1}.</span>
                  {stage.label}
                </span>
                <span className="text-muted">
                  {stage.count.toLocaleString()} · {stage.percentage}%
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-surface">
                <div
                  className="h-full rounded-full bg-primary/80"
                  style={{ width: `${width}%` }}
                />
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
