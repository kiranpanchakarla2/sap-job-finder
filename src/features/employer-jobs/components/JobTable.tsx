"use client";

import Link from "next/link";
import { EMPLOYER_JOB_ROUTES } from "../constants";
import { formatDisplayDate } from "../lib/format";
import type { EmployerJobRecord, JobAction } from "../types/job.types";
import { JobActionsMenu } from "./JobActionsMenu";
import { JobStatusBadge } from "./JobStatusBadge";

export function JobTable({
  jobs,
  onAction,
}: {
  jobs: EmployerJobRecord[];
  onAction: (action: JobAction, job: EmployerJobRecord) => void;
}) {
  return (
    <div className="hidden overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-soft md:block">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface/60 text-xs uppercase tracking-wide text-muted">
            <th className="px-4 py-3 font-semibold">Job</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Applications</th>
            <th className="px-4 py-3 font-semibold">Posted</th>
            <th className="px-4 py-3 font-semibold">Deadline</th>
            <th className="px-4 py-3 font-semibold">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b border-border/70 last:border-0">
              <td className="px-4 py-4">
                <Link
                  href={EMPLOYER_JOB_ROUTES.details(job.id)}
                  className="font-semibold text-text hover:text-primary"
                >
                  {job.title}
                </Link>
                <p className="mt-0.5 text-xs text-muted">
                  {job.sapModule} · {job.location}
                </p>
              </td>
              <td className="px-4 py-4">
                <JobStatusBadge status={job.status} />
              </td>
              <td className="px-4 py-4 text-muted">
                {job.applications} application{job.applications === 1 ? "" : "s"}
              </td>
              <td className="px-4 py-4 text-muted">{formatDisplayDate(job.postedAt)}</td>
              <td className="px-4 py-4 text-muted">{formatDisplayDate(job.deadline)}</td>
              <td className="px-4 py-4 text-right">
                <JobActionsMenu
                  status={job.status}
                  onAction={(action) => onAction(action, job)}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
