"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Briefcase,
  Building2,
  Clock,
  MapPin,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useApplications } from "@/features/candidate-applications";
import { candidateJobService } from "../services/candidateJobService";
import { formatPostedAgo } from "../lib/formatPosted";
import {
  jobApplyHref,
  useJobsBasePath,
} from "../lib/jobsBasePath";
import type { DiscoveryJob } from "../types/job.types";
import { DiscoveryJobCard } from "../components/DiscoveryJobCard";
import { SaveJobButton } from "../components/SaveJobButton";
import { JobListSkeleton } from "../components/JobStates";

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface/60 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 text-sm font-semibold text-text">{value}</p>
    </div>
  );
}

function SkillChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-badge px-3 py-1 text-xs font-medium text-badge-fg"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CompanyAvatar({ job, size = "md" }: { job: DiscoveryJob; size?: "md" | "lg" }) {
  const dim = size === "lg" ? "h-14 w-14 text-lg" : "h-12 w-12 text-sm";
  if (job.companyLogoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={job.companyLogoUrl}
        alt=""
        className={`${dim} shrink-0 rounded-xl object-cover`}
      />
    );
  }
  return (
    <div
      className={`flex ${dim} shrink-0 items-center justify-center rounded-xl font-bold text-white`}
      style={{ backgroundColor: job.companyLogoColor }}
      aria-hidden="true"
    >
      {job.companyLogo}
    </div>
  );
}

