"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { JobPreviewView } from "../components/JobPreviewView";
import { EMPLOYER_JOB_ROUTES } from "../constants";
import { canPerformJobAction } from "../lib/actions";
import { useJob } from "../hooks/useJob";
import { jobService } from "../services/jobService";

export function JobPreviewPage({ jobId }: { jobId: string }) {
  const router = useRouter();
  const { job, isLoading, isError, error, reload } = useJob(jobId);
  const [publishing, setPublishing] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-8 w-56" />
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-72" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <ErrorState
        title="Unable to load job preview."
        description={error ?? undefined}
        onRetry={() => void reload()}
      />
    );
  }

  const canPublish = canPerformJobAction(job.status, "publish");

  const onPublish = async () => {
    setPublishing(true);
    try {
      const result = await jobService.publishJob(job.id);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("Job published successfully.");
      router.push(EMPLOYER_JOB_ROUTES.details(result.data.id));
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Job Preview
          </h1>
          <p className="mt-1 text-sm text-muted">
            Preview how candidates will see this opportunity.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" href={EMPLOYER_JOB_ROUTES.edit(job.id)}>
            Back to Edit
          </Button>
          {canPublish ? (
            <Button onClick={() => void onPublish()} disabled={publishing}>
              {publishing ? "Publishing…" : "Publish Job"}
            </Button>
          ) : null}
        </div>
      </div>

      <JobPreviewView job={job} />
    </div>
  );
}
