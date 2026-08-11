"use client";

import { formatRate } from "../lib/calculations";
import type { TopPerformingJob } from "../types/analytics.types";

export function TopPerformingJobs({ jobs }: { jobs: TopPerformingJob[] }) {
  if (!jobs.length) {
    return <p className="text-sm text-muted">No top performing jobs for this period.</p>;
  }

  return (
    <ol className="space-y-3">
      {jobs.map((job) => (
        <li
          key={job.jobId}
          className="flex flex-col gap-2 rounded-xl border border-border bg-surface/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text">
              <span className="mr-2 text-muted">{job.rank}.</span>
              {job.title}
            </p>
            <p className="mt-1 text-xs text-muted">
              {job.applications} applications · Shortlist {formatRate(job.shortlistRate)} ·
              Interview {formatRate(job.interviewRate)} · Hire {formatRate(job.hireRate)}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
