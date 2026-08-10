import Link from "next/link";
import { Briefcase } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import {
  StatusBadge,
  jobStatusTone,
} from "@/components/dashboard/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import type { EmployerJobSummary } from "../types/dashboard.types";

export function RecentJobsTable({ jobs }: { jobs: EmployerJobSummary[] }) {
  if (!jobs.length) {
    return (
      <EmptyState
        icon={Briefcase}
        title="No jobs posted yet"
        description="Start attracting SAP talent by posting your first job."
        action={<Button href={EMPLOYER_ROUTES.jobsNew}>Post Your First Job</Button>}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
            <th className="px-3 py-3 font-semibold">Job Title</th>
            <th className="px-3 py-3 font-semibold">SAP Module</th>
            <th className="px-3 py-3 font-semibold">Applications</th>
            <th className="px-3 py-3 font-semibold">Status</th>
            <th className="px-3 py-3 font-semibold">Posted</th>
            <th className="px-3 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} className="border-b border-border/70 last:border-0">
              <td className="px-3 py-3.5 font-medium text-text">
                <Link
                  href={EMPLOYER_ROUTES.jobDetails(job.id)}
                  className="hover:text-primary"
                >
                  {job.title}
                </Link>
              </td>
              <td className="px-3 py-3.5 text-muted">{job.sapModule}</td>
              <td className="px-3 py-3.5 text-muted">{job.applications}</td>
              <td className="px-3 py-3.5">
                <StatusBadge tone={jobStatusTone(job.status)}>{job.status}</StatusBadge>
              </td>
              <td className="px-3 py-3.5 text-muted">{job.postedAt}</td>
              <td className="px-3 py-3.5">
                <div className="flex gap-3">
                  <Link
                    href={EMPLOYER_ROUTES.jobDetails(job.id)}
                    className="text-xs font-semibold text-primary hover:text-accent"
                  >
                    View
                  </Link>
                  <Link
                    href={EMPLOYER_ROUTES.jobEdit(job.id)}
                    className="text-xs font-semibold text-muted hover:text-text"
                  >
                    Edit
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
