import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { MockJob } from "@/lib/mock-data";

type JobCardProps = {
  job: MockJob;
  showActions?: boolean;
  className?: string;
};

export function JobCard({ job, showActions = true, className = "" }: JobCardProps) {
  return (
    <article
      className={`group flex h-full flex-col rounded-[var(--radius-card)] border border-border bg-card p-5 shadow-soft transition duration-[var(--motion-hover-ms,180ms)] hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-lift ${className}`.trim()}
    >
      <div className="flex flex-1 gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
          {job.logo}
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link
                href={`/jobs/${job.id}`}
                className="line-clamp-2 text-base font-semibold leading-snug text-text hover:text-primary"
              >
                {job.title}
              </Link>
              <p className="mt-0.5 text-sm text-muted">{job.company}</p>
            </div>
            <button
              type="button"
              className="shrink-0 rounded-lg p-2 text-muted transition hover:bg-surface hover:text-primary"
              aria-label="Save job"
              title="Save (coming soon)"
            >
              <Heart size={18} />
            </button>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} /> {job.location}
            </span>
            <span>{job.salary}</span>
            <span>{job.experience}</span>
            <span>{job.workMode}</span>
          </div>

          <div className="mt-3 flex min-h-[3.25rem] flex-wrap content-start gap-1.5">
            {job.skills.slice(0, 4).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-badge px-2.5 py-1 text-[11px] font-medium text-badge-fg"
              >
                {skill}
              </span>
            ))}
          </div>

          {showActions ? (
            <div className="mt-auto flex gap-2 pt-4">
              <Button href={`/jobs/${job.id}`} className="px-4 py-2 text-xs">
                Apply
              </Button>
              <Button href={`/jobs/${job.id}`} variant="secondary" className="px-4 py-2 text-xs">
                View
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
