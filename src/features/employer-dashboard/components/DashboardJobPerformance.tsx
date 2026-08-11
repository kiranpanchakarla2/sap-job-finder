import Link from "next/link";
import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import type { EmployerJobPerformanceSummary } from "../types/dashboard.types";

export function DashboardJobPerformance({
  jobs,
}: {
  jobs: EmployerJobPerformanceSummary[];
}) {
  if (!jobs.length) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No active job performance yet"
        description="Post and activate jobs to see top performing roles here."
        action={<Button href={EMPLOYER_ROUTES.jobsNew}>Post a Job</Button>}
      />
    );
  }

  return (
    <div>
      <ul className="space-y-3">
        {jobs.map((job) => (
          <li
            key={job.jobId}
            className="rounded-2xl border border-border bg-surface/40 px-4 py-3"
          >
            <p className="text-sm font-semibold text-text">{job.title}</p>
            <p className="mt-1 text-xs text-muted">
              {job.applications} applications · {job.interviews} interviews ·{" "}
              {job.hires} hires
            </p>
          </li>
        ))}
      </ul>
      <div className="mt-4">
        <Link
          href={EMPLOYER_ROUTES.analytics}
          className="text-sm font-semibold text-primary hover:text-accent"
        >
          View Analytics
        </Link>
      </div>
    </div>
  );
}
