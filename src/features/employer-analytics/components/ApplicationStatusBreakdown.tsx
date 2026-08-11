"use client";

import type { StatusBreakdownItem } from "../types/analytics.types";

const TONE_BY_KEY: Record<string, string> = {
  new: "bg-sky-500",
  reviewing: "bg-amber-500",
  shortlisted: "bg-emerald-500",
  interview: "bg-primary",
  hired: "bg-success",
  rejected: "bg-error",
};

export function ApplicationStatusBreakdown({
  items,
}: {
  items: StatusBreakdownItem[];
}) {
  if (!items.length) {
    return <p className="text-sm text-muted">No application status data for this period.</p>;
  }

  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div>
      <p className="sr-only">
        Application status breakdown:
        {items
          .map((item) => ` ${item.label} ${item.count} (${item.percentage}%)`)
          .join(",")}
        .
      </p>

      <div
        className="flex h-3 overflow-hidden rounded-full bg-surface"
        aria-hidden="true"
      >
        {items.map((item) =>
          item.count > 0 ? (
            <div
              key={item.key}
              className={`${TONE_BY_KEY[item.key] ?? "bg-muted"} h-full`}
              style={{ width: `${total > 0 ? (item.count / total) * 100 : 0}%` }}
              title={`${item.label}: ${item.count}`}
            />
          ) : null,
        )}
      </div>

      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface/40 px-3 py-2.5"
          >
            <span className="flex items-center gap-2 text-sm text-text">
              <span
                className={`h-2.5 w-2.5 rounded-full ${TONE_BY_KEY[item.key] ?? "bg-muted"}`}
                aria-hidden="true"
              />
              {item.label}
            </span>
            <span className="text-sm text-muted">
              {item.count} · {item.percentage}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
