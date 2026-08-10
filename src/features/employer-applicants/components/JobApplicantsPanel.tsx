"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { EMPLOYER_APPLICANT_ROUTES } from "../constants";
import { formatApplicationDate } from "../lib/format";
import { useJobApplications } from "../hooks/useApplications";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ApplicantAvatar } from "./ApplicantAvatar";

export function JobApplicantsPanel({
  jobId,
  jobTitle,
}: {
  jobId: string;
  jobTitle: string;
}) {
  const { applications, isLoading, isError, error, reload } =
    useJobApplications(jobId);

  const count = applications.length;
  const href = EMPLOYER_APPLICANT_ROUTES.listWithJob(jobId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonCard className="h-24" />
        <SkeletonCard className="h-40" />
      </div>
    );
  }

  if (isError) {
    return (
      <ErrorState
        title="Unable to load applicants."
        description={error ?? undefined}
        onRetry={() => void reload()}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm text-muted">Applicants</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-text">
            {count}
          </p>
          <p className="mt-1 text-xs text-muted">
            Candidates who applied for {jobTitle}
          </p>
        </div>
        <Button href={href}>
          <Users size={16} aria-hidden="true" />
          View Applicants
        </Button>
      </div>

      {count === 0 ? (
        <EmptyState
          icon={Users}
          title="No applicants for this job yet."
          description="When candidates apply to this role, their applications will appear here."
          action={
            <Button variant="secondary" href={EMPLOYER_APPLICANT_ROUTES.list}>
              Browse All Applicants
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-border bg-card shadow-soft">
          <ul className="divide-y divide-border">
            {applications.slice(0, 5).map((application) => (
              <li key={application.id}>
                <Link
                  href={EMPLOYER_APPLICANT_ROUTES.details(application.id)}
                  className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface/60"
                >
                  <ApplicantAvatar
                    name={application.candidateName}
                    avatarUrl={application.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-text">
                      {application.candidateName}
                    </p>
                    <p className="truncate text-xs text-muted">
                      {application.currentRole} ·{" "}
                      {formatApplicationDate(application.applicationDate)}
                    </p>
                  </div>
                  <ApplicationStatusBadge status={application.status} />
                </Link>
              </li>
            ))}
          </ul>
          {count > 5 ? (
            <div className="border-t border-border px-4 py-3 text-right">
              <Link
                href={href}
                className="text-sm font-semibold text-primary hover:text-accent"
              >
                View all {count} applicants
              </Link>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
