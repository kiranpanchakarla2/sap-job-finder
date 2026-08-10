"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { EMPLOYER_JOB_ROUTES } from "../constants";
import { formatDisplayDate } from "../lib/format";
import type { EmployerJobRecord, JobAction } from "../types/job.types";
import { JobActionsMenu } from "./JobActionsMenu";
import { JobStatusBadge } from "./JobStatusBadge";

export function JobCard({
  job,
  onAction,
}: {
  job: EmployerJobRecord;
  onAction: (action: JobAction, job: EmployerJobRecord) => void;
}) {
  return (
    <article className="rounded-[var(--radius-card)] border border-border bg-card p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={EMPLOYER_JOB_ROUTES.details(job.id)}
            className="block text-base font-semibold text-text hover:text-primary"
          >
            {job.title}
          </Link>
          <p className="mt-1 text-sm text-muted">{job.sapModule}</p>
        </div>
        <JobActionsMenu status={job.status} onAction={(action) => onAction(action, job)} />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span className="inline-flex items-center gap-1">
          <MapPin size={12} aria-hidden="true" />
          {job.location}
        </span>
        <span>{job.employmentType}</span>
        <span>{job.workArrangement}</span>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <JobStatusBadge status={job.status} />
        <span className="text-xs text-muted">
          {job.applications} application{job.applications === 1 ? "" : "s"}
        </span>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="font-medium uppercase tracking-wide text-muted">Posted</dt>
          <dd className="mt-1 text-sm text-text">{formatDisplayDate(job.postedAt)}</dd>
        </div>
        <div>
          <dt className="font-medium uppercase tracking-wide text-muted">Deadline</dt>
          <dd className="mt-1 text-sm text-text">{formatDisplayDate(job.deadline)}</dd>
        </div>
      </dl>
    </article>
  );
}
