"use client";

import { Building2, MapPin } from "lucide-react";
import {
  formatDisplayDate,
  formatExperienceRange,
  formatMultilineText,
  formatSalary,
} from "../lib/format";
import type { EmployerJobRecord } from "../types/job.types";
import { JobStatusBadge } from "./JobStatusBadge";

function TextBlock({ title, content }: { title: string; content: string }) {
  if (!content.trim()) return null;
  const lines = formatMultilineText(content);

  return (
    <section>
      <h2 className="text-lg font-semibold text-text">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-relaxed text-muted">
        {lines.map((line) => (
          <p key={`${title}-${line}`}>{line}</p>
        ))}
      </div>
    </section>
  );
}

export function JobPreviewView({ job }: { job: EmployerJobRecord }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem] xl:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="space-y-6">
        <header className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-surface">
              {job.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={job.logoUrl}
                  alt={`${job.company} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Building2 className="text-muted" size={24} aria-hidden="true" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-muted">{job.company}</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-text">
                {job.title}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} aria-hidden="true" />
                  {job.location}
                </span>
                <span>{job.workArrangement}</span>
                <span>{job.employmentType}</span>
                <span>
                  {formatExperienceRange(job.minExperience, job.maxExperience)}
                </span>
                <span>{job.sapModule}</span>
              </div>
              <div className="mt-3">
                <JobStatusBadge status={job.status} />
              </div>
            </div>
          </div>
        </header>

        <div className="space-y-6 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
          <TextBlock title="About the Role" content={job.description} />
          <TextBlock title="Responsibilities" content={job.responsibilities} />
          <TextBlock title="Requirements" content={job.requiredSkills} />
          <TextBlock title="Preferred Skills" content={job.preferredSkills} />

          <section>
            <h2 className="text-lg font-semibold text-text">Compensation</h2>
            <p className="mt-3 text-sm text-muted">{formatSalary(job)}</p>
          </section>

          {job.benefits.length > 0 ? (
            <section>
              <h2 className="text-lg font-semibold text-text">Benefits</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {job.benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-text"
                  >
                    {benefit}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <aside className="h-fit rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft lg:sticky lg:top-6">
        <h2 className="text-base font-semibold text-text">Job Details</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Experience
            </dt>
            <dd className="mt-1 text-text">
              {formatExperienceRange(job.minExperience, job.maxExperience)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Employment
            </dt>
            <dd className="mt-1 text-text">
              {job.employmentType} · {job.jobType}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Location
            </dt>
            <dd className="mt-1 text-text">{job.location}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Work arrangement
            </dt>
            <dd className="mt-1 text-text">{job.workArrangement}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              SAP module
            </dt>
            <dd className="mt-1 text-text">{job.sapModule}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">
              Posted date
            </dt>
            <dd className="mt-1 text-text">{formatDisplayDate(job.postedAt)}</dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}
