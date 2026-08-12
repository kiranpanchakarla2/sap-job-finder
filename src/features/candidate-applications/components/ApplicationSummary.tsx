"use client";

import type { DiscoveryJob } from "@/features/candidate-jobs/types/job.types";
import type { ApplicationJobSnapshot } from "../types/application.types";

type SummaryJob = Pick<
  DiscoveryJob,
  | "title"
  | "companyName"
  | "location"
  | "workMode"
  | "employmentType"
  | "experienceLabel"
  | "salaryLabel"
> | ApplicationJobSnapshot;

export function ApplicationSummary({
  job,
  className = "",
}: {
  job: SummaryJob;
  className?: string;
}) {
  const rows = [
    { label: "Job", value: job.title },
    { label: "Company", value: job.companyName },
    { label: "Location", value: job.location },
    { label: "Work Mode", value: job.workMode },
    { label: "Employment", value: job.employmentType },
    { label: "Experience", value: job.experienceLabel },
    { label: "Salary", value: "salaryLabel" in job ? job.salaryLabel : "" },
  ].filter((row) => row.value);

  return (
    <aside
      className={`rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft ${className}`.trim()}
      aria-label="Application summary"
    >
      <h2 className="text-sm font-semibold text-text">Application Summary</h2>
      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {row.label}
            </dt>
            <dd className="mt-0.5 text-sm font-medium text-text">{row.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
