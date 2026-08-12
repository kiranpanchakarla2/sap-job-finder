"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { useSavedJobs } from "../context/SavedJobsProvider";
import { DiscoveryJobCard } from "../components/DiscoveryJobCard";
import { JobListSkeleton } from "../components/JobStates";

export function SavedJobsPage() {
  const { savedJobs, removeSaved, savedCount, loading } = useSavedJobs();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-text sm:text-3xl">
          Saved Jobs
        </h1>
        <p className="mt-1 text-sm text-muted">
          Keep track of SAP opportunities you want to revisit.
          {savedCount ? ` · ${savedCount} saved` : ""}
        </p>
      </header>

      {loading ? (
        <JobListSkeleton count={3} />
      ) : savedJobs.length ? (
        <div className="grid gap-4">
          {savedJobs.map((job) => (
            <DiscoveryJobCard
              key={job.id}
              job={job}
              showRemove
              onRemove={(id) => void removeSaved(id)}
              showClosedBadge={job.status !== "active"}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-card px-6 py-16 text-center shadow-soft">
          <p className="text-base font-semibold text-text">You haven&apos;t saved any jobs yet.</p>
          <p className="mt-1 text-sm text-muted">
            Save jobs you&apos;re interested in and come back to them later.
          </p>
          <Button href="/candidate/jobs" className="mt-5 !h-10">
            Explore SAP Jobs
          </Button>
        </div>
      )}

      {savedJobs.length ? (
        <p className="text-center text-sm text-muted">
          Looking for more roles?{" "}
          <Link href="/candidate/jobs" className="font-semibold text-primary hover:text-accent">
            Explore SAP Jobs
          </Link>
        </p>
      ) : null}
    </div>
  );
}
