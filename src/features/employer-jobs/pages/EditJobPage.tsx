"use client";

import { Ban } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { JobForm } from "../components/JobForm";
import { EMPLOYER_JOB_ROUTES } from "../constants";
import { useJob } from "../hooks/useJob";

export function EditJobPage({ jobId }: { jobId: string }) {
  const { job, isLoading, isError, error, reload } = useJob(jobId);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-80" />
        </div>
        <SkeletonCard className="h-72" />
        <SkeletonCard className="h-56" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <ErrorState
        title="Unable to load job."
        description={error ?? undefined}
        onRetry={() => void reload()}
      />
    );
  }

  if (job.status === "Closed") {
    return (
      <EmptyState
        icon={Ban}
        title="Closed jobs cannot be edited."
        description="Duplicate this posting if you want to reopen a similar opportunity."
        action={
          <Button href={EMPLOYER_JOB_ROUTES.details(job.id)} variant="secondary">
            View job details
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Edit Job
          </h1>
          <p className="mt-1 text-sm text-muted">
            Update posting details for {job.title}.
          </p>
        </div>
        <Button variant="secondary" href={EMPLOYER_JOB_ROUTES.details(job.id)}>
          View details
        </Button>
      </div>
      <JobForm mode="edit" initialData={job} />
    </div>
  );
}
