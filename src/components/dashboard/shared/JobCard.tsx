"use client";

import Link from "next/link";
import { Bookmark, MapPin } from "lucide-react";
import type { RecommendedJob } from "@/types/job";

export function DashboardJobCard({
  job,
  onSave,
}: {
  job: RecommendedJob;
  onSave?: (jobId: string) => void;
}) {
  return (
    <article className="flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lift">
      <div className="min-w-0 flex-1">
        <h3 className="text-base font-semibold text-text">{job.title}</h3>
        <p className="mt-0.5 text-sm text-muted">{job.company}</p>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin size={13} aria-hidden="true" />
            {job.location}
          </span>
          <span>{job.experience}</span>
          <span>{job.sapModule}</span>
          <span className="font-medium text-text">{job.salary}</span>
        </div>

        <p className="mt-3 text-xs text-muted">Posted {job.postedAt}</p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/candidate/jobs/${job.id}`}
          className="inline-flex h-9 items-center justify-center rounded-xl bg-primary px-3.5 text-sm font-semibold text-white transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
        >
          View Job
        </Link>
        <button
          type="button"
          onClick={() => onSave?.(job.id)}
          className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-border bg-surface px-3.5 text-sm font-semibold text-text transition hover:border-primary/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
          aria-label={`Save ${job.title}`}
        >
          <Bookmark size={15} aria-hidden="true" />
          Save
        </button>
      </div>
    </article>
  );
}
