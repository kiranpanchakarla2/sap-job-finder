"use client";

import Link from "next/link";
import { Briefcase, Building2, Calendar, CheckCircle2, Clock, MapPin, Trash2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useApplications } from "@/features/candidate-applications";
import type { DiscoveryJob, MatchTier } from "../types/job.types";
import { formatPostedAgo, formatSavedAgo } from "../lib/formatPosted";
import { jobApplyHref, jobDetailsHref, useJobsBasePath } from "../lib/jobsBasePath";
import { JobMatchBadge } from "./JobMatchBadge";
import { SaveJobButton } from "./SaveJobButton";

export function DiscoveryJobCard({
  job,
  savedAt,
  matchTier,
  showRemove,
  onRemove,
  showClosedBadge,
  showApplyNow = false,
}: {
  job: DiscoveryJob;
  savedAt?: string;
  matchTier?: MatchTier | null;
  showRemove?: boolean;
  onRemove?: (jobId: string) => void;
  showClosedBadge?: boolean;
  showApplyNow?: boolean;
}) {
  const jobsBasePath = useJobsBasePath();
  const detailsHref = jobDetailsHref(jobsBasePath, job.id);
  const applyHref = jobApplyHref(jobsBasePath, job.id);
  const { getApplicationByJobId } = useApplications();
  const existingApplication = getApplicationByJobId(job.id);
  const isClosed = job.status === "closed" || showClosedBadge;

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
                {isClosed ? (
                  <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                    Job Closed
                  </span>
                ) : existingApplication ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={12} aria-hidden="true" />
                    Applied
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

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <Clock size={12} aria-hidden="true" />
              {formatPostedAgo(job.postedAt)}
            </span>
            {savedAt ? (
              <span className="inline-flex items-center gap-1 text-primary">
                <Calendar size={12} aria-hidden="true" />
                {formatSavedAgo(savedAt)}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        <Button href={detailsHref} variant="secondary" className="!h-9 px-4 py-0 text-xs">
          View Job
        </Button>

        {isClosed ? (
          <span className="inline-flex h-9 items-center px-2 text-xs font-medium text-muted">
            No longer accepting applications
          </span>
        ) : existingApplication ? (
          <Button
            href={`/candidate/applications/${existingApplication.id}`}
            variant="secondary"
            className="!h-9 !border-emerald-500/30 !bg-emerald-500/10 px-4 py-0 text-xs !text-emerald-700 hover:!bg-emerald-500/20 dark:!text-emerald-400"
          >
            View Application
          </Button>
        ) : showApplyNow ? (
          <Button href={applyHref} variant="primary" className="!h-9 px-4 py-0 text-xs">
            Apply Now
          </Button>
        ) : null}

        {showRemove ? (
          <button
            type="button"
            onClick={() => onRemove?.(job.id)}
            className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-[var(--radius-button)] border border-border bg-card px-3 text-xs font-semibold text-muted transition hover:border-error/40 hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
            aria-label={`Remove ${job.title} from Saved Jobs`}
          >
            <Trash2 size={13} aria-hidden="true" />
            <span>Remove</span>
          </button>
        ) : null}
      </div>
    </article>
  );
}
