import Link from "next/link";
import { Bookmark, MapPin } from "lucide-react";
import type { MockJob } from "@/lib/mock-data";

type FeaturedJobCardProps = {
  job: MockJob;
};

export function FeaturedJobCard({ job }: FeaturedJobCardProps) {
  return (
    <article
      className={`group flex h-full flex-col rounded-[var(--radius-card)] border border-border p-5 transition hover:border-primary/25 hover:shadow-soft ${
        job.highlight
          ? "bg-gradient-to-br from-warning/10 via-card to-primary/5"
          : "bg-card"
      }`}
    >
      <Link href={`/jobs/${job.id}`} className="block flex-1">
        <h3 className="text-lg font-bold leading-snug text-text transition group-hover:text-primary sm:text-xl">
          {job.title}
        </h3>
        <p className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <span className="text-xs font-bold uppercase tracking-wide text-success">
            {job.employmentType}
          </span>
          <span className="text-muted">
            Salary: <span className="text-text/80">{job.salary}</span>
          </span>
        </p>
      </Link>

      <div className="mt-6 flex items-end justify-between gap-3 border-t border-border/60 pt-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-base font-bold text-primary">
            {job.logo}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold text-text">{job.company}</p>
            <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-muted">
              <MapPin size={14} className="shrink-0" aria-hidden />
              {job.location}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-surface hover:text-primary"
          aria-label="Save job"
          title="Save (coming soon)"
        >
          <Bookmark size={20} strokeWidth={1.75} />
        </button>
      </div>
    </article>
  );
}
