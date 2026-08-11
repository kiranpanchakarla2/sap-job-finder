"use client";

import { formatRate } from "../lib/calculations";
import type { HiringOverview } from "../types/analytics.types";

export function HiringOverviewCard({ data }: { data: HiringOverview }) {
  const metrics = [
    { label: "Hires", value: data.hires.toLocaleString() },
    { label: "Hire Rate", value: formatRate(data.hireRate) },
    {
      label: "Average Applications per Hire",
      value:
        data.averageApplicationsPerHire === null
          ? "—"
          : data.averageApplicationsPerHire.toLocaleString(),
    },
    {
      label: "Interview-to-Hire Rate",
      value: formatRate(data.interviewToHireRate),
    },
  ];

  return (
    <div>
      <p className="sr-only">
        Hiring overview. Hires {data.hires}. Hire rate {formatRate(data.hireRate)}.
        Average applications per hire{" "}
        {data.averageApplicationsPerHire ?? "not available"}. Interview to hire rate{" "}
        {formatRate(data.interviewToHireRate)}.
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {metrics.map((metric) => (
          <li
            key={metric.label}
            className="rounded-xl border border-border bg-surface/40 px-4 py-3"
          >
            <p className="text-sm text-muted">{metric.label}</p>
            <p className="mt-1 text-xl font-semibold text-text">{metric.value}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
