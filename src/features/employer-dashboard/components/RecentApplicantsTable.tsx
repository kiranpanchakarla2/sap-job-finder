import Link from "next/link";
import { Users } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import {
  StatusBadge,
  applicantStatusTone,
} from "@/components/dashboard/shared/StatusBadge";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_ROUTES } from "@/features/employer-company/constants";
import type { EmployerApplicantSummary } from "../types/dashboard.types";

export function RecentApplicantsTable({
  applicants,
}: {
  applicants: EmployerApplicantSummary[];
}) {
  if (!applicants.length) {
    return (
      <EmptyState
        icon={Users}
        title="No applications yet"
        description="Applications will appear here once candidates start applying to your jobs."
        action={<Button href={EMPLOYER_ROUTES.jobsNew}>Post a Job</Button>}
      />
    );
  }

  return (
    <div className="min-w-0">
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="px-3 py-3 font-semibold">Candidate</th>
              <th className="px-3 py-3 font-semibold">Job</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-3 py-3 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {applicants.map((applicant) => (
              <tr
                key={applicant.id}
                className="border-b border-border/70 last:border-0"
              >
                <td className="px-3 py-3.5">
                  <Link
                    href={EMPLOYER_ROUTES.applicantDetails(applicant.id)}
                    className="font-medium text-text hover:text-primary"
                  >
                    {applicant.candidate}
                  </Link>
                </td>
                <td className="px-3 py-3.5 text-muted">{applicant.position}</td>
                <td className="px-3 py-3.5">
                  <StatusBadge tone={applicantStatusTone(applicant.status)}>
                    {applicant.status}
                  </StatusBadge>
                </td>
                <td className="px-3 py-3.5 text-muted">{applicant.appliedAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {applicants.map((applicant) => (
          <li key={applicant.id}>
            <Link
              href={EMPLOYER_ROUTES.applicantDetails(applicant.id)}
              className="block min-w-0 rounded-2xl border border-border bg-surface/40 p-3.5 transition hover:border-primary/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text">
                    {applicant.candidate}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {applicant.position}
                  </p>
                </div>
                <StatusBadge tone={applicantStatusTone(applicant.status)}>
                  {applicant.status}
                </StatusBadge>
              </div>
              <p className="mt-2 text-[11px] text-muted">{applicant.appliedAt}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex justify-end">
        <Link
          href={EMPLOYER_ROUTES.applicants}
          className="text-sm font-semibold text-primary hover:text-accent"
        >
          View All Applicants
        </Link>
      </div>
    </div>
  );
}
