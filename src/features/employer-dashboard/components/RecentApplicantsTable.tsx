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
    <div className="overflow-x-auto">
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
            <tr key={applicant.id} className="border-b border-border/70 last:border-0">
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
      <div className="mt-4 flex justify-end px-3">
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
