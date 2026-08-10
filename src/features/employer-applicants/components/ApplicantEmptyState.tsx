import { Briefcase, SearchX, Users } from "lucide-react";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";
import { Button } from "@/components/ui/Button";
import { EMPLOYER_APPLICANT_ROUTES } from "../constants";

export function ApplicantEmptyState({
  variant,
  onClearSearch,
}: {
  variant:
    | "no-applicants"
    | "no-results"
    | "no-job-applicants"
    | "no-shortlisted";
  onClearSearch?: () => void;
}) {
  if (variant === "no-shortlisted") {
    return (
      <EmptyState
        icon={Users}
        title="No shortlisted candidates yet."
        description="Shortlist applicants from your pipeline to review them here."
        action={
          <Button href={EMPLOYER_APPLICANT_ROUTES.list}>View Applicants</Button>
        }
      />
    );
  }

  if (variant === "no-results") {
    return (
      <EmptyState
        icon={SearchX}
        title="No applicants match your search."
        description="Try a different keyword or clear your filters to see all applicants."
        action={
          onClearSearch ? (
            <Button variant="secondary" onClick={onClearSearch}>
              Clear Search
            </Button>
          ) : undefined
        }
      />
    );
  }

  if (variant === "no-job-applicants") {
    return (
      <EmptyState
        icon={Briefcase}
        title="No applicants for this job yet."
        description="When candidates apply to this role, their applications will appear here."
        action={
          <Button variant="secondary" href={EMPLOYER_APPLICANT_ROUTES.manageJobs}>
            Manage Jobs
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      icon={Users}
      title="No applicants yet"
      description="When candidates apply to your jobs, their applications will appear here."
      action={
        <Button href={EMPLOYER_APPLICANT_ROUTES.manageJobs}>Manage Jobs</Button>
      }
    />
  );
}
