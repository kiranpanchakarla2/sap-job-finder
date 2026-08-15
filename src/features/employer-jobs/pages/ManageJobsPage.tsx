"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, History, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/dashboard/shared/ErrorState";
import { Skeleton, SkeletonCard } from "@/components/dashboard/shared/Skeleton";
import { JobCard } from "../components/JobCard";
import { JobConfirmationDialog } from "../components/JobConfirmationDialog";
import { JobEmptyState } from "../components/JobEmptyState";
import { JobFilters } from "../components/JobFilters";
import { JobSearch } from "../components/JobSearch";
import { JobTable } from "../components/JobTable";
import { EMPLOYER_JOB_ROUTES } from "../constants";
import { useJobMutations } from "../hooks/useJobMutations";
import { useJobs } from "../hooks/useJobs";
import type { JobSortOption, JobStatusFilter } from "../types/job.types";

export function ManageJobsPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<JobStatusFilter>("All");
  const [sort, setSort] = useState<JobSortOption>("newest");

  const query = useMemo(
    () => ({ search, status, sort }),
    [search, status, sort],
  );

  const { jobs, isLoading, isError, error, reload } = useJobs(query);
  const {
    confirmOpen,
    confirmCopy,
    confirmLoading,
    closeConfirm,
    confirmAction,
    handleAction,
  } = useJobMutations(() => void reload());

  const hasFilters = Boolean(search.trim()) || status !== "All";

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
            Manage Jobs
          </h1>
          <p className="mt-1 text-sm text-muted">
            Create, manage and track your SAP job postings.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" href={EMPLOYER_JOB_ROUTES.bulkUploadHistory}>
            <History size={16} aria-hidden="true" />
            Upload History
          </Button>
          <Button variant="secondary" href={EMPLOYER_JOB_ROUTES.bulkUpload}>
            <FileSpreadsheet size={16} aria-hidden="true" />
            Bulk Upload Jobs
          </Button>
          <Button href={EMPLOYER_JOB_ROUTES.create}>
            <PlusCircle size={16} aria-hidden="true" />
            Post a Job
          </Button>
        </div>
      </div>


      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <JobSearch value={search} onChange={setSearch} />
        <JobFilters
          status={status}
          sort={sort}
          onStatusChange={setStatus}
          onSortChange={setSort}
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="hidden h-12 w-full md:block" />
          <div className="grid gap-3 md:hidden">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <SkeletonCard className="hidden h-64 md:block" />
        </div>
      ) : null}

      {isError ? (
        <ErrorState
          title="Unable to load your jobs. Please try again."
          description={error ?? undefined}
          onRetry={() => void reload()}
        />
      ) : null}

      {!isLoading && !isError && jobs.length === 0 ? (
        <JobEmptyState
          variant={hasFilters ? "no-results" : "no-jobs"}
          onClearSearch={
            hasFilters
              ? () => {
                  setSearch("");
                  setStatus("All");
                }
              : undefined
          }
        />
      ) : null}

      {!isLoading && !isError && jobs.length > 0 ? (
        <>
          <JobTable jobs={jobs} onAction={handleAction} />
          <div className="grid gap-3 md:hidden">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} onAction={handleAction} />
            ))}
          </div>
        </>
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
