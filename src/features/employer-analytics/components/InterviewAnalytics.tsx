"use client";

import { formatRate } from "../lib/calculations";
import type { InterviewAnalytics } from "../types/analytics.types";

export function InterviewAnalyticsCard({
  data,
}: {
  data: InterviewAnalytics;
}) {
  const total =
    data.scheduled ||
    data.completed + data.cancelled + data.noShow;

  const rows = [
    { label: "Scheduled", count: data.scheduled, key: "scheduled" },
    { label: "Completed", count: data.completed, key: "completed" },
    { label: "Cancelled", count: data.cancelled, key: "cancelled" },
    { label: "No-show", count: data.noShow, key: "noShow" },
  ];

  return (
    <div>
      <p className="sr-only">
        Interview performance. Scheduled {data.scheduled}, completed {data.completed},
        cancelled {data.cancelled}, no-show {data.noShow}. Completion rate{" "}
        {formatRate(data.completionRate)}.
      </p>
      <div className="mb-4 rounded-xl border border-border bg-surface/40 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Interview completion rate
        </p>
        <p className="mt-1 text-2xl font-bold text-text">
          {formatRate(data.completionRate)}
        </p>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {rows.map((row) => {
          const pct = total > 0 ? Math.round((row.count / Math.max(data.scheduled, 1)) * 1000) / 10 : 0;
          return (
            <li
              key={row.key}
              className="rounded-xl border border-border bg-surface/40 px-3 py-3"
            >
              <p className="text-sm text-muted">{row.label}</p>
              <p className="mt-1 text-lg font-semibold text-text">{row.count}</p>
              <p className="mt-0.5 text-xs text-muted">{pct}% of scheduled</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