export function JobDetailsPage() {
  const params = useParams<{ jobId?: string; id?: string }>();
  const jobId = params.jobId ?? params.id ?? "";
  const router = useRouter();
  const jobsBasePath = useJobsBasePath();
  const { getApplicationByJobId } = useApplications();
  const [job, setJob] = useState<DiscoveryJob | null>(null);
  const [companyJobs, setCompanyJobs] = useState<DiscoveryJob[]>([]);
  const [related, setRelated] = useState<DiscoveryJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const existingApplication = getApplicationByJobId(jobId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(false);
      const result = await candidateJobService.getJobById(jobId);
      if (cancelled) return;

      if (!result.success) {
        setError(true);
        setJob(null);
        setLoading(false);
        return;
      }

      if (!result.data) {
        setJob(null);
        setLoading(false);
        return;
      }

      // Active search hides drafts/closed; saved-job RLS may still return closed roles.
      setJob(result.data);
      if (result.data.status === "active") {
        const [companyResult, relatedResult] = await Promise.all([
          candidateJobService.getCompanyJobs(result.data.companyId, result.data.id, 3),
          candidateJobService.getRelatedJobs(result.data, 4),
        ]);
        if (cancelled) return;
        if (companyResult.success) setCompanyJobs(companyResult.data);
        if (relatedResult.success) setRelated(relatedResult.data);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId]);

  const onApply = () => {
    if (!job || job.status !== "active") return;
    if (existingApplication) {
      router.push(`/candidate/applications/${existingApplication.id}`);
      return;
    }
    router.push(jobApplyHref(jobsBasePath, job.id));
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="h-4 w-32 animate-pulse rounded bg-surface" />
        <JobListSkeleton count={2} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-16 text-center shadow-soft">
        <h1 className="text-xl font-bold text-text">We couldn&apos;t load this job</h1>
        <p className="mt-2 text-sm text-muted">Please try again in a moment.</p>
        <Button href={jobsBasePath} className="mt-6">
          Back to Jobs
        </Button>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="mx-auto max-w-3xl rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-16 text-center shadow-soft">
        <h1 className="text-xl font-bold text-text">Job not found</h1>
        <p className="mt-2 text-sm text-muted">
          This job may no longer be available.
        </p>
        <Button href={jobsBasePath} className="mt-6">
          Back to Jobs
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-24 lg:pb-8">
      <Link
        href={jobsBasePath}
        className="inline-flex text-sm font-medium text-primary hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
      >
        ← Back to jobs
      </Link>

      <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft sm:p-8">
        {job.status !== "active" ? (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800">
            No longer accepting applications — this role is closed or unavailable.
          </div>
        ) : null}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
            <CompanyAvatar job={job} size="lg" />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
                {job.title}
              </h1>
              <p className="mt-1 text-muted">{job.companyName}</p>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted">
                <span className="inline-flex items-center gap-1">
                  <MapPin size={15} aria-hidden="true" />
                  {job.location}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Briefcase size={15} aria-hidden="true" />
                  {job.experienceLabel}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Wallet size={15} aria-hidden="true" />
                  {job.salaryLabel}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Building2 size={15} aria-hidden="true" />
                  {job.workMode}
                </span>
                <span>{job.employmentType}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock size={15} aria-hidden="true" />
                  {formatPostedAgo(job.postedAt)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row lg:flex-col">
            <SaveJobButton jobId={job.id} variant="button" />
            {job.status === "active" ? (
              existingApplication ? (
                <>
                  <p className="text-sm font-semibold text-text">Already Applied</p>
                  <Button
                    href={`/candidate/applications/${existingApplication.id}`}
                    variant="secondary"
                    className="!h-10"
                  >
                    View Application
                  </Button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onApply}
                  className="theme-btn-primary inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] px-5 text-sm font-semibold text-button-fg shadow-[var(--shadow-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring"
                >
                  Apply Now
                </button>
              )
            ) : null}
          </div>
        </div>
      </section>

      <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
        <div className="space-y-8">
          <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-text">Job Overview</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <MetaItem label="Experience" value={job.experienceLabel} />
              <MetaItem label="Employment Type" value={job.employmentType} />
              <MetaItem label="Work Mode" value={job.workMode} />
              <MetaItem label="Location" value={job.location} />
              <MetaItem label="Salary" value={job.salaryLabel} />
              <MetaItem label="Department" value={job.department} />
            </div>
          </section>

          <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-text">About the Role</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted">
              {job.description}
            </p>
          </section>

          {job.responsibilities.length ? (
            <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-text">Responsibilities</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
                {job.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          {job.requiredSkills.length ? (
            <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-text">Required Skills</h2>
              <div className="mt-3">
                <SkillChips items={job.requiredSkills} />
              </div>
            </section>
          ) : null}

          {job.preferredSkills.length ? (
            <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-text">Preferred Skills</h2>
              <div className="mt-3">
                <SkillChips items={job.preferredSkills} />
              </div>
            </section>
          ) : null}

          {job.benefits.length ? (
            <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-text">Benefits</h2>
              <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-muted">
                {job.benefits.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="rounded-[var(--radius-card)] border border-border bg-card p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-text">About the Company</h2>
            <div className="mt-4 flex gap-4">
              <CompanyAvatar job={job} />
              <div>
                <p className="font-semibold text-text">{job.companyName}</p>
                {job.companyDescription ? (
                  <p className="mt-1 text-sm leading-relaxed text-muted">
                    {job.companyDescription}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-muted">
                    Company profile details will appear once the employer completes setup.
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  {job.industry ? <span>{job.industry}</span> : null}
                  {job.companySize ? <span>{job.companySize}</span> : null}
                  {job.companyLocation ? <span>{job.companyLocation}</span> : null}
                </div>
              </div>
            </div>
          </section>

          {companyJobs.length ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-text">
                More jobs from this company
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {companyJobs.map((item) => (
                  <DiscoveryJobCard key={item.id} job={item} />
                ))}
              </div>
            </section>
          ) : null}

          {related.length ? (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-text">You may also like</h2>
              <p className="mb-3 text-xs text-muted">
                Matched by SAP module, location, and title — not AI-powered.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {related.map((item) => (
                  <DiscoveryJobCard key={item.id} job={item} />
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="hidden h-fit rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft lg:sticky lg:top-24 lg:block">
          <p className="text-sm text-muted">Ready for the next step?</p>
          <p className="mt-1 text-lg font-semibold text-text">{job.salaryLabel}</p>
          <div className="mt-4 flex flex-col gap-2">
            {job.status === "active" ? (
              existingApplication ? (
                <Button
                  href={`/candidate/applications/${existingApplication.id}`}
                  variant="secondary"
                  className="!h-10"
                >
                  View Application
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={onApply}
                  className="theme-btn-primary inline-flex h-10 items-center justify-center rounded-[var(--radius-button)] text-sm font-semibold text-button-fg"
                >
                  Apply Now
                </button>
              )
            ) : (
              <p className="text-sm text-muted">Not accepting applications</p>
            )}
            <SaveJobButton jobId={job.id} variant="button" />
          </div>
          <p className="mt-4 text-xs text-muted">{formatPostedAgo(job.postedAt)}</p>
        </aside>
      </div>

      {job.status === "active" ? (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-6xl gap-2">
            <SaveJobButton jobId={job.id} variant="button" className="flex-1" />
            {existingApplication ? (
              <Button
                href={`/candidate/applications/${existingApplication.id}`}
                variant="secondary"
                className="!h-10 flex-1"
              >
                View Application
              </Button>
            ) : (
              <button
                type="button"
                onClick={onApply}
                className="theme-btn-primary inline-flex h-10 flex-1 items-center justify-center rounded-[var(--radius-button)] text-sm font-semibold text-button-fg"
              >
                Apply Now
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
