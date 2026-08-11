"use client";

import { NativeSelect } from "@/components/ui/NativeSelect";
import type {
  AnalyticsDateRange,
  AnalyticsFilters,
  AnalyticsJobOption,
} from "../types/analytics.types";

const DATE_OPTIONS: { value: AnalyticsDateRange; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "year", label: "This Year" },
  { value: "custom", label: "Custom" },
];

export function AnalyticsFiltersBar({
  filters,
  jobs,
  onChange,
}: {
  filters: AnalyticsFilters;
  jobs: AnalyticsJobOption[];
  onChange: (patch: Partial<AnalyticsFilters>) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft sm:flex-row sm:flex-wrap sm:items-end">
      <div className="min-w-[10rem] flex-1">
        <label htmlFor="analytics-date-range" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Date Range
        </label>
        <NativeSelect
          id="analytics-date-range"
          value={filters.dateRange}
          onChange={(event) =>
            onChange({ dateRange: event.target.value as AnalyticsDateRange })
          }
          className="rounded-[var(--radius-control)] border border-border bg-input px-3 py-2.5 text-sm text-input-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          {DATE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </NativeSelect>
      </div>

      {filters.dateRange === "custom" ? (
        <>
          <div className="min-w-[10rem] flex-1">
            <label htmlFor="analytics-start" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              Start Date
            </label>
            <input
              id="analytics-start"
              type="date"
              value={filters.customStart ?? ""}
              onChange={(event) => onChange({ customStart: event.target.value })}
              className="w-full rounded-[var(--radius-control)] border border-border bg-input px-3 py-2.5 text-sm text-input-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            />
          </div>
          <div className="min-w-[10rem] flex-1">
            <label htmlFor="analytics-end" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
              End Date
            </label>
            <input
              id="analytics-end"
              type="date"
              value={filters.customEnd ?? ""}
              onChange={(event) => onChange({ customEnd: event.target.value })}
              className="w-full rounded-[var(--radius-control)] border border-border bg-input px-3 py-2.5 text-sm text-input-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            />
          </div>
        </>
      ) : null}

      <div className="min-w-[12rem] flex-1">
        <label htmlFor="analytics-job" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
          Job
        </label>
        <NativeSelect
          id="analytics-job"
          value={filters.jobId}
          onChange={(event) => onChange({ jobId: event.target.value })}
          className="rounded-[var(--radius-control)] border border-border bg-input px-3 py-2.5 text-sm text-input-fg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          <option value="all">All Jobs</option>
          {jobs.map((job) => (
            <option key={job.id} value={job.id}>
              {job.title}
            </option>
          ))}
        </NativeSelect>
      </div>
    </div>
  );
}
