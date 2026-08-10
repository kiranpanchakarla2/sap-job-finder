"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Pencil } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import {
  applicationService,
  JobApplicantsPanel,
} from "@/features/employer-applicants";
import { JobConfirmationDialog } from "../components/JobConfirmationDialog";
import { JobPreviewView } from "../components/JobPreviewView";
import { JobStatusBadge } from "../components/JobStatusBadge";
import { EMPLOYER_JOB_ROUTES } from "../constants";
import { canPerformJobAction } from "../lib/actions";
import { useJob } from "../hooks/useJob";
import { useJobMutations } from "../hooks/useJobMutations";
import type { JobAction } from "../types/job.types";

type DetailsTab = "overview" | "applications" | "activity";

export function JobDetailsPage({ jobId }: { jobId: string }) {
  const { job, isLoading, isError, error, reload } = useJob(jobId);
  const [tab, setTab] = useState<DetailsTab>("overview");
  const [applicantCount, setApplicantCount] = useState(0);
  const {
    confirmOpen,
    confirmCopy,
    confirmLoading,
    closeConfirm,
    confirmAction,
    handleAction,
  } = useJobMutations(() => void reload());

  useEffect(() => {
    let active = true;
    void applicationService.countForJob(jobId).then((result) => {
      if (!active) return;
      if (result.success) setApplicantCount(result.data);
    });
    return () => {
      active = false;
    };
  }, [jobId, tab]);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-8 w-48" />
        <SkeletonCard className="h-36" />
        <SkeletonCard className="h-72" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <ErrorState
        title="Unable to load job details."
        description={error ?? undefined}
        onRetry={() => void reload()}
      />
    );
  }

  const headerActions: { action: JobAction; label: string; variant?: "primary" | "secondary" }[] =
    [];
  if (canPerformJobAction(job.status, "edit")) {
    headerActions.push({ action: "edit", label: "Edit", variant: "secondary" });
  }
  if (canPerformJobAction(job.status, "duplicate")) {
    headerActions.push({ action: "duplicate", label: "Duplicate", variant: "secondary" });
  }
  if (canPerformJobAction(job.status, "pause")) {
    headerActions.push({ action: "pause", label: "Pause", variant: "secondary" });
  }
  if (canPerformJobAction(job.status, "resume")) {
    headerActions.push({ action: "resume", label: "Resume", variant: "secondary" });
  }
  if (canPerformJobAction(job.status, "close")) {
    headerActions.push({ action: "close", label: "Close", variant: "secondary" });
  }
  if (canPerformJobAction(job.status, "publish")) {
    headerActions.push({ action: "publish", label: "Publish", variant: "primary" });
  }
  if (canPerformJobAction(job.status, "preview")) {
    headerActions.push({ action: "preview", label: "Preview", variant: "secondary" });
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Job Details
        </h1>
        <p className="mt-1 text-sm text-muted">
          Review posting details, applications, and recent activity.
        </p>
      </div>

      <header className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex gap-4">
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
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-text">{job.title}</h2>
                <JobStatusBadge status={job.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin size={14} aria-hidden="true" />
                  {job.location}
                </span>
                <span>{job.sapModule}</span>
                <span>
                  {applicantCount} application
                  {applicantCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {headerActions.map((item) =>
              item.action === "edit" ? (
                <Button
                  key={item.action}
                  variant={item.variant}
                  href={EMPLOYER_JOB_ROUTES.edit(job.id)}
                >
                  <Pencil size={15} aria-hidden="true" />
                  {item.label}
                </Button>
              ) : (
                <Button
                  key={item.action}
                  variant={item.variant}
                  onClick={() => void handleAction(item.action, job)}
                >
                  {item.label}
                </Button>
              ),
            )}
          </div>
        </div>
      </header>

      <div
        role="tablist"
        aria-label="Job detail sections"
        className="flex flex-wrap gap-2 border-b border-border pb-1"
      >
        {(
          [
            { id: "overview", label: "Overview" },
            { id: "applications", label: "Applications" },
            { id: "activity", label: "Activity" },
          ] as const
        ).map((item) => {
          const selected = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setTab(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 ${
                selected
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-surface hover:text-text"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {tab === "overview" ? <JobPreviewView job={job} /> : null}

      {tab === "applications" ? (
        <JobApplicantsPanel jobId={job.id} jobTitle={job.title} />
      ) : null}

      {tab === "activity" ? (
        <div className="rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft">
          <h3 className="text-base font-semibold text-text">Recent activity</h3>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>
              Status set to <span className="font-medium text-text">{job.status}</span>
            </li>
            <li>
              Last updated{" "}
              <span className="font-medium text-text">
                {new Intl.DateTimeFormat("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                }).format(new Date(job.updatedAt))}
              </span>
            </li>
            {job.postedAt ? (
              <li>
                Posted on{" "}
                <span className="font-medium text-text">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  }).format(new Date(`${job.postedAt}T00:00:00`))}
                </span>
              </li>
            ) : (
              <li>This job has not been published yet.</li>
            )}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Full activity history will connect to Supabase in a later sprint.{" "}
            <Link href={EMPLOYER_JOB_ROUTES.edit(job.id)} className="font-semibold text-primary">
              Edit this job
            </Link>
          </p>
        </div>
      ) : null}

      {confirmCopy ? (
        <JobConfirmationDialog
          open={confirmOpen}
          title={confirmCopy.title}
          description={confirmCopy.description}
          confirmLabel={confirmCopy.confirmLabel}
          tone={confirmCopy.tone}
          loading={confirmLoading}
          onCancel={closeConfirm}
          onConfirm={() => void confirmAction()}
        />
      ) : null}
    </div>
  );
}
