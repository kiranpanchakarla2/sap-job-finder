"use client";

import Link from "next/link";
import { Briefcase, Building2, MapPin, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { DiscoveryJob, MatchTier } from "../types/job.types";
import { formatPostedAgo } from "../lib/formatPosted";
import { jobDetailsHref, useJobsBasePath } from "../lib/jobsBasePath";
import { JobMatchBadge } from "./JobMatchBadge";
import { SaveJobButton } from "./SaveJobButton";

export function DiscoveryJobCard({
  job,
  matchTier,
  showRemove,
  onRemove,
  showClosedBadge,
}: {
  job: DiscoveryJob;
  matchTier?: MatchTier | null;
  showRemove?: boolean;
  onRemove?: (jobId: string) => void;
  showClosedBadge?: boolean;
}) {
  const jobsBasePath = useJobsBasePath();
  const detailsHref = jobDetailsHref(jobsBasePath, job.id);
  return (
    <article className="flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft transition duration-[var(--motion-hover-ms,180ms)] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lift">
      <div className="flex gap-4">
        {job.companyLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={job.companyLogoUrl}
            alt=""
            className="h-12 w-12 shrink-0 rounded-xl object-cover"
          />
        ) : (
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
            style={{ backgroundColor: job.companyLogoColor }}
            aria-hidden="true"
          >
            {job.companyLogo}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href={detailsHref}
                  className="line-clamp-2 text-base font-semibold leading-snug text-text hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  {job.title}
                </Link>
                <JobMatchBadge tier={matchTier} />
                {showClosedBadge ? (
                  <span className="rounded-full bg-muted/20 px-2.5 py-1 text-[11px] font-semibold text-muted">
                    No longer accepting applications
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-sm text-muted">{job.companyName}</p>
            </div>
            <SaveJobButton jobId={job.id} />
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} aria-hidden="true" />
              {job.location}
            </span>
            <span className="inline-flex items-center gap-1">
              <Briefcase size={13} aria-hidden="true" />
              {job.experienceLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <Wallet size={13} aria-hidden="true" />
              {job.salaryLabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <Building2 size={13} aria-hidden="true" />
              {job.workMode}
            </span>
            <span>{job.employmentType}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.sapModules.slice(0, 2).map((module) => (
              <span
                key={module}
                className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary"
              >
                {module}
              </span>
            ))}
            {job.requiredSkills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-badge px-2.5 py-1 text-[11px] font-medium text-badge-fg"
              >
                {skill}
              </span>
            ))}
          </div>

          <p className="mt-3 text-xs text-muted">{formatPostedAgo(job.postedAt)}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button href={detailsHref} variant="secondary" className="!h-9 px-4 py-0 text-xs">
          View Job
        </Button>
        {showRemove ? (
          <button
            type="button"
            onClick={() => onRemove?.(job.id)}
            className="inline-flex h-9 items-center justify-center rounded-[var(--radius-button)] border border-border px-4 text-xs font-semibold text-muted transition hover:border-error/40 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
          >
            Remove
          </button>
        ) : null}
      </div>
    </article>
  );
}
